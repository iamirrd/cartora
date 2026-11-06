from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):

    user_name  = serializers.SerializerMethodField()


    class Meta:
        model = Review
        fields = (
            'id',
            'title',
            'product',
            'user',
            'rating',
            'comment',
            'is_approved',
            'created_at',
            'updated_at',
            'user_name',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
            'user',
            'is_approved',
            'user_name',
        )
    def get_user_name(self, obj) -> str:
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or "Customer"


    def validate_product(self, value):
        if not value.is_active:
            raise serializers.ValidationError('This product is unavailable.')
        return value
