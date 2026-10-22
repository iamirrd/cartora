from .models import Review
from .serializers import ReviewSerializer
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated , IsAuthenticatedOrReadOnly

class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        return Review.objects.filter(is_approved=True).select_related('product', 'user')
    
    def perform_create(self, serializer):        
        serializer.save(user=self.request.user)
