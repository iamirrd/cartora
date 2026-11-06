from rest_framework.viewsets import ModelViewSet
from .models import Category, Brand, Product, ProductImage, ProductVariant, Inventory
from .serializers import (
    CategorySerializer,
    BrandSerializer,
    ProductSerializer,
    ProductImageSerializer,
    ProductVariantSerializer,
    InventorySerializer,
)
from rest_framework.permissions import IsAdminUser
from common.permissions import AllReadAdminWrite
from .filters import ProductFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter


class BaseViewSet(ModelViewSet):
    permission_classes = [AllReadAdminWrite]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_staff:
            return queryset
        queryset = queryset.filter(is_active=True)
        if queryset.model in (ProductImage, ProductVariant):
            queryset = queryset.filter(product__is_active=True, product__category__is_active=True, product__brand__is_active=True)
        if queryset.model is Product:
            from django.db.models import Prefetch
            queryset = queryset.filter(category__is_active=True, brand__is_active=True).prefetch_related(None).prefetch_related(
                Prefetch('images', queryset=ProductImage.objects.filter(is_active=True)),
                Prefetch('variants', queryset=ProductVariant.objects.filter(is_active=True)),
            )
        return queryset

class CategoryViewSet(BaseViewSet):
    queryset = Category.objects.select_related('parent').all()
    serializer_class = CategorySerializer

class BrandViewSet(BaseViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class ProductViewSet(BaseViewSet):
    queryset = (
        Product.objects
        .select_related('category', 'brand')
        .prefetch_related('images', 'variants')
    )    
    serializer_class = ProductSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'category__name', 'brand__name']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']
    
class ProductImageViewSet(BaseViewSet):
    queryset = ProductImage.objects.select_related('product').all()
    serializer_class = ProductImageSerializer

class ProductVariantViewSet(BaseViewSet):
    queryset = ProductVariant.objects.select_related('product').all()
    serializer_class = ProductVariantSerializer
    
class InventoryViewSet(ModelViewSet):
    queryset = Inventory.objects.select_related('variant').all()
    serializer_class = InventorySerializer
    permission_classes = [IsAdminUser]
