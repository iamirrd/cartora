import uuid
from django.db import models

from accounts.models import User
from products.models import ProductVariant
from common.models import BaseModel
from shipping.models import ShippingMethod

class OrderStatus(models.TextChoices):
    PENDING = 'pending', 'در انتظار پرداخت'
    PAID = 'paid', 'پرداخت شده'
    PROCESSING = 'processing', 'در حال پردازش'
    SHIPPED = 'shipped', 'ارسال شده'
    DELIVERED = 'delivered', 'تحویل داده شده'
    CANCELLED = 'cancelled', 'لغو شده'
    REFUNDED = 'refunded', 'بازگشت داده شده'


class Order(BaseModel):    
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )
    order_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
    )
    shipping_method = models.ForeignKey(
        ShippingMethod,
        on_delete=models.SET_NULL,
        related_name='orders',
        blank=True,
        null=True,
    )
    shipping_cost = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        default=0,
    )
    receiver_name = models.CharField(max_length=100)
    receiver_phone = models.CharField(max_length=15)
    province = models.CharField(max_length=50)
    city = models.CharField(max_length=50)
    postal_code = models.CharField(max_length=10)
    full_address = models.TextField()
    
    class Meta:
        verbose_name = 'سفارش'
        verbose_name_plural = 'سفارشات'
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.order_number} - {self.user.email}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)
    
    @property
    def total_price(self):
        """جمع کل سفارش (با ارسال)."""
        items_total = self.items.aggregate(
            total=models.Sum(
                models.F('price') * models.F('quantity'),
                output_field=models.DecimalField(max_digits=12, decimal_places=0),
            )
        )['total'] or 0
        
        return items_total + self.shipping_cost


class OrderItem(BaseModel):
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='order_items',
    )
    
    product_name = models.CharField(max_length=200)
    variant_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    quantity = models.PositiveIntegerField()
    
    class Meta:
        verbose_name = 'آیتم سفارش'
        verbose_name_plural = 'آیتم‌های سفارش'
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['variant']),
        ]
    
    def __str__(self):
        return f"{self.product_name} - {self.quantity}"
    
    @property
    def subtotal(self):
        return self.price * self.quantity