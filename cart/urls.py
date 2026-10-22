from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    CartViewSet,
    CartItemViewSet,
)


router = DefaultRouter()
router.register('carts', CartViewSet, basename='cart')
router.register('items', CartItemViewSet, basename='cart-item')


urlpatterns = [
    path('', include(router.urls)),
]