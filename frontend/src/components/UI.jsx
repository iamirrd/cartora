import React from "react";
import { mediaUrl } from "../api/client.js";

export const number = (value) =>
  new Intl.NumberFormat("fa-IR").format(Number(value || 0));
export const date = (value) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
    new Date(value),
  );
export const statusLabel = (value) =>
  ({
    pending: "در انتظار پرداخت",
    paid: "پرداخت‌شده",
    processing: "در حال پردازش",
    shipped: "ارسال‌شده",
    delivered: "تحویل‌شده",
    cancelled: "لغوشده",
    refunded: "بازگشت وجه",
    success: "موفق",
    failed: "ناموفق",
  })[value] || value;
export function PageHeading({ title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">کارتورا / حساب و خرید</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Field({ label, name, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input name={name} {...props} />}
    </label>
  );
}
export function Feedback({ action }) {
  return (
    <>
      {action.error && (
        <div className="notice notice-error" role="alert">
          {action.error}
        </div>
      )}
      {action.message && (
        <div className="notice notice-success" role="status">
          {action.message}
        </div>
      )}
    </>
  );
}
export function Resource({ resource, empty, children }) {
  if (resource.status === "loading")
    return (
      <div className="state" role="status">
        در حال دریافت اطلاعات…
      </div>
    );
  if (resource.status === "error")
    return (
      <div className="state error" role="alert">
        <p>{resource.error}</p>
        <button className="button" onClick={resource.reload}>
          تلاش دوباره
        </button>
      </div>
    );
  if (empty) return <div className="state">{empty}</div>;
  return children;
}
export function ProductImage({ src, alt, className = "" }) {
  const [failedSrc, setFailedSrc] = React.useState(null);
  const resolved = mediaUrl(src);
  return resolved && failedSrc !== resolved ? (
    <img
      className={`shop-image ${className}`}
      src={resolved}
      alt={alt}
      onError={() => setFailedSrc(resolved)}
    />
  ) : (
    <span
      className="image-placeholder"
      role="img"
      aria-label="تصویر موجود نیست"
    >
      ◇
    </span>
  );
}
export function Price({ item }) {
  const discounted =
    item.discount_price !== null &&
    item.discount_price !== undefined &&
    Number(item.discount_price) < Number(item.price);
  return (
    <div className="price">
      {discounted && <del>{number(item.price)}</del>}
      <strong>{number(discounted ? item.discount_price : item.price)}</strong>
    </div>
  );
}
export function ConfirmDelete({ onConfirm, pending, label = "حذف" }) {
  const [confirm, setConfirm] = React.useState(false);
  return confirm ? (
    <span className="actions">
      <span>حذف شود؟</span>
      <button
        type="button"
        className="danger"
        disabled={pending}
        onClick={onConfirm}
      >
        بله، حذف
      </button>
      <button
        type="button"
        className="text-button"
        disabled={pending}
        onClick={() => setConfirm(false)}
      >
        انصراف
      </button>
    </span>
  ) : (
    <button
      type="button"
      className="text-button danger"
      disabled={pending}
      onClick={() => setConfirm(true)}
    >
      {label}
    </button>
  );
}
