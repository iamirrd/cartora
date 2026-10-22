import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    """فیلتر اختصاصی برای محصولات."""
    
    # فیلتر بر اساس بازه قیمت
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    
    # فیلتر بر اساس دسته (با slug)
    category = django_filters.CharFilter(field_name='category__slug', lookup_expr='iexact')
    
    # فیلتر بر اساس برند (با slug)
    brand = django_filters.CharFilter(field_name='brand__slug', lookup_expr='iexact')
    
    # فیلتر بر اساس موجودی (محصولاتی که موجودی دارن)
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    
    class Meta:
        model = Product
        fields = ['category', 'brand', 'is_active']
    
    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(variants__inventory__quantity__gt=0).distinct()
        return queryset