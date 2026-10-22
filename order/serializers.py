from rest_framework import serializers
from .models import Order, OrderItem


class OrderSerializer(serializers.ModelSerializer):
    
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id',
            'user',
            'status',
            'order_number',
            'receiver_name',
            'receiver_phone',
            'province',
            'city',
            'postal_code',
            'full_address',
            'total_price',
        )
        read_only_fields = (
            'id',
            'user',
            'status',
            'order_number',
            'total_price',
        )
            
    def get_total_price(self, obj):
        return obj.total_price
    

class OrderItemSerializer(serializers.ModelSerializer):
    
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = (
            'id',
            'order',
            'variant',
            'product_name',
            'variant_name',
            'price',
            'quantity',
            'subtotal',
        )
        read_only_fields = (
            'id',
            'order',
            'product_name',
            'variant_name',
            'price',
            'subtotal',
        )
    def get_subtotal(self, obj):
        return obj.subtotal