from django.contrib import admin
from .models import Category, Brand, Product, ProductImage, ProductVariant, Inventory

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'is_active', 'created_at')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)
    list_select_related = ('parent',)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'slug', 'category', 'brand',
        'price', 'discount_price', 'is_active', 'created_at',
    )
    list_filter = ('is_active', 'category', 'brand')
    search_fields = ('name', 'slug', 'category__name', 'brand__name')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('-created_at',)
    list_select_related = ('category', 'brand')
    autocomplete_fields = ('category', 'brand')

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image', 'is_primary', 'created_at')
    list_filter = ('is_active', 'is_primary')
    search_fields = ('product__name', 'product__slug')
    ordering = ('-created_at',)
    list_select_related = ('product',)
    autocomplete_fields = ('product',)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'name', 'price',
        'discount_price', 'is_active', 'created_at',
    )
    list_filter = ('is_active', 'product')
    search_fields = ('product__name', 'product__slug', 'name')
    ordering = ('-created_at',)
    list_select_related = ('product',)
    autocomplete_fields = ('product',)


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('variant', 'quantity', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('variant__name', 'variant__product__name')
    ordering = ('-updated_at',)
    list_select_related = ('variant', 'variant__product')
    autocomplete_fields = ('variant',)
