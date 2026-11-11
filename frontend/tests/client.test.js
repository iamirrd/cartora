import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

const events = new EventTarget();
globalThis.window = events;
const storage = new Map();
globalThis.sessionStorage = {
  getItem: (key) => storage.get(key),
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const { request, list, errorMessage } = await import("../src/api/client.js");
const { getSession, setSession } =
  await import("../src/features/auth/session.js");
const originalFetch = globalThis.fetch;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const signIn = () =>
  setSession({
    access: "old",
    refresh: "refresh-token",
    user: { email: "test@example.com" },
  });
afterEach(() => {
  globalThis.fetch = originalFetch;
  setSession(null);
});

test("validation errors retain field labels and nested messages", async () => {
  globalThis.fetch = async () =>
    json({ quantity: ["Insufficient stock."] }, 400);
  await assert.rejects(
    request("cart/items/", {
      method: "POST",
      body: { variant: 1, quantity: 8 },
    }),
    (error) =>
      error.status === 400 &&
      error.message.includes("تعداد: موجودی کافی نیست."),
  );
  assert.equal(
    errorMessage({ detail: "The cart is empty." }),
    "سبد خرید خالی است.",
  );
});

test("expired access refreshes and retries the original authenticated request", async () => {
  signIn();
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (url === "/api/token/refresh/") return json({ access: "new" });
    return options.headers.Authorization === "Bearer new"
      ? json({ ok: true })
      : json({}, 401);
  };
  assert.deepEqual(await request("order/orders/"), { ok: true });
  assert.equal(calls.length, 3);
  assert.equal(getSession().access, "new");
  assert.equal(JSON.parse(calls[1].body).refresh, "refresh-token");
});

test("simultaneous expired requests share a single refresh", async () => {
  signIn();
  let refreshCount = 0;
  globalThis.fetch = async (url, options) => {
    if (url === "/api/token/refresh/") {
      refreshCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return json({ access: "new" });
    }
    return options.headers.Authorization === "Bearer new"
      ? json({ ok: true })
      : json({}, 401);
  };
  const results = await Promise.all([
    request("cart/items/"),
    request("order/orders/"),
  ]);
  assert.equal(refreshCount, 1);
  assert.equal(results.length, 2);
});

test("invalid refresh clears session, network failure preserves it", async () => {
  signIn();
  globalThis.fetch = async () => json({}, 401);
  await assert.rejects(request("cart/items/"));
  assert.equal(getSession(), null);
  signIn();
  globalThis.fetch = async (url) => {
    if (url.includes("refresh")) throw new TypeError("offline");
    return json({}, 401);
  };
  await assert.rejects(request("cart/items/"));
  assert.equal(getSession().refresh, "refresh-token");
});

test("a failed network mutation is not automatically sent twice", async () => {
  let count = 0;
  globalThis.fetch = async () => {
    count++;
    throw new TypeError("offline");
  };
  await assert.rejects(
    request("order/orders/checkout/", { method: "POST", body: {} }),
  );
  assert.equal(count, 1);
});

test("private lists follow all DRF pages, including absolute next URLs", async () => {
  const paths = [];
  globalThis.fetch = async (path) => {
    paths.push(path);
    return path.includes("page=2")
      ? json({ results: [{ id: 13 }], next: null })
      : json({
          results: [{ id: 1 }],
          next: "http://127.0.0.1:8000/api/cart/items/?page=2",
        });
  };
  assert.deepEqual(await list("cart/items/"), [{ id: 1 }, { id: 13 }]);
  assert.deepEqual(paths, ["/api/cart/items/", "/api/cart/items/?page=2"]);
});

test("login does not attach a previous user access token", async () => {
  signIn();
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return json({ ok: true });
  };
  await request("accounts/login/", { method: "POST", body: {}, auth: false });
});
