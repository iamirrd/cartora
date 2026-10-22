from django.urls import path
from .api_views import NotificationListView, NotificationMarkAsReadView, FCMDeviceCreateView

urlpatterns = [
    path('list/', NotificationListView.as_view(), name='notification-list'),
    path('mark-read/', NotificationMarkAsReadView.as_view(), name='notification-mark-read'),
    path('register-device/', FCMDeviceCreateView.as_view(), name='register-device'),
]