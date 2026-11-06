import logging

logger = logging.getLogger(__name__)

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
        try:
            devices.send_message(
                Message(notification=FCMNotification(title=title, body=message))
            )
        except Exception:
            # A push provider failure must not fail an already saved operation.
            logger.exception("Push notification delivery failed for user %s", user.pk)
