from django.db import models
from common.models import BaseModel
from products.models import ProductVariant
from accounts.models import User

class Wishlist(BaseModel):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='wishlist',
        )
    
    class Meta:
        verbose_name = 'علاقه‌مندی'
        verbose_name_plural = 'لیست‌های علاقه‌مندی'
        ordering = ('-created_at',)
        
    def __str__(self):
        return f"wishlist - {self.user.email}"
    
    @property
    def items_count(self):
        return self.items.count()
    
class WishlistItem(BaseModel):
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name='items',
        )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
        )
    
    class Meta:
        verbose_name = 'آیتم علاقه‌مندی'
        verbose_name_plural = 'آیتم‌های علاقه‌مندی'
        constraints = [
            models.UniqueConstraint(
                fields=['wishlist', 'variant'],
                name='unique_wishlist_variant',
            )
        ]
        indexes = [
            models.Index(fields=['wishlist']),
            models.Index(fields=['variant']),
        ]
    
    def __str__(self):
        return f"{self.variant} - {self.wishlist.user.email}"