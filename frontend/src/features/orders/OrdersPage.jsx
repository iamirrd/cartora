import React from "react";
import { Link } from "react-router-dom";
import { useResource } from "../../hooks/useResource.js";
import {
  number,
  PageHeading,
  Resource,
  statusLabel,
} from "../../components/UI.jsx";

export default function OrdersPage() {
  const orders = useResource("order/orders/", true);
  return (
    <section className="page">
      <PageHeading
        title="سفارش‌های من"
        description="وضعیت خریدها و جزئیات سفارش‌هایت را اینجا ببین."
      />
      <Resource
        resource={orders}
        empty={
          !orders.data?.length && (
            <>
              <p>هنوز سفارشی ثبت نکرده‌ای.</p>
              <Link className="button" to="/">
                کشف محصولات
              </Link>
            </>
          )
        }
      >
        <div className="stack">
          {orders.data?.map((order) => (
            <article className="panel order-card" key={order.id}>
              <div>
                <p className="eyebrow">شمارهٔ سفارش</p>
                <strong>
                  <bdi>{order.order_number}</bdi>
                </strong>
                <p className="small muted">
                  {order.receiver_name} · {order.city}
                </p>
              </div>
              <span className={`status-pill status-${order.status}`}>
                {statusLabel(order.status)}
              </span>
              <strong>{number(order.total_price)}</strong>
              <Link className="secondary-button" to={`/orders/${order.id}`}>
                جزئیات و پرداخت ←
              </Link>
            </article>
          ))}
        </div>
      </Resource>
    </section>
  );
}
