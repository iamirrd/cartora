from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Wishlist , WishlistItem
from .serializers import WishlistSerializer , WishlistItemSerializer
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

class WishlistViewSet(ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Wishlist.objects.filter(user_id=self.request.user.pk)
    
    def perform_create(self, serializer):        
        wishlist, created = Wishlist.objects.get_or_create(user=self.request.user)
        if not created:
            raise ValidationError('A wishlist already exists for this user.')
        serializer.instance = wishlist
    
class WishlistItemViewSet(ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WishlistItem.objects.filter(wishlist__user_id=self.request.user.pk)
    
    @transaction.atomic
    def perform_create(self, serializer):
        wishlist, _ = Wishlist.objects.get_or_create(user=self.request.user)
        Wishlist.objects.select_for_update().get(pk=wishlist.pk)
        if wishlist.items.filter(variant=serializer.validated_data['variant']).exists():
            raise ValidationError({'variant': 'This variant is already in your wishlist.'})
        serializer.save(wishlist=wishlist)
    @transaction.atomic
    def perform_update(self, serializer):
        Wishlist.objects.select_for_update().get(pk=serializer.instance.wishlist_id)
        serializer.instance = get_object_or_404(WishlistItem, pk=serializer.instance.pk)
        variant = serializer.validated_data.get('variant', serializer.instance.variant)
        if serializer.instance.wishlist.items.filter(variant=variant).exclude(pk=serializer.instance.pk).exists():
            raise ValidationError({'variant': 'This variant is already in your wishlist.'})
        serializer.save()
