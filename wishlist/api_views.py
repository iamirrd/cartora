from .models import Wishlist , WishlistItem
from .serializers import WishlistSerializer , WishlistItemSerializer
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

class WishlistViewSet(ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):        
        serializer.save(user=self.request.user)
    
class WishlistItemViewSet(ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WishlistItem.objects.filter(wishlist__user=self.request.user)
    
    def perform_create(self, serializer):    
        wishlist, _ = Wishlist.objects.get_or_create(user=self.request.user)
        serializer.save(wishlist=wishlist)