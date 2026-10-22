from django.contrib import admin
from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        'is_active',
        'code',
        'description',
        'discount_type',
        'discount_value',
        'min_purchase',
        'max_discount',
        'valid_from', 
        'valid_to',
        'usage_limit',
        'used_count'
        )
    list_filter = (
        'discount_type',
        'valid_from',
        'valid_to',
        'is_active',
        )
    search_fields = (
        'code',
        'description' ,
        )
    readonly_fields = (
        'used_count',
        'created_at',
        'updated_at'
        )
    ordering = ('-created_at',)