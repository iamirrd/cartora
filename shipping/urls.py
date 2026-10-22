from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api_views import ShippingMethodViewSet


router = DefaultRouter()
router.register('shipping-methods', ShippingMethodViewSet, basename='shipping-method')


urlpatterns = [
    path('', include(router.urls)),
]