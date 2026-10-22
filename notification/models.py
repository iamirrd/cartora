from django.db import models
from accounts.models import User
from common.models import BaseModel

class NotificationType(models.TextChoices):
    ORDER = 'order', 'سفارش'
    PAYMENT = 'payment', 'پرداخت'
    SYSTEM = 'system', 'سیستمی'
    PROMOTION = 'promotion', 'تبلیغاتی'

class Notification(BaseModel):
    """نوتیفیکیشن درون‌برنامه‌ای (In-App)"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications',
        verbose_name='کاربر'
    )
    title = models.CharField(max_length=200, verbose_name='عنوان')
    message = models.TextField(verbose_name='پیام')
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
        verbose_name='نوع'
    )
    is_read = models.BooleanField(default=False, verbose_name='خوانده شده')
    
    class Meta:
        verbose_name = 'نوتیفیکیشن'
        verbose_name_plural = 'نوتیفیکیشن‌ها'
        ordering = ('-created_at',)

    def __str__(self):
        return f"{self.user.email} - {self.title}"