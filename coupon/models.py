from decimal import Decimal
from django.db import models
from common.models import BaseModel
from django.utils import timezone

class DiscountType(models.TextChoices):
    PERCENTAGE = 'percentage', 'درصدی'
    FIXED = 'fixed', 'مبلغی'


class Coupon(BaseModel):
    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
    )
    discount_value = models.DecimalField(max_digits=12, decimal_places=0)
    min_purchase = models.DecimalField(
        max_digits=12, decimal_places=0,
        default=0,
    )
    max_discount = models.DecimalField(
        max_digits=12, decimal_places=0,
        null=True, blank=True,
    )
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = 'کد تخفیف'
        verbose_name_plural = 'کدهای تخفیف'
    
    def __str__(self):
        return self.code
    
    @property
    def is_valid(self):
        """آیا کد الان معتبره؟"""
        now = timezone.now()
        return (
            self.is_active
            and self.discount_value > 0
            and (self.discount_type != DiscountType.PERCENTAGE or self.discount_value <= 100)
            and self.min_purchase >= 0
            and (self.max_discount is None or self.max_discount >= 0)
            and self.valid_from <= now <= self.valid_to
            and self.used_count < self.usage_limit
        )
    
    def calculate_discount(self, total):
        """محاسبه تخفیف برای یه مبلغ."""
        if not self.is_valid or total < self.min_purchase:
            return 0
        
        if self.discount_type == DiscountType.PERCENTAGE:
            discount = total * self.discount_value / 100
            if self.max_discount is not None:
                discount = min(discount, self.max_discount)
            return min(total, discount.quantize(Decimal('1')))
        
        return min(self.discount_value, total)