import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../cart/CartContext.jsx";
import { useResource } from "../../hooks/useResource.js";
import { useAction } from "../../hooks/useAction.js";
import { post } from "../../api/client.js";
import {
  Feedback,
  Field,
  number,
  PageHeading,
  Resource,
} from "../../components/UI.jsx";
import AddressFields, {
  addressBody,
  emptyAddress,
} from "../addresses/AddressFields.jsx";

export default function CheckoutPage() {
  const cart = useCart();
  const addresses = useResource("address/addresses/", true);
  const shipping = useResource("shipping/shipping-methods/", true);
  const [address, setAddress] = useState({ ...emptyAddress });
  const [selectedAddress, setSelectedAddress] = useState("");
  const [method, setMethod] = useState("");
  const [coupon, setCoupon] = useState("");
  const action = useAction();
  const navigate = useNavigate();
  const shippingCost = Number(
    shipping.data?.find((item) => String(item.id) === method)?.cost || 0,
  );
  function submit(event) {
    event.preventDefault();
    action.run(async () => {
      const body = addressBody(address);
      if (method) body.shipping_method = Number(method);
      if (coupon.trim()) body.coupon_code = coupon.trim();
      const order = await post("order/orders/checkout/", body);
      await cart.reload();
      // Payment is separate: a payment failure must never recreate the order.
      navigate(`/orders/${order.id}`, {
        replace: true,
        state: { created: true },
      });
    });
  }
  return (
    <section className="page">
      <PageHeading
        title="ثبت سفارش"
        description="نشانی و روش ارسال را انتخاب کن؛ پیش از پرداخت مبلغ نهایی را می‌بینی."
      />
      <Feedback action={action} />
      <Resource
        resource={cart}
        empty={
          !cart.items.length && (
            <>
              <p>برای ثبت سفارش، ابتدا محصولی به سبد اضافه کن.</p>
              <Link className="button" to="/">
                رفتن به فروشگاه
              </Link>
            </>
          )
        }
      >
        <form className="checkout-layout" onSubmit={submit}>
          <div className="panel">
            <h2>۱. نشانی گیرنده</h2>
            <Resource resource={addresses}>
              <Field label="انتخاب از نشانی‌های ذخیره‌شده">
                <select
                  value={selectedAddress}
                  disabled={action.pending}
                  onChange={(event) => {
                    setSelectedAddress(event.target.value);
                    const saved = addresses.data.find(
                      (item) => String(item.id) === event.target.value,
                    );
                    setAddress(
                      saved ? addressBody(saved) : { ...emptyAddress },
                    );
                  }}
                >
                  <option value="">ورود نشانی جدید</option>
                  {addresses.data
                    ?.filter((item) => item.is_active)
                    .map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.title}
                        {item.is_default ? " (پیش‌فرض)" : ""}
                      </option>
                    ))}
                </select>
              </Field>
            </Resource>
            <fieldset disabled={action.pending}>
              <AddressFields
                value={address}
                onChange={(value) => {
                  setAddress(value);
                  setSelectedAddress("");
                }}
              />
            </fieldset>
            <p className="small muted">
              نشانی این فرم روی سفارش ثبت می‌شود. برای نگهداری در دفترچه، از{" "}
              <Link className="inline-link" to="/addresses">
                نشانی‌های من
              </Link>{" "}
              استفاده کن.
            </p>
            <h2>۲. روش ارسال</h2>
            <Resource resource={shipping}>
              <fieldset disabled={action.pending}>
                <Field label="روش ارسال">
                  <select
                    value={method}
                    onChange={(event) => setMethod(event.target.value)}
                  >
                    <option value="">بدون روش ارسال مشخص (هزینهٔ صفر)</option>
                    {shipping.data
                      ?.filter((item) => item.is_active)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {number(item.cost)}
                          {item.delivery_time ? ` · ${item.delivery_time}` : ""}
                        </option>
                      ))}
                  </select>
                </Field>
              </fieldset>
            </Resource>
            <fieldset disabled={action.pending}>
              <Field
                label="کد تخفیف (اختیاری)"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                dir="ltr"
              />
            </fieldset>
          </div>
          <aside className="panel summary-panel">
            <h2>مرور سفارش</h2>
            <div className="summary-line">
              <span>کالاها ({number(cart.count)})</span>
              <strong>{number(cart.total)}</strong>
            </div>
            <div className="summary-line">
              <span>ارسال</span>
              <span>{number(shippingCost)}</span>
            </div>
            <div className="summary-line total">
              <span>جمع پیش از تخفیف</span>
              <strong>{number(cart.total + shippingCost)}</strong>
            </div>
            <p className="muted small">
              اعتبار کد تخفیف و مبلغ نهایی را سرور تعیین می‌کند و در صفحهٔ سفارش
              می‌بینی. ثبت سفارش، سبد را خالی می‌کند؛ پرداخت مرحلهٔ بعد است.
            </p>
            <button
              className="button full"
              disabled={
                action.pending ||
                cart.status !== "success" ||
                shipping.status !== "success"
              }
            >
              {action.pending
                ? "در حال ثبت سفارش…"
                : "ثبت سفارش و مشاهدهٔ مبلغ"}
            </button>
            <Link className="inline-link small" to="/cart">
              → برگشت به سبد
            </Link>
          </aside>
        </form>
      </Resource>
    </section>
  );
}
