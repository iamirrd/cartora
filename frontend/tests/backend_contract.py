"""Exercise actual Django views against a disposable in-memory database.

Run from the project root: .venv/Scripts/python.exe frontend/tests/backend_contract.py
This script never connects to the configured application PostgreSQL database.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Config.settings')
# This executable uses isolated test settings, even without a local .env file.
os.environ['DJANGO_DEBUG'] = 'True'
os.environ['FIREBASE_ENABLED'] = 'False'

import Config.settings as configuration

configuration.DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}
configuration.PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
configuration.ALLOWED_HOSTS = ['testserver']
configuration.FIREBASE_ENABLED = False
configuration.ENABLE_MOCK_PAYMENTS = True
configuration.DEBUG = True

import django
django.setup()

from django.test import Client, TestCase
from django.test.runner import DiscoverRunner
from rest_framework.test import APIClient
from accounts.models import User
from order.models import Order, OrderItem
from products.models import Brand, Category, Inventory, Product, ProductVariant
from reviews.models import Review


class StorefrontContractTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='buyer', email='buyer@example.com', password='Strong-pass-42')
        cls.other = User.objects.create_user(username='other', email='other@example.com', password='Strong-pass-42')
        category = Category.objects.create(name='Bags')
        brand = Brand.objects.create(name='Cartora')
        cls.product = Product.objects.create(name='Daily bag', category=category, brand=brand, price=200000)
        cls.product2 = Product.objects.create(name='Second bag', category=category, brand=brand, price=200000)
        cls.variant = ProductVariant.objects.create(product=cls.product, name='Green', price=200000, discount_price=180000)
        cls.stock = Inventory.objects.create(variant=cls.variant, quantity=5)

    def setUp(self):
        self.client = APIClient()

    def test_styled_session_login_keeps_csrf_and_admin_redirect(self):
        self.user.is_staff = True
        self.user.save(update_fields=['is_staff'])
        browser = Client(enforce_csrf_checks=True)
        response = browser.get('/accounts/login/?next=%2Fadmin%2F')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'ورود به کارتورا')
        self.assertContains(response, '/static/accounts/auth.css')
        self.assertContains(response, 'name="next" value="/admin/"')
        self.assertContains(response, 'name="csrfmiddlewaretoken"')
        csrf = browser.cookies['csrftoken'].value
        failed = browser.post('/accounts/login/', {
            'login': self.user.email, 'password': 'wrong-password',
            'next': '/admin/', 'csrfmiddlewaretoken': csrf,
        })
        self.assertEqual(failed.status_code, 200)
        self.assertContains(failed, 'role="alert"')
        self.assertContains(failed, 'name="next" value="/admin/"')
        logged_in = browser.post('/accounts/login/', {
            'login': self.user.email, 'password': 'Strong-pass-42',
            'next': '/admin/', 'csrfmiddlewaretoken': csrf,
        })
        self.assertRedirects(logged_in, '/admin/', fetch_redirect_response=False)
        self.assertEqual(int(browser.session['_auth_user_id']), self.user.pk)

    def test_registration_has_same_user_shape_as_login(self):
        registration = self.client.post('/api/accounts/register/', {
            'email': 'new@example.com', 'password': 'New-strong-pass-42',
            'password2': 'New-strong-pass-42', 'first_name': 'Sara',
        }, format='json')
        self.assertEqual(registration.status_code, 201, registration.data)
        login = self.client.post('/api/accounts/login/', {
            'email': 'new@example.com', 'password': 'New-strong-pass-42',
        }, format='json')
        self.assertEqual(login.status_code, 200, login.data)
        self.assertEqual(registration.data['user'], login.data['user'])
        self.assertIn('id', registration.data['user'])
        self.assertNotIn('password', registration.data['user'])

    def test_review_filter_excludes_other_products(self):
        review = Review.objects.create(product=self.product, user=self.user, rating=5, is_approved=True)
        Review.objects.create(product=self.product2, user=self.user, rating=4, is_approved=True)
        Review.objects.create(product=self.product, user=self.other, rating=3, is_approved=False)
        response = self.client.get('/api/reviews/reviews/', {'product': self.product.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['id'] for item in response.data['results']], [review.pk])

    def test_order_item_filter_preserves_ownership(self):
        first = Order.objects.create(user=self.user)
        second = Order.objects.create(user=self.user)
        foreign = Order.objects.create(user=self.other)
        def item(order):
            return OrderItem.objects.create(order=order, variant=self.variant, product_name='Daily bag', variant_name='Green', price=180000, quantity=1)
        expected = item(first)
        item(second)
        item(foreign)
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/order/order-items/', {'order': first.pk})
        self.assertEqual([row['id'] for row in response.data['results']], [expected.pk])
        response = self.client.get('/api/order/order-items/', {'order': foreign.pk})
        self.assertEqual(response.data['results'], [])

    def test_real_cart_checkout_and_mock_payment_are_consistent(self):
        self.client.force_authenticate(self.user)
        added = self.client.post('/api/cart/items/', {'variant': self.variant.pk, 'quantity': 2}, format='json')
        self.assertEqual(added.status_code, 201, added.data)
        checkout = self.client.post('/api/order/orders/checkout/', {
            'receiver_name': 'Sara', 'receiver_phone': '09123456789',
            'province': 'Tehran', 'city': 'Tehran', 'postal_code': '1234567890',
            'full_address': 'Example street, 1',
        }, format='json')
        self.assertEqual(checkout.status_code, 201, checkout.data)
        self.assertEqual(int(checkout.data['total_price']), 360000)
        self.assertEqual(self.client.get('/api/cart/items/').data['count'], 0)
        first = self.client.post('/api/payment/request/', {'order_id': checkout.data['id']}, format='json')
        self.assertEqual(first.status_code, 200, first.data)
        cancelled = self.client.get(first.data['payment_url'].replace('status=OK', 'status=NOK'))
        self.assertEqual(cancelled.status_code, 400)
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.quantity, 5)
        retry = self.client.post('/api/payment/request/', {'order_id': checkout.data['id']}, format='json')
        self.assertEqual(retry.status_code, 200, retry.data)
        verified = self.client.get(retry.data['payment_url'])
        self.assertEqual(verified.status_code, 200, verified.data)
        self.assertEqual(self.client.get(retry.data['payment_url']).status_code, 200)
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.quantity, 3)
        self.assertEqual(Order.objects.get(pk=checkout.data['id']).status, 'paid')


if __name__ == '__main__':
    sys.exit(bool(DiscoverRunner(verbosity=1).run_tests(['__main__'])))
