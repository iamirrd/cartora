from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer, FCMDeviceSerializer
from fcm_django.models import FCMDevice

class NotificationListView(generics.ListAPIView):
    """لیست نوتیفیکیشن‌های کاربر"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

class NotificationMarkAsReadView(APIView):
    """علامت زدن همه نوتیفیکیشن‌ها به عنوان خوانده شده"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "همه نوتیفیکیشن‌ها خوانده شدند"}, status=status.HTTP_200_OK)

class FCMDeviceCreateView(generics.CreateAPIView):
    """ثبت توکن دستگاه برای دریافت نوتیفیکیشن Push"""
    serializer_class = FCMDeviceSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # اگر دستگاه از قبل ثبت شده بود، آپدیتش می‌کنیم
        device = serializer.validated_data.get('registration_id')
        FCMDevice.objects.filter(registration_id=device).delete()
        serializer.save(user=self.request.user)