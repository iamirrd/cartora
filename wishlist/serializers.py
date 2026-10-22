from rest_framework import serializers
from .models import Wishlist , WishlistItem

class WishlistSerializer(serializers.ModelSerializer):
    
    user_email = serializers.CharField(source='user.email' , read_only=True)
    user_name  = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Wishlist
        fields = (
            'id',
            'user',
            'created_at',
            'user_email',
            'user_name',
            'items_count',
            )
        read_only_fields = (
            'id',
            'created_at',
            'user',
            'user_email',
            'user_name',
            )
    def get_user_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.email
        
    def get_items_count(self, obj):
            return obj.items_count
    

class WishlistItemSerializer(serializers.ModelSerializer):
    
    variant_name = serializers.CharField(source='variant.name' , read_only=True)

    class Meta:
        model = WishlistItem
        fields = (
            'id',
            'wishlist',
            'variant',
            'variant_name',
            'created_at',
            )
        read_only_fields = (
            'id',
            'created_at',
            'wishlist', 
            )