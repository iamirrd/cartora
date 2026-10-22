from django.db import models
from django.utils.text import slugify
from common.models import BaseModel


class Category(BaseModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, allow_unicode=True, unique=True)
    parent = models.ForeignKey(
        'self', on_delete=models.PROTECT,
        null=True, blank=True, related_name='children',
    )

    class Meta:
        verbose_name = 'دسته‌بندی'
        verbose_name_plural = 'دسته‌بندی‌ها'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Brand(BaseModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, allow_unicode=True, unique=True)
    logo = models.ImageField(upload_to='brands/', null=True, blank=True)

    class Meta:
        verbose_name = 'برند'
        verbose_name_plural = 'برندها'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Product(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, allow_unicode=True, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    discount_price = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)

    class Meta:
        verbose_name = 'محصول'
        verbose_name_plural = 'محصولات'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['price']),
            models.Index(fields=['is_active', '-created_at']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['brand', 'is_active']),
        ]


    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class ProductImage(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/images/')
    is_primary = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'تصویر محصول'
        verbose_name_plural = 'تصاویر محصول'

    def __str__(self):
        return f"{self.product.name} - {self.id}"


class ProductVariant(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    discount_price = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='variants/images/', null=True, blank=True)

    class Meta:
        verbose_name = 'ویژگی'
        verbose_name_plural = 'ویژگی‌ها'
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['price']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.name}"


class Inventory(BaseModel):
    variant = models.OneToOneField(ProductVariant, on_delete=models.CASCADE, related_name='inventory',)
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'موجودی'
        verbose_name_plural = 'موجودی‌ها'

    def __str__(self):
        return f"{self.variant} - {self.quantity} عدد"