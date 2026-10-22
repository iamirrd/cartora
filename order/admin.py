
from django.contrib import admin
from .models import Order, OrderItem


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 'user', 'status',
        'get_total_price',
        'is_active', 'created_at',
    )
    list_filter = ('status', 'is_active', 'created_at')
    search_fields = ('order_number', 'user__email', 'user__phone')
    ordering = ('-created_at',)
    list_select_related = ('user',)
    readonly_fields = ('created_at', 'updated_at', 'order_number')
    autocomplete_fields = ('user',)
    
    def get_total_price(self, obj):
        return f"{obj.total_price:,} تومان"
    get_total_price.short_description = 'جمع کل'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'order', 'product_name', 'variant_name',
        'price', 'quantity',
        'get_subtotal',
        'is_active', 'created_at',
    )
    list_filter = ('is_active', 'created_at')
    search_fields = (
        'order__order_number',
        'order__user__email',
        'order__user__phone',
        'product_name',
        'variant_name',
    )
    ordering = ('-created_at',)
    list_select_related = ('order', 'order__user', 'variant')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('order', 'variant')
    
    def get_subtotal(self, obj):
        return f"{obj.subtotal:,}"
    get_subtotal.short_description = 'جمع'
