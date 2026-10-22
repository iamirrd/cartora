from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ('id', 'order', 'order_number', 'amount', 'status', 'ref_id', 'created_at')
        read_only_fields = fields


class PaymentRequestSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()