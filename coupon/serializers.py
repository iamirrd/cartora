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
    def validate(self, attrs):
        def value(name):
            return attrs.get(name, getattr(self.instance, name, None))
        if value('valid_from') >= value('valid_to'):
            raise serializers.ValidationError({'valid_to': 'Expiry must follow the start date.'})
        discount = value('discount_value')
        if discount <= 0 or (value('discount_type') == 'percentage' and discount > 100):
            raise serializers.ValidationError({'discount_value': 'Invalid discount value.'})
        for field in ('min_purchase', 'max_discount'):
            if value(field) is not None and value(field) < 0:
                raise serializers.ValidationError({field: 'Value cannot be negative.'})
        if value('usage_limit') < 1:
            raise serializers.ValidationError({'usage_limit': 'Usage limit must be positive.'})
        return attrs
