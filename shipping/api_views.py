from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet 
from .models import ShippingMethod
from .serializers import ShippingMethodSerializer
from common.permissions import AllReadAdminWrite

class ShippingMethodViewSet(ModelViewSet):
    permission_classes = [AllReadAdminWrite]
    serializer_class = ShippingMethodSerializer
    
    def get_queryset(self):
        queryset = ShippingMethod.objects.all()
        return queryset if self.request.user.is_staff else queryset.filter(is_active=True)
    