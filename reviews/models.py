from django.db import models
from common.models import BaseModel
from products.models import Product
from accounts.models import User
from django.core.validators import MinValueValidator, MaxValueValidator



class Review(BaseModel):
    title = models.CharField(
        max_length=255,
        default='',
        blank=True,
        )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews',
        )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='reviews',
        )
    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
            ]
        )  
    comment = models.TextField(
        default='' ,
        blank=True ,
        )
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.product.name} - {self.user.email} => Rating: {self.rating}'
    
    class Meta:
        verbose_name = 'نظر'
        verbose_name_plural = 'نظرات'
        ordering = ('-created_at',)
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'user'],
                name='unique_product_user',
            )
        ]