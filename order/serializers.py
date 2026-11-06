from decimal import Decimal
from coupon.models import Coupon
from rest_framework import serializers
from .models import Order, OrderItem, OrderStatus


class OrderSerializer(serializers.ModelSerializer):
    
    coupon_code = serializers.SlugRelatedField(
        source='coupon', slug_field='code', queryset=Coupon.objects.all(),
        required=False, allow_null=True,
    )
    receiver_phone = serializers.RegexField(r'^09[0-9]{9}$')
    postal_code = serializers.RegexField(r'^[0-9]{10}$')
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
            'shipping_method', 'shipping_cost', 'coupon_code', 'discount_amount',
            'total_price',
        )
        read_only_fields = (
            'id',
            'user',
            'status',
            'order_number',
            'shipping_cost', 'discount_amount',
            'total_price',
        )
            
    def get_total_price(self, obj) -> Decimal:
        return obj.total_price
    

    def validate_shipping_method(self, value):
        if value is not None and (not value.is_active or value.cost < 0):
            raise serializers.ValidationError('This shipping method is unavailable.')
        return value

    def validate_coupon_code(self, value):
        if value is not None and not value.is_valid:
            raise serializers.ValidationError('This coupon is expired or exhausted.')
        return value

    def create(self, validated_data):
        shipping = validated_data.get('shipping_method')
        validated_data['shipping_cost'] = shipping.cost if shipping else 0
        return super().create(validated_data)

    def update(self, instance, validated_data):
        shipping = validated_data.get('shipping_method', instance.shipping_method)
        validated_data['shipping_cost'] = shipping.cost if shipping else 0
        return super().update(instance, validated_data)


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
            'product_name',
            'variant_name',
            'price',
            'subtotal',
        )
    def get_subtotal(self, obj) -> Decimal:
        return obj.subtotal
    def validate(self, attrs):
        order = attrs.get('order', getattr(self.instance, 'order', None))
        if order.user_id != self.context['request'].user.pk:
            raise serializers.ValidationError({'order': 'Invalid order.'})
        if self.instance and order.pk != self.instance.order_id:
            raise serializers.ValidationError({'order': 'An item cannot be moved to another order.'})
        if order.status != OrderStatus.PENDING:
            raise serializers.ValidationError({'order': 'Only pending orders can be edited.'})
        variant = attrs.get('variant', getattr(self.instance, 'variant', None))
        if variant is None or not variant.is_active or not variant.product.is_active:
            raise serializers.ValidationError({'variant': 'This product is unavailable.'})
        quantity = attrs.get('quantity', getattr(self.instance, 'quantity', 0))
        inventory = getattr(variant, 'inventory', None)
        if quantity < 1 or inventory is None or not inventory.is_active or quantity > inventory.quantity:
            raise serializers.ValidationError({'quantity': 'Invalid quantity or insufficient stock.'})
        return attrs
