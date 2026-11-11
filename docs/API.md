# API reference

[Project setup](../README.md) ? [Development and troubleshooting](DEVELOPMENT.md)

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

- Mock payments require `DJANGO_DEBUG=True` and `ENABLE_MOCK_PAYMENTS=True`. They are always disabled when `DJANGO_DEBUG=False` and never move real money.
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


The running OpenAPI schema at `/api/schema/` is the authoritative field reference. Product reviews support `?product=<id>` and order items support `?order=<id>`; filtering does not change ownership permissions.
