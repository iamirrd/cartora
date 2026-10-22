from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from accounts.models import User
from products.models import ProductVariant
from common.models import BaseModel


class Cart(BaseModel):
    """سبد خرید — هر کاربر یه سبد فعال."""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='cart',
        verbose_name='کاربر',
    )

    class Meta:
        verbose_name = 'سبد خرید'
        verbose_name_plural = 'سبدهای خرید'

    def __str__(self):
        return f"سبد {self.user.email} - {self.id}"

    @property
    def total_price(self):
        """جمع کل سبد."""
        total = self.items.aggregate(
            total=models.Sum(
                models.F('price') * models.F('quantity'),
                output_field=models.DecimalField(max_digits=12, decimal_places=0),
            )
        )['total']
        return total or 0

    @property
    def items_count(self):
        """تعداد کل محصولات."""
        return self.items.aggregate(total=models.Sum('quantity'))['total'] or 0


class CartItem(BaseModel):
    """آیتم سبد خرید."""
    
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='سبد',
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='variant',
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name='تعداد',
    )
    price = models.DecimalField(
        max_digits=12, decimal_places=0,
        verbose_name='قیمت واحد',
    )
    discount_price = models.DecimalField(
        max_digits=12, decimal_places=0,
        null=True, blank=True,
        verbose_name='قیمت با تخفیف',
    )

    class Meta:
        verbose_name = 'مورد سبد خرید'
        verbose_name_plural = 'موردهای سبد خرید'
        constraints = [
            models.UniqueConstraint(
                fields=['cart', 'variant'],
                name='unique_cart_variant',
            )
        ]
        indexes = [
            models.Index(fields=['cart']),
            models.Index(fields=['variant']),
        ]

    def __str__(self):
        return f"{self.variant} - {self.id}"

    @property
    def unit_price(self):
        """قیمت واحد (با تخفیف اگه داشت)."""
        return self.discount_price or self.price

    @property
    def subtotal(self):
        """جمع این آیتم."""
        return self.unit_price * self.quantity