from django.apps import AppConfig
from django.conf import settings


class NotificationConfig(AppConfig):
    name = 'notification'

    def ready(self):
        if not settings.FIREBASE_ENABLED:
            return
        import firebase_admin

        try:
            firebase_admin.get_app()
        except ValueError:
            # Firebase reads GOOGLE_APPLICATION_CREDENTIALS from the environment.
            firebase_admin.initialize_app()
