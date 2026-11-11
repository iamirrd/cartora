import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import { updateCartItem, deleteCartItem } from "./cartApi.js";
import { useResource } from "../../hooks/useResource.js";
import { useAction } from "../../hooks/useAction.js";
import {
  ConfirmDelete,
  Feedback,
  number,
  PageHeading,
  ProductImage,
  Resource,
} from "../../components/UI.jsx";

function CartRow({ item, pending, change, erase }) {
  const variant = useResource(`products/product-variants/${item.variant}/`);
  const data = variant.data;
  return (
    <article className="cart-row">
      <div className="cart-thumb">
        <ProductImage src={data?.image} alt={data?.name || "محصول سبد"} />
      </div>
      <div className="cart-info">
        {data ? (
          <Link className="inline-link" to={`/products/${data.product}`}>
            {data.name}
          </Link>
        ) : (
          <span>تنوع #{number(item.variant)}</span>
        )}
        {variant.status === "error" && (
          <button className="text-button small" onClick={variant.reload}>
            دریافت مجدد نام محصول
          </button>
        )}
        <p className="muted small">قیمت واحد: {number(item.unit_price)}</p>
        <ConfirmDelete pending={pending} onConfirm={erase} />
      </div>
      <div className="quantity">
        <button
          aria-label="کاهش تعداد"
          disabled={pending || item.quantity <= 1}
          onClick={() => change(item.quantity - 1)}
        >
          −
        </button>
        <span>{number(item.quantity)}</span>
        <button
          aria-label="افزایش تعداد"
          disabled={pending}
          onClick={() => change(item.quantity + 1)}
        >
          +
        </button>
      </div>
      <strong>{number(item.subtotal)}</strong>
    </article>
  );
}
export default function CartPage() {
  const cart = useCart();
  const action = useAction();
  function mutate(task) {
    action.run(async () => {
      await task();
      await cart.reload();
    });
  }
  return (
    <section className="page">
      <PageHeading
        title="سبد خرید"
        description="انتخاب‌هایت را مرور کن و برای ثبت سفارش آماده شو."
      />
      <Feedback action={action} />
      <Resource
        resource={cart}
        empty={
          !cart.items.length && (
            <>
              <p>سبد خریدت هنوز خالی است.</p>
              <Link className="button" to="/">
                دیدن محصولات
              </Link>
            </>
          )
        }
      >
        <div className="checkout-layout">
          <div className="panel cart-list">
            {cart.items.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                pending={action.pending}
                change={(quantity) =>
                  mutate(() => updateCartItem(item.id, quantity))
                }
                erase={() => mutate(() => deleteCartItem(item.id))}
              />
            ))}
          </div>
          <aside className="panel summary-panel">
            <h2>خلاصهٔ خرید</h2>
            <div className="summary-line">
              <span>تعداد کالا</span>
              <span>{number(cart.count)}</span>
            </div>
            <div className="summary-line total">
              <span>جمع سبد</span>
              <strong>{number(cart.total)}</strong>
            </div>
            <p className="muted small">
              هزینهٔ ارسال و تخفیف در سفارش محاسبه می‌شوند. قیمت و موجودی هنگام
              ثبت سفارش دوباره بررسی می‌شوند.
            </p>
            {!action.pending && cart.status === "success" && (
              <Link className="button full" to="/checkout">
                ادامه و ثبت سفارش ←
              </Link>
            )}
          </aside>
        </div>
      </Resource>
    </section>
  );
}
