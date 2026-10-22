from django.contrib import admin
from .models import *

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__email', 'user__phone')
    ordering = ('-created_at',)
    list_select_related = ('user',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'variant', 'quantity', 'get_unit_price', 'get_subtotal', 'created_at', 'updated_at')
    list_filter = ('is_active', 'cart')
    search_fields = ('cart__user__email', 'cart__user__phone', 'variant__name', 'variant__product__name')
    ordering = ('-created_at',)    
    list_select_related = ('cart', 'variant', 'variant__product')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_unit_price(self, obj):
        return obj.unit_price

    def get_subtotal(self, obj):
        return obj.subtotal 