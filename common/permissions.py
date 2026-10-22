from rest_framework import permissions

class AllReadAdminWrite(permissions.BasePermission):
        """
    - خواندن (GET, HEAD, OPTIONS): برای همه
    - نوشتن (POST, PUT, PATCH, DELETE): فقط ادمین فعال
        """
        def has_permission(self, request, view):
            if request.method in permissions.SAFE_METHODS:
                return True
            return request.user.is_active and request.user.is_staff
        
class IsOwnerOrAdmin(permissions.BasePermission):
    """
    - ادمین: همه کار
    - صاحب: فقط آبجکت‌های خودش
    - بقیه: هیچی
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_active and request.user.is_staff:
            return True
        
        return obj.user == request.user