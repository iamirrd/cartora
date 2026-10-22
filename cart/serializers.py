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
    
    def get_total_price(self, obj):
        return obj.total_price
    
    def get_items_count(self, obj):
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
    
    def get_unit_price(self, obj):
        return obj.unit_price
    
    def get_subtotal(self, obj):
        return obj.subtotal