from .models import Notification, NotificationType
from fcm_django.models import FCMDevice
from firebase_admin.messaging import Message, Notification as FCMNotification

def send_notification_to_user(user, title, message, notif_type=NotificationType.SYSTEM):
    """
    ارسال نوتیفیکیشن (هم In-App و هم Push)
    """
    # ۱. ذخیره توی دیتابیس (In-App)
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notif_type
    )

    # ۲. ارسال Push (اگر کاربر دستگاهی ثبت کرده باشه)
    devices = FCMDevice.objects.filter(user=user, active=True)
    if devices.exists():
        devices.send_message(
            Message(
                notification=FCMNotification(title=title, body=message)
            )
        )