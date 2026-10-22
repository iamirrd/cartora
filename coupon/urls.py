from django.urls import path , include
from .api_views import CouponViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('coupons', CouponViewSet , basename='coupons')

urlpatterns = [
    path('' , include(router.urls))
]