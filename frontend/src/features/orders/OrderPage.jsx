import React, { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useResource } from "../../hooks/useResource.js";
import { useAction } from "../../hooks/useAction.js";
import { post, request } from "../../api/client.js";
import {
  date,
  Feedback,
  number,
  PageHeading,
  Resource,
  statusLabel,
} from "../../components/UI.jsx";

export default function OrderPage() {
  const { id } = useParams();
  const location = useLocation();
  const order = useResource(`order/orders/${id}/`);
  const items = useResource(`order/order-items/?order=${id}`, true);
  const transactions = useResource("payment/transactions/", true);
  const [payment, setPayment] = useState(null);
  const [createdDismissed, setCreatedDismissed] = useState(false);
  const action = useAction();
  const data = order.data;
  function startPayment() {
    action.run(async () => {
      const result = await post("payment/request/", { order_id: Number(id) });
      const url = new URL(result.payment_url, window.location.origin);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== "/api/payment/verify/" ||
        !url.searchParams.get("authority")?.startsWith("MOCK-")
      )
        throw new Error("پاسخ درگاه آزمایشی نامعتبر است.");
      setPayment(`${url.pathname.slice(5)}${url.search}`);
      transactions.reload();
    });
  }
  function verify(success) {
    action.run(async () => {
      const url = new URL(`/api/${payment}`, window.location.origin);
      url.searchParams.set("status", success ? "OK" : "NOK");
      try {
        await request(`${url.pathname.slice(5)}${url.search}`, { auth: false });
      } finally {
        setPayment(null);
        setCreatedDismissed(true);
        order.reload();
        transactions.reload();
      }
    }, "پرداخت آزمایشی با موفقیت انجام شد.");
  }
  return (
    <section className="page">
      <PageHeading title="جزئیات سفارش">
        <Link className="inline-link" to="/orders">
          → همهٔ سفارش‌ها
        </Link>
      </PageHeading>
      {location.state?.created && !createdDismissed && (
        <div className="notice notice-success" role="status">
          سفارش ثبت شد؛ اکنون می‌توانی مبلغ نهایی را مرور و پرداخت کنی.
        </div>
      )}
      <Feedback action={action} />
      <Resource resource={order}>
        {data && (
          <>
            <div className="order-banner">
              <div>
                <span className="muted small">شمارهٔ سفارش</span>
                <h2>
                  <bdi>{data.order_number}</bdi>
                </h2>
              </div>
              <span className={`status-pill status-${data.status}`}>
                {statusLabel(data.status)}
              </span>
              <button
                className="text-button"
                disabled={action.pending}
                onClick={() => {
                  order.reload();
                  transactions.reload();
                  items.reload();
                }}
              >
                به‌روزرسانی وضعیت
              </button>
            </div>
            <div className="checkout-layout">
              <div className="stack">
                <div className="panel">
                  <h2>کالاهای سفارش</h2>
                  <Resource
                    resource={items}
                    empty={!items.data?.length && "کالایی در این سفارش نیست."}
                  >
                    {items.data?.map((item) => (
                      <div className="order-item" key={item.id}>
                        <div>
                          <strong>{item.product_name}</strong>
                          <p className="muted small">
                            {item.variant_name} · {number(item.quantity)} عدد ×{" "}
                            {number(item.price)}
                          </p>
                        </div>
                        <strong>{number(item.subtotal)}</strong>
                      </div>
                    ))}
                  </Resource>
                </div>
                <div className="panel">
                  <h2>نشانی تحویل</h2>
                  <p>
                    {data.receiver_name} · <bdi>{data.receiver_phone}</bdi>
                  </p>
                  <p>
                    {data.province}، {data.city}، {data.full_address}
                  </p>
                  <p className="muted small">
                    کد پستی: <bdi>{data.postal_code}</bdi>
                  </p>
                </div>
              </div>
              <aside className="panel summary-panel">
                <h2>مبلغ نهایی</h2>
                <div className="summary-line">
                  <span>ارسال</span>
                  <span>{number(data.shipping_cost)}</span>
                </div>
                <div className="summary-line">
                  <span>تخفیف {data.coupon_code || ""}</span>
                  <span>{number(data.discount_amount)}</span>
                </div>
                <div className="summary-line total">
                  <span>قابل پرداخت</span>
                  <strong>{number(data.total_price)}</strong>
                </div>
                {data.status === "pending" && (
                  <>
                    <p className="muted small">
                      پرداخت این پروژه آزمایشی است و پول واقعی جابه‌جا نمی‌کند.
                    </p>
                    {!payment && (
                      <button
                        className="button full"
                        disabled={action.pending}
                        onClick={startPayment}
                      >
                        {action.pending
                          ? "در حال اتصال…"
                          : "شروع پرداخت آزمایشی"}
                      </button>
                    )}
                  </>
                )}
                {payment && data.status === "pending" && (
                  <div className="mock-payment">
                    <h3>شبیه‌ساز پرداخت</h3>
                    <p className="small">نتیجهٔ پرداخت آزمایشی را انتخاب کن:</p>
                    <div className="stack">
                      <button
                        className="button"
                        disabled={action.pending}
                        onClick={() => verify(true)}
                      >
                        شبیه‌سازی پرداخت موفق
                      </button>
                      <button
                        className="secondary-button"
                        disabled={action.pending}
                        onClick={() => verify(false)}
                      >
                        شبیه‌سازی لغو پرداخت
                      </button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </Resource>
      <section className="transactions">
        <h2>تراکنش‌های این سفارش</h2>
        <Resource
          resource={transactions}
          empty={
            !transactions.data?.some((item) => String(item.order) === id) &&
            "هنوز تراکنشی ثبت نشده است."
          }
        >
          {transactions.data
            ?.filter((item) => String(item.order) === id)
            .map((item) => (
              <article className="panel transaction-row" key={item.id}>
                <span className={`status-pill status-${item.status}`}>
                  {statusLabel(item.status)}
                </span>
                <strong>{number(item.amount)}</strong>
                <span className="muted small">{date(item.created_at)}</span>
                <span className="small">
                  کد پیگیری: <bdi>{item.ref_id || "—"}</bdi>
                </span>
              </article>
            ))}
        </Resource>
      </section>
    </section>
  );
}
