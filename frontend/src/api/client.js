import { getSession, setSession } from "../features/auth/session.js";

const labels = {
  email: "ایمیل",
  password: "رمز عبور",
  password2: "تکرار رمز",
  phone: "موبایل",
  quantity: "تعداد",
  variant: "تنوع",
  product: "محصول",
  receiver_name: "نام گیرنده",
  receiver_phone: "موبایل گیرنده",
  postal_code: "کد پستی",
  full_address: "نشانی",
  coupon_code: "کد تخفیف",
  shipping_method: "روش ارسال",
  title: "عنوان",
  city: "شهر",
  province: "استان",
};
const messages = {
  "Insufficient stock.": "موجودی کافی نیست.",
  "This variant is already in the cart.":
    "این تنوع در سبد موجود است؛ تعداد را از سبد تغییر دهید.",
  "This variant is already in your wishlist.":
    "این تنوع قبلاً در علاقه‌مندی‌ها ذخیره شده است.",
  "You have already reviewed this product.":
    "قبلاً برای این محصول نظر ثبت کرده‌اید.",
  "Email already exists": "این ایمیل قبلاً ثبت شده است.",
  "Passwords do not match": "رمز عبور و تکرار آن یکسان نیستند.",
  "No active account found with the given credentials":
    "ایمیل یا رمز عبور درست نیست.",
  "No live payment gateway is configured.":
    "درگاه پرداخت آزمایشی در تنظیمات بک‌اند فعال نیست.",
  "Payment cancelled or failed.": "پرداخت لغو شد یا ناموفق بود.",
  "The cart is empty.": "سبد خرید خالی است.",
};
export function errorMessage(value) {
  if (typeof value === "string") return messages[value] || value;
  if (Array.isArray(value)) return value.map(errorMessage).join("؛ ");
  if (value && typeof value === "object")
    return Object.entries(value)
      .map(
        ([key, entry]) =>
          `${labels[key] ? `${labels[key]}: ` : ""}${errorMessage(entry)}`,
      )
      .join(" — ");
  return "درخواست ناموفق بود؛ دوباره تلاش کنید.";
}
export class ApiError extends Error {
  constructor(status, data) {
    super(errorMessage(data));
    this.status = status;
    this.data = data;
  }
}
let refreshing;
async function refreshAccess() {
  if (!refreshing) {
    const previous = getSession();
    refreshing = (async () => {
      if (!previous?.refresh)
        throw new ApiError(401, "برای ادامه دوباره وارد شوید.");
      const response = await fetch("/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: previous.refresh }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (
          [400, 401].includes(response.status) &&
          getSession()?.refresh === previous.refresh
        )
          setSession(null);
        throw new ApiError(
          response.status,
          "نشست منقضی شده؛ دوباره وارد شوید.",
        );
      }
      if (getSession()?.refresh !== previous.refresh)
        throw new ApiError(401, "نشست تغییر کرده است؛ دوباره تلاش کنید.");
      setSession({
        ...previous,
        access: data.access,
        refresh: data.refresh || previous.refresh,
      });
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}
export async function request(
  path,
  { method = "GET", body, signal, auth = true } = {},
) {
  const send = () =>
    fetch(`/api/${path}`, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(auth && getSession()?.access
          ? { Authorization: `Bearer ${getSession().access}` }
          : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const originalAccess = auth ? getSession()?.access : null;
  let response;
  try {
    response = await send();
    if (response.status === 401 && auth && getSession()?.refresh) {
      if (getSession()?.access === originalAccess) await refreshAccess();
      response = await send();
    }
  } catch (error) {
    if (error.name === "AbortError" || error instanceof ApiError) throw error;
    throw new Error(
      "ارتباط با سرور برقرار نشد. اتصال و اجرای بک‌اند روی پورت ۸۰۰۰ را بررسی کنید.",
    );
  }
  if (response.status === 204 || response.status === 205) return null;
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      `پاسخ سرور قابل خواندن نیست (کد ${response.status}).`,
    );
  }
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}
export const get = (path, signal) => request(path, { signal });
export const post = (path, body) => request(path, { method: "POST", body });
export const patch = (path, body) => request(path, { method: "PATCH", body });
export const remove = (path) => request(path, { method: "DELETE" });
export async function list(path, signal) {
  const rows = [],
    visited = new Set();
  while (path) {
    if (visited.has(path)) throw new Error("پاسخ صفحه‌بندی سرور نامعتبر است.");
    visited.add(path);
    const data = await get(path, signal);
    rows.push(...(Array.isArray(data) ? data : data.results));
    if (!data.next) break;
    const next = new URL(data.next, "http://api.local");
    if (!next.pathname.startsWith("/api/"))
      throw new Error("مسیر صفحه‌بندی سرور نامعتبر است.");
    path = `${next.pathname.slice(5)}${next.search}`;
  }
  return rows;
}
export function mediaUrl(value) {
  if (!value) return null;
  const url = new URL(value, window.location.origin);
  if (!["http:", "https:"].includes(url.protocol)) return null;
  return import.meta.env.DEV && url.pathname.startsWith("/media/")
    ? `${url.pathname}${url.search}`
    : url.href;
}
