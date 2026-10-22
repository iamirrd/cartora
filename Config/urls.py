from django.contrib import admin
from django.urls import path , include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.contrib import admin
from allauth.account.decorators import secure_admin_login

admin.autodiscover()
admin.site.login = secure_admin_login(admin.site.login)

urlpatterns = [
    path('admin/'            , admin.site.urls),
    path('accounts/'         , include('allauth.urls')),
    path('api/token/'        , TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/'     , include('accounts.urls')),
    path('api/products/'     , include('products.urls')),
    path('api/cart/'         , include('cart.urls')),
    path('api/address/'      , include('address.urls')),
    path('api/order/'       , include('order.urls')),
    path('api/coupon/'       , include('coupon.urls')),
    path('api/reviews/'      , include('reviews.urls')),
    path('api/wishlist/'     , include('wishlist.urls')),
    path('api/shipping/'     , include('shipping.urls')),
    path('api/notification/', include('notification.urls')),
    path('api/payment/'      , include('payment.urls')),
    
]
