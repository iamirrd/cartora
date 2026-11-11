import { test, expect } from "@playwright/test";

// These are API-contract tests for the UI; no records in the user's database are changed.
async function setupApi(
  page,
  { brokenCatalog = false, productImage = null } = {},
) {
  const brand = { id: 1, name: "کارتورا", slug: "cartora", is_active: true };
  const category = { id: 1, name: "کیف", slug: "bags", is_active: true };
  const variant = {
    id: 11,
    product: 1,
    name: "مدل سبز",
    price: "200000",
    discount_price: "180000",
    image: null,
    description: "",
    is_active: true,
  };
  const product = {
    id: 1,
    name: "کیف روزمره",
    price: "200000",
    discount_price: "180000",
    description: "همراه روزهای شلوغ",
    category,
    brand,
    images: productImage
      ? [{ id: 1, image: productImage, is_primary: true }]
      : [],
    variants: [variant],
  };
  const user = {
    id: 1,
    email: "learner@example.com",
    first_name: "سارا",
    last_name: "",
    phone: "",
  };
  const state = {
    cart: [],
    orders: [],
    transactions: [],
    wishlist: [],
    addresses: [],
    reviews: [],
    notifications: [
      {
        id: 1,
        title: "خوش آمدی",
        message: "حساب شما آماده است.",
        is_read: false,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    checkoutCount: 0,
    brokenCatalog,
    queries: [],
  };
  const paginated = (results) => ({
    count: results.length,
    results,
    next: null,
    previous: null,
  });
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      const method = req.method();
      const body = req.postDataJSON();
      const respond = (data, status = 200) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(data),
        });
      if (["/api/accounts/login/", "/api/accounts/register/"].includes(path))
        return respond({ user, access: "access", refresh: "refresh" });
      if (path === "/api/accounts/logout/")
        return route.fulfill({ status: 205 });
      if (path === "/api/products/products/") {
        state.queries.push(url.searchParams);
        if (state.brokenCatalog) return respond({ detail: "offline" }, 503);
        return respond(
          paginated(
            url.searchParams.get("search") === "ناموجود" ? [] : [product],
          ),
        );
      }
      if (path === "/api/products/products/1/") return respond(product);
      if (path === "/api/products/categories/")
        return respond(paginated([category]));
      if (path === "/api/products/brands/") return respond(paginated([brand]));
      if (path === "/api/products/product-variants/11/")
        return respond(variant);
      if (path === "/api/cart/items/" && method === "GET")
        return respond(paginated(state.cart));
      if (path === "/api/cart/items/" && method === "POST") {
        if (state.cart.some((item) => item.variant === body.variant))
          return respond(
            { variant: ["This variant is already in the cart."] },
            400,
          );
        state.cart.push({
          id: 1,
          ...body,
          unit_price: "180000",
          subtotal: String(body.quantity * 180000),
        });
        return respond(state.cart[0], 201);
      }
      if (path === "/api/cart/items/1/" && method === "PATCH") {
        if (body.quantity > 3)
          return respond({ quantity: ["Insufficient stock."] }, 400);
        Object.assign(state.cart[0], {
          quantity: body.quantity,
          subtotal: String(body.quantity * 180000),
        });
        return respond(state.cart[0]);
      }
      if (path === "/api/cart/items/1/" && method === "DELETE") {
        state.cart = [];
        return route.fulfill({ status: 204 });
      }
      if (path === "/api/address/addresses/" && method === "GET")
        return respond(paginated(state.addresses));
      if (path === "/api/address/addresses/" && method === "POST") {
        state.addresses.push({ id: 1, ...body, is_active: true });
        return respond(state.addresses[0], 201);
      }
      if (path === "/api/address/addresses/1/" && method === "PATCH") {
        Object.assign(state.addresses[0], body);
        return respond(state.addresses[0]);
      }
      if (path === "/api/address/addresses/1/" && method === "DELETE") {
        state.addresses = [];
        return route.fulfill({ status: 204 });
      }
      if (path === "/api/shipping/shipping-methods/")
        return respond(
          paginated([{ id: 1, name: "پست", cost: "30000", is_active: true }]),
        );
      if (path === "/api/order/orders/checkout/") {
        state.checkoutCount++;
        const order = {
          id: 1,
          order_number: "ORD-TEST",
          status: "pending",
          shipping_cost: body.shipping_method ? "30000" : "0",
          discount_amount: "0",
          total_price: String(
            state.cart.reduce((sum, item) => sum + Number(item.subtotal), 0) +
              (body.shipping_method ? 30000 : 0),
          ),
          ...body,
        };
        state.orders.push(order);
        state.cart = [];
        return respond(order, 201);
      }
      if (path === "/api/order/orders/")
        return respond(paginated(state.orders));
      if (path === "/api/order/orders/1/") return respond(state.orders[0]);
      if (path === "/api/order/order-items/")
        return respond(
          paginated([
            {
              id: 1,
              order: 1,
              product_name: product.name,
              variant_name: variant.name,
              quantity: 2,
              price: "180000",
              subtotal: "360000",
            },
          ]),
        );
      if (path === "/api/payment/transactions/")
        return respond(paginated(state.transactions));
      if (path === "/api/payment/request/") {
        state.transactions.push({
          id: state.transactions.length + 1,
          order: 1,
          amount: state.orders[0].total_price,
          status: "pending",
          ref_id: "",
          created_at: "2026-01-01T00:00:00Z",
        });
        return respond({
          payment_url: "/api/payment/verify/?authority=MOCK-TEST&status=OK",
        });
      }
      if (path === "/api/payment/verify/") {
        const success = url.searchParams.get("status") === "OK";
        const txn = state.transactions.at(-1);
        txn.status = success ? "success" : "failed";
        if (success) {
          state.orders[0].status = "paid";
          txn.ref_id = "REF-TEST";
        }
        return respond(
          success
            ? { message: "Payment completed successfully." }
            : { error: "Payment cancelled or failed." },
          success ? 200 : 400,
        );
      }
      if (path === "/api/wishlist/wishlist-items/" && method === "GET")
        return respond(paginated(state.wishlist));
      if (path === "/api/wishlist/wishlist-items/" && method === "POST") {
        state.wishlist.push({ id: 1, variant: 11, variant_name: variant.name });
        return respond(state.wishlist[0], 201);
      }
      if (path === "/api/wishlist/wishlist-items/1/" && method === "DELETE") {
        state.wishlist = [];
        return route.fulfill({ status: 204 });
      }
      if (path === "/api/reviews/reviews/" && method === "GET")
        return respond(paginated(state.reviews));
      if (path === "/api/reviews/reviews/" && method === "POST") {
        state.reviews.push({
          id: 1,
          ...body,
          user: 1,
          user_name: "سارا",
          is_approved: false,
          created_at: "2026-01-01T00:00:00Z",
        });
        return respond(state.reviews[0], 201);
      }
      if (path === "/api/reviews/reviews/1/" && method === "PATCH") {
        Object.assign(state.reviews[0], body);
        return respond(state.reviews[0]);
      }
      if (path === "/api/reviews/reviews/1/" && method === "DELETE") {
        state.reviews = [];
        return route.fulfill({ status: 204 });
      }
      if (path === "/api/notification/list/")
        return respond(paginated(state.notifications));
      if (path === "/api/notification/mark-read/") {
        state.notifications.forEach((item) => {
          item.is_read = true;
        });
        return respond({ message: "ok" });
      }
      throw new Error(`Unexpected API call: ${method} ${path}`);
    },
  );
  return state;
}
async function login(page) {
  await page.goto("/login");
  await page.getByLabel("ایمیل", { exact: true }).fill("learner@example.com");
  await page.getByLabel("رمز عبور", { exact: true }).fill("Strong-password-42");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "حساب من", exact: true }),
  ).toBeVisible();
}
async function fillAddress(page) {
  await page.getByLabel("نام گیرنده", { exact: true }).fill("سارا رضایی");
  await page.getByLabel("موبایل گیرنده", { exact: true }).fill("۰۹۱۲۳۴۵۶۷۸۹");
  await page.getByLabel("استان", { exact: true }).fill("تهران");
  await page.getByLabel("شهر", { exact: true }).fill("تهران");
  await page.getByLabel("کد پستی ۱۰ رقمی", { exact: true }).fill("۱۲۳۴۵۶۷۸۹۰");
  await page
    .getByLabel("نشانی کامل", { exact: true })
    .fill("خیابان نمونه، پلاک ۱");
}

test("guest protection, login return, cart, checkout, failed payment and successful retry", async ({
  page,
}) => {
  const state = await setupApi(page);
  await page.goto("/products/1");
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("ایمیل", { exact: true }).fill("learner@example.com");
  await page.getByLabel("رمز عبور", { exact: true }).fill("Strong-password-42");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/\/products\/1/);
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "به سبد خرید اضافه شد." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "مشاهدهٔ سبد خرید" }).click();
  await page.getByRole("button", { name: "افزایش تعداد" }).click();
  await expect.poll(() => state.cart[0]?.quantity).toBe(2);
  await page.getByRole("link", { name: "ادامه و ثبت سفارش" }).click();
  await fillAddress(page);
  await page
    .getByRole("combobox", { name: "روش ارسال", exact: true })
    .selectOption("1");
  await page.getByRole("button", { name: "ثبت سفارش و مشاهدهٔ مبلغ" }).click();
  await expect(page).toHaveURL(/\/orders\/1/);
  await expect(page.getByText("۳۹۰٬۰۰۰", { exact: true })).toBeVisible();
  expect(state.orders[0].receiver_phone).toBe("09123456789");
  await page.getByRole("button", { name: "شروع پرداخت آزمایشی" }).click();
  await page.getByRole("button", { name: "شبیه‌سازی لغو پرداخت" }).click();
  await expect(page.getByRole("alert")).toContainText("پرداخت لغو شد");
  await page.getByRole("button", { name: "شروع پرداخت آزمایشی" }).click();
  await page.getByRole("button", { name: "شبیه‌سازی پرداخت موفق" }).click();
  await expect(page.getByText("پرداخت‌شده", { exact: true })).toBeVisible();
  await expect(page.getByText("REF-TEST", { exact: true })).toBeVisible();
  expect(state.checkoutCount).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "حساب من", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("پرداخت‌شده", { exact: true })).toBeVisible();
});

test("catalog filters persist through product navigation; empty and error states", async ({
  page,
}) => {
  const state = await setupApi(page);
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "دسته‌بندی", exact: true })
    .selectOption("bags");
  await page
    .getByRole("combobox", { name: "چیدمان", exact: true })
    .selectOption("price");
  await page.getByRole("link", { name: "مشاهده و انتخاب محصول" }).click();
  await page.goBack();
  await expect(
    page.getByRole("combobox", { name: "دسته‌بندی", exact: true }),
  ).toHaveValue("bags");
  await expect(
    page.getByRole("combobox", { name: "چیدمان", exact: true }),
  ).toHaveValue("price");
  await page.getByLabel("جست‌وجوی محصولات", { exact: true }).fill("ناموجود");
  await page.getByRole("button", { name: "جست‌وجو", exact: true }).click();
  await expect(page.getByText(/محصولی پیدا نشد/)).toBeVisible();
  expect(state.queries.at(-1).get("category")).toBe("bags");
});

test("address CRUD, review editing, wishlist and notifications", async ({
  page,
}) => {
  const state = await setupApi(page);
  await login(page);
  await page.getByRole("link", { name: "نشانی‌ها", exact: true }).click();
  await page.getByLabel("عنوان نشانی").fill("خانه");
  await fillAddress(page);
  await page.getByRole("button", { name: "ذخیرهٔ نشانی" }).click();
  await expect(
    page.getByRole("heading", { name: "خانه", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  await page.getByLabel("عنوان نشانی").fill("محل کار");
  await page.getByRole("button", { name: "ذخیرهٔ نشانی" }).click();
  await expect(
    page.getByRole("heading", { name: "محل کار", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "انتخاب پیش‌فرض" }).click();
  await expect(page.getByText("پیش‌فرض", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "حذف", exact: true }).click();
  await page.getByRole("button", { name: "بله، حذف", exact: true }).click();
  await expect(page.getByText("هنوز نشانی ذخیره نکرده‌ای.")).toBeVisible();
  await page.goto("/products/1");
  await page.getByRole("button", { name: "♡ علاقه‌مندی" }).click();
  await expect.poll(() => state.wishlist.length).toBe(1);
  await page.getByLabel("عنوان", { exact: true }).fill("انتخاب خوب");
  await page
    .getByLabel("توضیحات", { exact: true })
    .fill("برای استفادهٔ روزمره مناسب است.");
  await page.getByRole("button", { name: "ثبت دیدگاه", exact: true }).click();
  await expect(page.getByRole("heading", { name: "انتخاب خوب" })).toBeVisible();
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  await page.getByLabel("عنوان", { exact: true }).fill("نظر ویرایش‌شده");
  await page.getByRole("button", { name: "ثبت دیدگاه", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "نظر ویرایش‌شده" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "علاقه‌مندی‌ها", exact: true }).click();
  await expect(page.getByRole("heading", { name: "مدل سبز" })).toBeVisible();
  await page.getByRole("button", { name: "حذف از علاقه‌مندی‌ها" }).click();
  await page.getByRole("button", { name: "بله، حذف" }).click();
  await expect(page.getByText("هنوز محصولی ذخیره نکرده‌ای.")).toBeVisible();
  await page.getByRole("link", { name: "پیام‌ها", exact: true }).click();
  await page.getByRole("button", { name: "همه را خواندم" }).click();
  await expect(page.getByText("تازه", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "خروج", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("cartora.session")),
  ).toBeNull();
});

test("registration and responsive layout have no horizontal overflow", async ({
  page,
}) => {
  await setupApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  await page.getByLabel("نام", { exact: true }).fill("سارا");
  await page.getByLabel("ایمیل", { exact: true }).fill("learner@example.com");
  await page.getByLabel("رمز عبور", { exact: true }).fill("Strong-password-42");
  await page.getByLabel("تکرار رمز عبور").fill("Strong-password-42");
  await page.getByRole("button", { name: "ساخت حساب", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "حساب من", exact: true }),
  ).toBeVisible();
  for (const path of ["/", "/products/1", "/account", "/addresses", "/cart"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }
});

test("tall product photos do not cover the product name or price", async ({
  page,
}) => {
  await setupApi(page, { productImage: "/media/tall-product.svg" });
  await page.route("**/media/tall-product.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="3200"><rect width="800" height="3200" fill="#195a43"/></svg>',
    }),
  );
  await page.goto("/");
  const card = page.locator(".product-card").first();
  const image = card.locator("img");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await card.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element) => element.complete && element.naturalHeight === 3200,
        ),
      )
      .toBe(true);
    const bounds = await card.evaluate((element) => {
      const photo = element.querySelector("img").getBoundingClientRect();
      const area = element
        .querySelector(".product-image")
        .getBoundingClientRect();
      const heading = element.querySelector("h3").getBoundingClientRect();
      const price = element.querySelector(".price").getBoundingClientRect();
      return {
        photoBottom: photo.bottom,
        areaBottom: area.bottom,
        headingTop: heading.top,
        priceTop: price.top,
      };
    });
    expect(bounds.photoBottom).toBeLessThanOrEqual(bounds.areaBottom + 1);
    expect(bounds.photoBottom).toBeLessThan(bounds.headingTop);
    expect(bounds.photoBottom).toBeLessThan(bounds.priceTop);
    await expect(
      card.getByRole("heading", { name: "کیف روزمره" }),
    ).toBeVisible();
  }
});

test("catalog server error has a working retry action", async ({ page }) => {
  const state = await setupApi(page, { brokenCatalog: true });
  await page.goto("/");
  await expect(page.getByText("offline", { exact: true })).toBeVisible();
  state.brokenCatalog = false;
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(page.getByRole("heading", { name: "کیف روزمره" })).toBeVisible();
});

test("stock errors preserve cart quantities, duplicates are rejected, and removal empties the cart", async ({
  page,
}) => {
  const state = await setupApi(page);
  await login(page);
  await page.goto("/products/1");
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "به سبد خرید اضافه شد." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "این تنوع در سبد خرید است",
  );
  expect(state.cart.length).toBe(1);
  await page.getByRole("link", { name: "مشاهدهٔ سبد خرید" }).click();
  for (const quantity of [2, 3]) {
    await page.getByRole("button", { name: "افزایش تعداد" }).click();
    await expect.poll(() => state.cart[0].quantity).toBe(quantity);
  }
  await page.getByRole("button", { name: "افزایش تعداد" }).click();
  await expect(page.getByRole("alert")).toContainText("موجودی کافی نیست");
  expect(state.cart[0].quantity).toBe(3);
  await page.getByRole("button", { name: "حذف", exact: true }).click();
  await page.getByRole("button", { name: "بله، حذف", exact: true }).click();
  await expect(page.getByText("سبد خریدت هنوز خالی است.")).toBeVisible();
  expect(state.cart.length).toBe(0);
});
