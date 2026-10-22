import uuid
from django.db import transaction
from django.utils import timezone
from .models import Transaction, Gateway
from order.models import Order, OrderStatus


class MockPaymentGateway:
    """درگاه شبیه‌ساز (برای تست)."""
    
    def create_payment(self, amount):
        return f"MOCK-{uuid.uuid4().hex[:10].upper()}"
    
    def verify_payment(self, authority, amount):
        # همیشه موفق
        return True, f"REF-{uuid.uuid4().hex[:8].upper()}"


@transaction.atomic
def process_payment(order_id, user):
    """شروع پرداخت."""
    try:
        order = Order.objects.get(id=order_id, user=user)
    except Order.DoesNotExist:
        return False, "سفارش یافت نشد"
    
    if order.status != OrderStatus.PENDING:
        return False, "این سفارش قابل پرداخت نیست"
    
    gateway, _ = Gateway.objects.get_or_create(
        code='mock',
        defaults={'name': 'درگاه شبیه‌ساز'}
    )
    
    txn = Transaction.objects.create(
        order=order,
        gateway=gateway,
        user=user,
        amount=order.total_price,
        status=Transaction.Status.PENDING,
    )
    
    service = MockPaymentGateway()
    authority = service.create_payment(order.total_price)
    txn.authority = authority
    txn.save()
    
    return True, f"/api/payment/verify/?authority={authority}&status=OK"


@transaction.atomic
def verify_payment(authority, status_param):
    """تأیید پرداخت."""
    try:
        txn = Transaction.objects.get(authority=authority, status=Transaction.Status.PENDING)
    except Transaction.DoesNotExist:
        return False, "تراکنش یافت نشد"
    
    if status_param != 'OK':
        txn.status = Transaction.Status.FAILED
        txn.save()
        return False, "پرداخت ناموفق"
    
    service = MockPaymentGateway()
    is_success, ref_id = service.verify_payment(authority, txn.amount)
    
    if is_success:
        txn.status = Transaction.Status.SUCCESS
        txn.ref_id = ref_id
        txn.save()
        
        order = txn.order
        order.status = OrderStatus.PAID
        order.save()
        
        return True, "پرداخت با موفقیت انجام شد"
    
    txn.status = Transaction.Status.FAILED
    txn.save()
    return False, "تأیید پرداخت ناموفق"