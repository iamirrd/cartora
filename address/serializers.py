from rest_framework import serializers
from .models import Address

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            'id', 'title', 'receiver_name', 'receiver_phone',
            'province', 'city', 'postal_code', 'full_address', 'is_default',
            'is_active', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at' , 'user' , 'is_active')