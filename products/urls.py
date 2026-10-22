from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    CategoryViewSet,
    BrandViewSet,
    ProductViewSet,
    ProductImageViewSet,
    ProductVariantViewSet,
    InventoryViewSet,
)


router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('brands', BrandViewSet, basename='brand')
router.register('products', ProductViewSet, basename='product')
router.register('product-images', ProductImageViewSet, basename='product-image')
router.register('product-variants', ProductVariantViewSet, basename='product-variant')
router.register('inventories', InventoryViewSet, basename='inventory')


urlpatterns = [
    path('', include(router.urls)),
]