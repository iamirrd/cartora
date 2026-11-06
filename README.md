# Cartora

A modular e-commerce REST API built with Python 3.14, Django 6.1, Django REST Framework and PostgreSQL. This is a backend project: explore the API in Swagger UI and manage catalog data in Django admin.

## Features

- Email/password registration and JWT login, refresh and logout with refresh-token blacklisting.
- Products, categories, brands, images, variants and inventory; catalog writes require staff access.
- A cart per user, quantity validation, discount-aware totals and duplicate prevention.
- Atomic cart checkout with current variant prices copied into order-item snapshots.
- Shipping-cost snapshots and fixed/percentage coupons with expiration, purchase minimums and usage limits.
- Development-only mock payments with repeated-request handling and atomic stock/coupon updates on success.
- Review moderation and owner/staff write access; private wishlists and addresses.
- In-app notifications and optional Firebase push notifications.
- Docker Compose, Gunicorn and OpenAPI documentation.

Google and GitHub providers are installed through django-allauth. They require OAuth application configuration and do not work out of the box.

## Start with Docker

Install Docker Desktop, select Linux containers and wait for the engine to start. From a checkout of this repository, create the local configuration:

```powershell
Copy-Item .env.example .env
```

On Linux/macOS use `cp .env.example .env` instead.

Edit `.env` before starting:

- Replace `DJANGO_SECRET_KEY` with a random private value. Generate one using `python -c "import secrets; print(secrets.token_urlsafe(50))"` if Python is installed.
- Replace `POSTGRES_PASSWORD` with your own database password.
- Keep `DEBUG=True` for local static/media serving and mock checkout.
- Keep `FIREBASE_ENABLED=False` unless Firebase credentials are configured.

```powershell
docker compose up --build
```

Compose waits for PostgreSQL, applies migrations, collects static assets and starts Gunicorn on port 8000. The first build downloads dependencies and may take several minutes. Leave this terminal open; Ctrl+C stops the services. Use `docker compose up -d --build` to run in the background.

Create an administrator in another terminal:

```powershell
docker compose exec web python manage.py createsuperuser
```

| Interface | URL |
| --- | --- |
| Swagger UI | http://localhost:8000/api/docs/ |
| OpenAPI schema | http://localhost:8000/api/schema/ |
| Django admin | http://localhost:8000/admin/ |

There is no storefront or view at `/`; a root URL 404 is expected.

```powershell
docker compose ps
docker compose logs -f web
docker compose stop
docker compose up -d
```

Database data and media persist in named volumes. Changing database credentials in `.env` does not reinitialize an existing database volume: keep the existing credentials or update PostgreSQL explicitly. Port 5432 must be free when starting the bundled database alongside a local PostgreSQL installation.

## Run locally

Requires Python 3.14 and PostgreSQL. Create `.env` as above, set `POSTGRES_HOST=127.0.0.1` and configure your database credentials/port. Create the database yourself or start the bundled database using `docker compose up -d db`.

With uv:

```powershell
uv sync --frozen
uv run --frozen python manage.py migrate
uv run --frozen python manage.py runserver
```

Or with pip on Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

On Linux/macOS activate using `source .venv/bin/activate`. Use `python manage.py createsuperuser` for a local admin account.

## API workflow

All paths include trailing slashes. Swagger UI describes the complete request/response fields.

1. Register at `POST /api/accounts/register/`, or log in at `POST /api/accounts/login/` with email/password. `POST /api/token/` is a login alias.
2. Send `Authorization: Bearer <access-token>` for authenticated requests. Refresh at `POST /api/token/refresh/`. Logout at `POST /api/accounts/logout/` accepts the current user's refresh token; it does not revoke an already issued access token.
3. As staff, create a category, brand, product, variant and inventory through admin or the catalog API. Product writes accept `category_id` and `brand_id`; responses include nested category/brand data. Activate the records and stock the variant.
4. Add a variant with `POST /api/cart/items/` and `{"variant": 1, "quantity": 2}`. The cart is created automatically. A duplicate variant returns a validation error; update its existing item instead.
5. Create an order with `POST /api/order/orders/checkout/` and the address fields below. Checkout copies the cart at current variant prices and clears it in the same database transaction.
6. Start mock payment with `POST /api/payment/request/` and `{"order_id": 1}`. Open the returned `payment_url` to simulate success. Change `status=OK` to `status=NOK` to simulate failure.
7. Inspect orders at `/api/order/orders/` and payment records at `/api/payment/transactions/`.

Example checkout body (replace IDs/code with records you created; omit optional shipping/coupon fields if unused):

```json
{
  "receiver_name": "Demo Customer",
  "receiver_phone": "09123456789",
  "province": "Tehran",
  "city": "Tehran",
  "postal_code": "1234567890",
  "full_address": "Demo street, building 1",
  "shipping_method": 1,
  "coupon_code": "WELCOME"
}
```

Receiver phone numbers use `09` plus nine digits; postal codes contain ten digits. Shipping and discount amounts are calculated by the server. Percentage discounts must be greater than zero and at most 100. Prices are integer monetary amounts; use the same currency unit in the catalog, coupons and shipping.

Alternatively, create an empty order at `POST /api/order/orders/` and add items at `POST /api/order/order-items/` using `order`, `variant` and `quantity`. Orders must belong to the current user. Snapshots do not track later catalog price changes; editing an item refreshes its price.

### Payment and inventory

- Mock payments require `DEBUG=True` and `ENABLE_MOCK_PAYMENTS=True`. They are always disabled when `DEBUG=False` and never move real money.
- Repeated payment requests reuse a pending transaction. Successful callbacks do not reduce stock or consume a coupon twice.
- Availability is checked across all items of the same variant; stock is reduced under database row locks in the successful payment transaction. Coupon validity and usage limits are checked again under a lock.
- Pending payments do not reserve stock. Verification can fail if another customer buys the remaining stock first, or if a coupon expires or reaches its usage limit.
- Orders/items cannot be edited through the API during pending payment or after success. Failed payments allow editing and retrying a pending order. Orders with payment history cannot be deleted through the API.
- A live provider, payment expiry/reservations and an automatic cancellation/refund workflow are not implemented.

### Other endpoints

| Area | Paths | Access |
| --- | --- | --- |
| Catalog | `/api/products/` with `products/`, `categories/`, `brands/`, `product-variants/`, `product-images/` | Active records public; staff write |
| Inventory | `/api/products/inventories/` | Staff only |
| Cart | `/api/cart/carts/`, `/api/cart/items/` | Current user |
| Addresses | `/api/address/addresses/` | Current user |
| Orders | `/api/order/orders/`, `/api/order/order-items/` | Current user |
| Coupons | `/api/coupon/coupons/` | Staff only |
| Shipping | `/api/shipping/shipping-methods/` | Active methods public; staff write |
| Reviews | `/api/reviews/reviews/` | Approved active reviews public; users also see their own; owner/staff write |
| Wishlist | `/api/wishlist/wishlists/`, `/api/wishlist/wishlist-items/` | Current user |
| Notifications | `/api/notification/` with `list/`, `mark-read/`, `register-device/` | Current user |

Lists have 12 entries per page. Login, registration and token refresh share a scoped limit of 10 requests/minute. The default cache is local to each process; distributed throttling requires a shared cache.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Private signing secret; required outside debug mode |
| `DEBUG` | Development mode; example sets True |
| `ALLOWED_HOSTS` | Comma-separated hostnames without schemes or ports |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Database credentials |
| `POSTGRES_HOST`, `POSTGRES_PORT` | Local database address; Compose overrides to db:5432 in web |
| `ENABLE_MOCK_PAYMENTS` | Simulator opt-in, effective only with debug enabled |
| `FIREBASE_ENABLED` | Optional push initialization; defaults to False |
| `GOOGLE_APPLICATION_CREDENTIALS` | Absolute path to Firebase service-account JSON when enabled |

Never commit `.env` or service-account credentials. `.env.example` contains placeholders only.

### Optional integrations

**Firebase:** enable `FIREBASE_ENABLED` and set `GOOGLE_APPLICATION_CREDENTIALS` to an accessible service-account JSON. In Docker, mount the credentials read-only and use their container path. Credentials are excluded from the image. Register tokens at `/api/notification/register-device/`. In-app notifications work without Firebase. Push errors are logged and do not undo the order.

**Google/GitHub OAuth:** create provider applications, configure callbacks for your host and register credentials as Social Applications in Django admin, linked to the Django Site with ID 1. Callback paths are `/accounts/google/login/callback/` and `/accounts/github/login/callback/`. These allauth routes use sessions and do not issue API JWT tokens.

### Deployment scope

Bundled Compose is for local development/demo use and mounts the source directory. Public deployment needs a private signing secret, `DEBUG=False`, explicit hosts, HTTPS, secure cookies, a production email backend, shared throttling cache, external static/media serving and database backups. `collectstatic` gathers assets; Gunicorn does not serve static files in production. Direct static/media routes are enabled only in debug mode. Email verification is disabled by default. Accepting real payments requires a live provider.

## Project structure

| Directory | Responsibility |
| --- | --- |
| `Config/` | Settings, URLs, ASGI/WSGI |
| `accounts/` | Registration and JWT authentication |
| `products/` | Catalog and inventory |
| `cart/` | Cart and totals |
| `order/` | Checkout, snapshots and shipping/coupon amounts |
| `payment/` | Mock gateway and transactions |
| `address/`, `shipping/` | Delivery addresses and shipping methods |
| `coupon/` | Discount rules and usage counts |
| `reviews/`, `wishlist/` | Reviews and saved variants |
| `notification/` | In-app and optional push notifications |
| `common/` | Shared models and permissions |

## Maintenance and validation

`pyproject.toml` declares dependencies, `uv.lock` locks versions and `requirements.txt` exports them for Docker/pip. This Django application is not built as an installable package and has no `rez` command-line entry point.

After intentionally changing dependencies, refresh both files:

```powershell
uv lock
uv export --frozen --no-dev --no-hashes --no-emit-project --no-header --output-file requirements.txt
```

Apply migrations after pulling model changes (Compose also does this at startup):

```powershell
python manage.py migrate
```

Configuration, migration consistency and OpenAPI can be checked without running a test suite:

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py spectacular --validate --fail-on-warn --file schema.yml
```

These checks do not establish complete end-to-end correctness or production readiness.
