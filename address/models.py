from django.db import models
from accounts.models import User
from common.models import BaseModel
from django.core.validators import RegexValidator

class Address(BaseModel):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='addresses',
    )
    title = models.CharField(max_length=50)
    receiver_name = models.CharField(max_length=100)
    receiver_phone = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^09\d{9}$', 'شماره موبایل معتبر نیست')],
    )
    province = models.CharField(max_length=50)
    city = models.CharField(max_length=50)
    postal_code = models.CharField(max_length=10)
    full_address = models.TextField()
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'آدرس'
        verbose_name_plural = 'آدرس‌ها'
        ordering = ('-is_default', '-created_at')

    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    def save(self, *args, **kwargs):
        """اگه این آدرس پیش‌فرض شد، بقیه رو غیرپیش‌فرض کن."""
        if self.is_default:
            Address.objects.filter(
                user=self.user,
                is_default=True,
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)