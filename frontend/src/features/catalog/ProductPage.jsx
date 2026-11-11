import React, { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useResource } from "../../hooks/useResource.js";
import { useAction } from "../../hooks/useAction.js";
import {
  Feedback,
  Field,
  number,
  Price,
  ProductImage,
  Resource,
} from "../../components/UI.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { useCart } from "../cart/CartContext.jsx";
import { addCartItem } from "../cart/cartApi.js";
import { post } from "../../api/client.js";
import Reviews from "../reviews/Reviews.jsx";

export default function ProductPage() {
  const { id } = useParams();
  const product = useResource(`products/products/${id}/`);
  return (
    <section className="page">
      <Link className="inline-link" to="/">
        → بازگشت به فروشگاه
      </Link>
      <Resource resource={product}>
        {product.data && (
          <ProductDetail key={product.data.id} product={product.data} />
        )}
      </Resource>
    </section>
  );
}
function ProductDetail({ product }) {
  const variants = product.variants.filter((item) => item.is_active);
  const [variantId, setVariantId] = useState(String(variants[0]?.id || ""));
  const [quantity, setQuantity] = useState(1);
  const primary =
    product.images.find((item) => item.is_primary) || product.images[0];
  const [image, setImage] = useState(primary?.image);
  const selected = variants.find((item) => String(item.id) === variantId);
  const { user } = useAuth();
  const cart = useCart();
  const action = useAction();
  const navigate = useNavigate();
  const location = useLocation();
  function buy(wishlist = false) {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    action.run(
      async () => {
        if (!selected) throw new Error("ابتدا یک تنوع را انتخاب کنید.");
        if (!Number.isInteger(quantity) || quantity < 1)
          throw new Error("تعداد باید عدد صحیح و حداقل یک باشد.");
        if (wishlist)
          await post("wishlist/wishlist-items/", { variant: selected.id });
        else {
          if (cart.status !== "success")
            throw new Error(
              "ابتدا وضعیت سبد را با دکمهٔ دریافت سبد بررسی کنید.",
            );
          if (cart.items.some((item) => item.variant === selected.id))
            throw new Error(
              "این تنوع در سبد خرید است؛ تعداد را در صفحهٔ سبد تغییر دهید.",
            );
          await addCartItem(selected.id, quantity);
          await cart.reload();
        }
      },
      wishlist ? "در علاقه‌مندی‌ها ذخیره شد." : "به سبد خرید اضافه شد.",
    );
  }
  return (
    <>
      <div className="product-detail">
        <div>
          <div className="detail-image">
            <ProductImage src={image} alt={product.name} />
          </div>
          <div className="thumbnails">
            {product.images.map((item) => (
              <button
                key={item.id}
                className={image === item.image ? "selected" : ""}
                aria-label="نمایش تصویر محصول"
                onClick={() => setImage(item.image)}
              >
                <ProductImage src={item.image} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-info">
          <p className="eyebrow">
            {product.category?.name} / {product.brand?.name}
          </p>
          <h1>{product.name}</h1>
          <Price item={selected || product} />
          <p className="description">
            {product.description || "توضیحی برای این محصول ثبت نشده است."}
          </p>
          <Feedback action={action} />
          {variants.length ? (
            <>
              <Field label="انتخاب تنوع">
                <select
                  value={variantId}
                  disabled={action.pending}
                  onChange={(event) => {
                    setVariantId(event.target.value);
                    const variant = variants.find(
                      (item) => String(item.id) === event.target.value,
                    );
                    setImage(variant?.image || primary?.image);
                  }}
                >
                  {variants.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {number(item.discount_price ?? item.price)}
                    </option>
                  ))}
                </select>
              </Field>
              {selected?.description && (
                <p className="muted">{selected.description}</p>
              )}
              <Field
                label="تعداد"
                type="number"
                min="1"
                step="1"
                value={quantity}
                disabled={action.pending}
                onChange={(event) =>
                  setQuantity(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
              />
              <div className="actions">
                <button
                  className="button"
                  disabled={action.pending}
                  onClick={() => buy()}
                >
                  {action.pending ? "در حال ثبت…" : "افزودن به سبد خرید"}
                </button>
                <button
                  className="secondary-button"
                  disabled={action.pending}
                  onClick={() => buy(true)}
                >
                  ♡ علاقه‌مندی
                </button>
              </div>
              {user && cart.status === "error" && (
                <button className="text-button" onClick={cart.reload}>
                  دریافت سبد
                </button>
              )}
              <Link className="inline-link small" to="/cart">
                مشاهدهٔ سبد خرید ←
              </Link>
              <p className="muted small">
                موجودی نهایی هنگام افزودن به سبد توسط سرور بررسی می‌شود.
              </p>
            </>
          ) : (
            <div className="notice">این محصول فعلاً تنوع قابل خرید ندارد.</div>
          )}
        </div>
      </div>
      <Reviews productId={product.id} />
    </>
  );
}
