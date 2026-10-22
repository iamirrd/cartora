from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import AddressViewSet


router = DefaultRouter()
router.register('addresses', AddressViewSet, basename='address')


urlpatterns = [
    path('', include(router.urls)),
]