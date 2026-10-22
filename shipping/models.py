from django.db import models
from common.models import BaseModel

class ShippingMethod(BaseModel):
    name = models.CharField(max_length=100)
    cost = models.DecimalField(
        max_digits=12, 
        decimal_places=0 ,
        default=0
        )
    delivery_time = models.CharField(max_length=50)
    description = models.TextField(blank=True , default='')
    
    class Meta:
        ordering = ['cost']
        verbose_name = 'روش ارسال'
        verbose_name_plural = 'روش‌های ارسال'

    def __str__(self):
        return f"{self.name} - {self.cost:,} تومان"