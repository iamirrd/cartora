from decimal import Decimal
from rest_framework import serializers
from .models import Cart, CartItem
from accounts.models import User

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone')
        read_only_fields = fields


class CartSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = (
            'id', 'user',
            'total_price', 'items_count',
            'is_active', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def get_total_price(self, obj) -> Decimal:
        return obj.total_price
    
    def get_items_count(self, obj) -> int:
        return obj.items_count


class CartItemSerializer(serializers.ModelSerializer):
    unit_price = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = (
            'id', 'variant', 'quantity',
            'price', 'discount_price',
            'unit_price', 'subtotal',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'price', 'discount_price',
            'created_at', 'updated_at',
        )
    
    def get_unit_price(self, obj) -> Decimal:
        return obj.unit_price
    
    def get_subtotal(self, obj) -> Decimal:
        return obj.subtotal
    def validate(self, attrs):
        variant = attrs.get('variant', getattr(self.instance, 'variant', None))
        quantity = attrs.get('quantity', getattr(self.instance, 'quantity', 1))
        if not variant.is_active or not variant.product.is_active:
            raise serializers.ValidationError({'variant': 'This product is unavailable.'})
        inventory = getattr(variant, 'inventory', None)
        if inventory is None or not inventory.is_active or quantity > inventory.quantity:
            raise serializers.ValidationError({'quantity': 'Insufficient stock.'})
        return attrs

    def update(self, instance, validated_data):
        variant = validated_data.get('variant', instance.variant)
        validated_data['price'] = variant.price
        validated_data['discount_price'] = variant.discount_price
        return super().update(instance, validated_data)
