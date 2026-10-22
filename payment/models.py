from django.db import models
from accounts.models import User
from order.models import Order
from common.models import BaseModel


class Gateway(BaseModel):
    """درگاه پرداخت."""
    name = models.CharField(max_length=100, verbose_name='نام درگاه')
    code = models.CharField(max_length=50, unique=True, verbose_name='کد درگاه')
    
    class Meta:
        verbose_name = 'درگاه پرداخت'
        verbose_name_plural = 'درگاه‌های پرداخت'

    def __str__(self):
        return self.name


class Transaction(BaseModel):
    """تراکنش پرداخت."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'در انتظار پرداخت'
        SUCCESS = 'success', 'موفق'
        FAILED = 'failed', 'ناموفق'
    
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name='transactions')
    gateway = models.ForeignKey(Gateway, on_delete=models.PROTECT)
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='transactions')
    
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    authority = models.CharField(max_length=100, blank=True)
    ref_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        verbose_name = 'تراکنش'
        verbose_name_plural = 'تراکنش‌ها'
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=['authority']),
            models.Index(fields=['ref_id']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.order.order_number} - {self.amount} - {self.status}"