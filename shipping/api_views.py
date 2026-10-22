from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet 
from .models import ShippingMethod
from .serializers import ShippingMethodSerializer
from common.permissions import AllReadAdminWrite

class ShippingMethodViewSet(ModelViewSet):
    permission_classes = [AllReadAdminWrite]
    serializer_class = ShippingMethodSerializer
    
    def get_queryset(self):
        return ShippingMethod.objects.filter(is_active=True)
    