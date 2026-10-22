from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from .models import Order , OrderItem
from .serializers import OrderSerializer , OrderItemSerializer
from rest_framework.permissions import IsAuthenticated
from notification.services import send_notification_to_user
from notification.models import NotificationType

class OrderViewSet(ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        order = serializer.save(user=self.request.user)
        
        send_notification_to_user(
            user=self.request.user,
            title="سفارش ثبت شد",
            message=f"سفارش {order.order_number} با موفقیت ثبت شد.",
            notif_type=NotificationType.ORDER
        )
    
class OrderItemViewSet(ModelViewSet):
    serializer_class =  OrderItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return OrderItem.objects.filter(order__user=self.request.user)
    
    def perform_create(self, serializer):
        variant = serializer.validated_data['variant']
        serializer.save(
            product_name=variant.product.name,
            variant_name=variant.name,
            price=variant.price,
        )