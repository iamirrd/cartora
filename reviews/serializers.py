from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    
    user_email = serializers.CharField(source='user.email' , read_only=True)
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
            'user_email',
            'user_name',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
            'user',
            'is_approved',
            'user_email',
            'user_name',
        )   
    def get_user_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.email
        
     