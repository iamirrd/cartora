from rest_framework import serializers
from .models import Category, Brand, Product, ProductImage, ProductVariant, Inventory


class PriceValidationMixin:
    def validate(self, attrs):
        attrs = super().validate(attrs)
        price = attrs.get('price', getattr(self.instance, 'price', None))
        discount = attrs.get('discount_price', getattr(self.instance, 'discount_price', None))
        if price is not None and price < 0:
            raise serializers.ValidationError({'price': 'Price cannot be negative.'})
        if discount is not None and (discount < 0 or discount > price):
            raise serializers.ValidationError({'discount_price': 'Discount price must be between zero and price.'})
        return attrs


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'slug')


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'logo', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'slug')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'product', 'image', 'is_primary', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class ProductVariantSerializer(PriceValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            'id', 'product', 'name', 'price', 'discount_price',
            'description', 'image', 'is_active', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ('id', 'variant', 'quantity', 'is_active', 'updated_at')
        read_only_fields = ('id', 'updated_at')


class ProductSerializer(PriceValidationMixin, serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand    = BrandSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source='category', queryset=Category.objects.all(), write_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(source='brand', queryset=Brand.objects.all(), write_only=True)
    images   = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'description',
            'price', 'discount_price',
            'category', 'brand', 'category_id', 'brand_id',
            'images', 'variants',
            'is_active', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'slug')