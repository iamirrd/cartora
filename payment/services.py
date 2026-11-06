import uuid
from collections import Counter

from django.conf import settings
from django.db import transaction
from django.db.models import F

from coupon.models import Coupon
from order.models import Order, OrderStatus
from products.models import Inventory
from .models import Transaction, Gateway


class MockPaymentGateway:
    """Development simulator; never enabled implicitly in production."""

    def create_payment(self, amount):
        return f"MOCK-{uuid.uuid4().hex.upper()}"

    def verify_payment(self, authority, amount):
        return True, f"REF-{uuid.uuid4().hex.upper()}"


def payment_url(authority):
    return f"/api/payment/verify/?authority={authority}&status=OK"


def locked_stock(order):
    quantities = Counter()
    for item in order.items.select_related('variant__product'):
        if item.variant is None or not item.variant.is_active or not item.variant.product.is_active:
            return None, 'An ordered product is unavailable.'
        if item.quantity < 1 or item.price < 0:
            return None, 'Invalid order item.'
        quantities[item.variant_id] += item.quantity
    if not quantities:
        return None, 'The order is empty.'
    inventories = list(Inventory.objects.select_for_update().filter(
        variant_id__in=quantities
    ).order_by('variant_id'))
    if len(inventories) != len(quantities) or any(
        not stock.is_active or stock.quantity < quantities[stock.variant_id]
        for stock in inventories
    ):
        return None, 'Insufficient stock.'
    return [(stock, quantities[stock.variant_id]) for stock in inventories], None


@transaction.atomic
def process_payment(order_id, user):
    if not settings.ENABLE_MOCK_PAYMENTS:
        return False, 'No live payment gateway is configured.'
    try:
        order = Order.objects.select_for_update().get(id=order_id, user=user, is_active=True)
    except Order.DoesNotExist:
        return False, 'Order not found.'
    if order.status != OrderStatus.PENDING:
        return False, 'This order cannot be paid.'
    pending = order.transactions.filter(status=Transaction.Status.PENDING).first()
    if pending:
        return True, payment_url(pending.authority)
    stocks, error = locked_stock(order)
    if error:
        return False, error
    if order.coupon_id:
        coupon = Coupon.objects.select_for_update().get(pk=order.coupon_id)
        if not coupon.is_valid or order.subtotal < coupon.min_purchase:
            return False, 'The coupon is no longer valid for this order.'
        order.discount_amount = coupon.calculate_discount(order.subtotal)
    else:
        order.discount_amount = 0
    if order.shipping_cost < 0:
        return False, 'Invalid shipping cost.'
    order.save(update_fields=['discount_amount', 'updated_at'])
    amount = order.total_price
    if amount <= 0 or amount > 999999999999:
        return False, 'The order total must be between 1 and 999999999999.'
    gateway, _ = Gateway.objects.get_or_create(code='mock', defaults={'name': 'Mock gateway'})
    if not gateway.is_active:
        return False, 'The payment gateway is disabled.'
    authority = MockPaymentGateway().create_payment(amount)
    Transaction.objects.create(
        order=order, gateway=gateway, user=user, amount=amount,
        status=Transaction.Status.PENDING, authority=authority,
    )
    return True, payment_url(authority)


@transaction.atomic
def verify_payment(authority, status_param):
    if not settings.ENABLE_MOCK_PAYMENTS:
        return False, 'Mock payments are disabled.'
    try:
        candidate = Transaction.objects.get(authority=authority)
        order = Order.objects.select_for_update().get(pk=candidate.order_id)
        txn = Transaction.objects.select_for_update().get(pk=candidate.pk)
    except (Transaction.DoesNotExist, Transaction.MultipleObjectsReturned):
        return False, 'Transaction not found.'
    if txn.status == Transaction.Status.SUCCESS:
        return True, 'Payment already verified.'
    if txn.status != Transaction.Status.PENDING:
        return False, 'This transaction is no longer pending.'

    def fail(message):
        txn.status = Transaction.Status.FAILED
        txn.save(update_fields=['status', 'updated_at'])
        return False, message

    if txn.gateway.code != 'mock' or not txn.gateway.is_active:
        return fail('Invalid payment gateway.')
    if not order.is_active or order.status != OrderStatus.PENDING or txn.amount != order.total_price:
        return fail('Order status or amount has changed.')
    if status_param != 'OK':
        return fail('Payment cancelled or failed.')
    stocks, error = locked_stock(order)
    if error:
        return fail(error)
    coupon = None
    if order.coupon_id:
        coupon = Coupon.objects.select_for_update().get(pk=order.coupon_id)
        if (not coupon.is_valid or order.subtotal < coupon.min_purchase
                or coupon.calculate_discount(order.subtotal) != order.discount_amount):
            return fail('The coupon is no longer valid.')
    success, ref_id = MockPaymentGateway().verify_payment(authority, txn.amount)
    if not success:
        return fail('Payment verification failed.')
    for stock, quantity in stocks:
        Inventory.objects.filter(pk=stock.pk).update(quantity=F('quantity') - quantity)
    if coupon:
        Coupon.objects.filter(pk=coupon.pk).update(used_count=F('used_count') + 1)
    txn.status = Transaction.Status.SUCCESS
    txn.ref_id = ref_id
    txn.save(update_fields=['status', 'ref_id', 'updated_at'])
    order.status = OrderStatus.PAID
    order.save(update_fields=['status', 'updated_at'])
    return True, 'Payment completed successfully.'
