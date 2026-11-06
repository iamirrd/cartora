from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from cart.models import Cart, CartItem
from notification.models import NotificationType
from notification.services import send_notification_to_user
from .models import Order, OrderItem, OrderStatus
from .serializers import OrderSerializer, OrderItemSerializer


def lock_editable_order(order_id):
    order = Order.objects.select_for_update().get(pk=order_id)
    if order.status != OrderStatus.PENDING or order.transactions.filter(status__in=['pending', 'success']).exists():
        raise ValidationError('This order can no longer be edited.')
    return order


def refresh_discount(order):
    order.discount_amount = order.coupon.calculate_discount(order.subtotal) if order.coupon_id else 0
    order.save(update_fields=['discount_amount', 'updated_at'])


def notify_order(order):
    send_notification_to_user(
        user=order.user, title='????? ??? ??',
        message=f'????? {order.order_number} ?? ?????? ??? ??.',
        notif_type=NotificationType.ORDER,
    )


class OrderViewSet(ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user_id=self.request.user.pk).select_related('coupon', 'shipping_method')

    @transaction.atomic
    def perform_create(self, serializer):
        order = serializer.save(user=self.request.user)
        transaction.on_commit(lambda: notify_order(order), robust=True)

    @transaction.atomic
    def perform_update(self, serializer):
        serializer.instance = lock_editable_order(serializer.instance.pk)
        order = serializer.save()
        refresh_discount(order)

    @transaction.atomic
    def perform_destroy(self, instance):
        order = lock_editable_order(instance.pk)
        if order.transactions.exists():
            raise ValidationError('Orders with payment records cannot be deleted.')
        order.delete()

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def checkout(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = Cart.objects.select_for_update().filter(user=request.user, is_active=True).first()
        if cart is None:
            raise ValidationError('The cart is empty.')
        items = list(CartItem.objects.select_for_update().filter(cart=cart).select_related('variant__product').order_by('variant_id'))
        if not items:
            raise ValidationError('The cart is empty.')
        # Validate the whole cart before creating any order records.
        from cart.serializers import CartItemSerializer
        for item in items:
            validator = CartItemSerializer(item, data={'quantity': item.quantity}, partial=True, context=self.get_serializer_context())
            validator.is_valid(raise_exception=True)
        order = serializer.save(user=request.user)
        OrderItem.objects.bulk_create([
            OrderItem(
                order=order, variant=item.variant,
                product_name=item.variant.product.name, variant_name=item.variant.name,
                quantity=item.quantity,
                price=item.variant.discount_price if item.variant.discount_price is not None else item.variant.price,
            ) for item in items
        ])
        refresh_discount(order)
        cart.items.all().delete()
        transaction.on_commit(lambda: notify_order(order), robust=True)
        return Response(self.get_serializer(order).data, status=status.HTTP_201_CREATED)


class OrderItemViewSet(ModelViewSet):
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OrderItem.objects.filter(order__user_id=self.request.user.pk).select_related('order', 'variant__product')

    @transaction.atomic
    def perform_create(self, serializer):
        order = lock_editable_order(serializer.validated_data['order'].pk)
        variant = serializer.validated_data['variant']
        serializer.save(
            product_name=variant.product.name, variant_name=variant.name,
            price=variant.discount_price if variant.discount_price is not None else variant.price,
        )
        refresh_discount(order)

    @transaction.atomic
    def perform_update(self, serializer):
        order = lock_editable_order(serializer.instance.order_id)
        serializer.instance = get_object_or_404(OrderItem, pk=serializer.instance.pk)
        variant = serializer.validated_data.get('variant', serializer.instance.variant)
        serializer.save(
            product_name=variant.product.name, variant_name=variant.name,
            price=variant.discount_price if variant.discount_price is not None else variant.price,
        )
        refresh_discount(order)

    @transaction.atomic
    def perform_destroy(self, instance):
        order = lock_editable_order(instance.order_id)
        instance.delete()
        refresh_discount(order)
