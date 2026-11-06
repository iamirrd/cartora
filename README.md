# Cartora — E-commerce Backend API

A modular e-commerce backend API built with **Python, Django, and Django REST Framework (DRF)**.

## Features

- **Authentication:** JWT authentication, user registration, login/logout, and GitHub/Google social login.
- **Product Management:** Products, categories, brands, images, variants, and inventory management.
- **Shopping Cart:** Quantity management, automatic price calculation, and duplicate item prevention.
- **Order Management:** Order processing with snapshot-based pricing.
- **Payment:** Mock payment gateway for checkout and payment verification.
- **Coupons:** Fixed and percentage-based discounts with expiration dates and usage limits.
- **Reviews & Wishlist:** Product ratings, customer reviews, and wishlists.
- **Shipping:** Configurable shipping methods and delivery costs.
- **Notifications:** In-app notifications and read-status management.
- **Performance Optimization:** Database indexing, `select_related`, and `prefetch_related`.
- **API Documentation:** Interactive API documentation with Swagger.
- **Containerization:** Docker and Docker Compose.

## Tech Stack

- Python 3.14
- Django
- Django REST Framework
- PostgreSQL
- SimpleJWT
- django-allauth
- Swagger / OpenAPI
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

## Access the Application

- **Application:** http://127.0.0.1:8000/
- **Admin Panel:** http://127.0.0.1:8000/admin/
- **Swagger API Documentation:** http://127.0.0.1:8000/api/docs/
- **OpenAPI Schema:** http://127.0.0.1:8000/api/schema/

## Note

The payment gateway is simulated and does not process real payments.
## Runtime configuration

Set `DJANGO_SECRET_KEY` to a private value before running with `DEBUG=False`.
Set `ALLOWED_HOSTS` to a comma-separated list of hostnames (default:
`localhost,127.0.0.1,[::1]`) and configure `POSTGRES_PASSWORD` in the environment.

Order items accept an `order` ID belonging to the authenticated user. Orders and
items become immutable while a payment is pending or after it succeeds. Failed
payments allow the order to be edited and retried. Orders with payment records
cannot be deleted. Repeated
payment requests reuse the pending transaction; repeated successful callbacks
return success without processing the payment again. The payment gateway remains
a simulator and must be replaced before accepting real payments.

### Checkout and inventory

`POST /api/order/orders/checkout/` copies the authenticated user's active cart
into an order using current product prices and clears the cart in one database
transaction. Supply the receiver/address fields from the order API. Individual
order and order-item endpoints remain available.

Product writes accept `category_id` and `brand_id`. Orders accept an optional
`shipping_method` ID and `coupon_code`; shipping and discount amounts are computed
by the server. Coupon validity, minimum purchase and usage limits are checked
again during payment. Stock is checked across all items of the same variant and
reduced atomically on successful mock payment. Repeated callbacks do not reduce
stock or consume coupons again. Pending payments do not reserve stock; an order
can fail payment if another customer buys the remaining stock first.

Mock payments require `DEBUG=True` and `ENABLE_MOCK_PAYMENTS=True` and are disabled
when `DEBUG=False`. There is no live payment provider in this repository.

After updating, run `python manage.py migrate` to add the order coupon and discount
fields. The Docker database health check waits for PostgreSQL before starting Django.
