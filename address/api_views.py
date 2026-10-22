

from rest_framework.viewsets import ModelViewSet
from .models import Address
from .serializers import AddressSerializer
from rest_framework.permissions import IsAuthenticated


class AddressViewSet(ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)