from rest_framework import serializers
from .models import ShippingMethod

class ShippingMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingMethod
        fields = ('id', 'name',
                  'cost', 'delivery_time',
                  'description' , 'is_active' ,
                  'created_at' , 'updated_at'
                  )
        read_only_fields = ('id', 'created_at' , 'updated_at')
    def validate_cost(self, value):
        if value < 0:
            raise serializers.ValidationError('Shipping cost cannot be negative.')
        return value
