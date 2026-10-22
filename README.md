# Cartora — E-commerce Backend API

A modular e-commerce backend API built with **Python, Django, and Django REST Framework (DRF)**.

## Features

- **Authentication:** JWT authentication, user registration, login/logout, and GitHub social login.
- **Product Management:** Products, categories, brands, images, variants, and inventory management.
- **Shopping Cart:** Quantity management, automatic price calculation, and duplicate item prevention.
- **Order Management:** Order processing with snapshot-based pricing.
- **Payment:** Mock payment gateway for checkout and payment verification.
- **Coupons:** Fixed and percentage-based discounts with expiration dates and usage limits.
- **Reviews & Wishlist:** Product ratings, customer reviews, and wishlists.
- **Shipping:** Configurable shipping methods and delivery costs.
- **Notifications:** In-app notifications and read-status management.
- **Performance Optimization:** Database indexing, `select_related`, and `prefetch_related`.
- **Containerization:** Docker and Docker Compose.

## Tech Stack

- Python 3.12
- Django
- Django REST Framework
- PostgreSQL
- SimpleJWT
- django-allauth
- Docker & Docker Compose
- Gunicorn

## Project Structure

- `accounts/` — Authentication and user management
- `products/` — Products, categories, brands, and variants
- `cart/` — Shopping cart
- `order/` — Orders and order items
- `payment/` — Payment processing
- `address/` — Customer addresses
- `coupon/` — Discount management
- `reviews/` — Product reviews
- `wishlist/` — Wishlist
- `shipping/` — Shipping methods
- `notification/` — Notifications
- `common/` — Shared models and utilities

## Getting Started

```bash
git clone https://github.com/iamirrd/cartora.git
cd cartora
docker compose up --build
```

### Create a Superuser

```bash
docker compose run --rm web python manage.py createsuperuser
```

### Access the Application

- **Application:** http://127.0.0.1:8000/
- **Admin Panel:** http://127.0.0.1:8000/admin/

## Note

The payment gateway is simulated and does not process real payments.