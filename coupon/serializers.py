from rest_framework import serializers
from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            'id', 'code', 'description',
            'discount_type', 'discount_value',
            'min_purchase', 'max_discount',
            'valid_from', 'valid_to',
            'usage_limit', 'used_count',
            'is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id',
            'used_count',
            'created_at', 'updated_at',
        )