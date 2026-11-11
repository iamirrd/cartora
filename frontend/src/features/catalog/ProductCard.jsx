import React, { useState } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../../api/client.js";

const number = new Intl.NumberFormat("fa-IR");

export default function ProductCard({ product }) {
  const [failedImage, setFailedImage] = useState(false);
  const image =
    product.images.find((item) => item.is_primary) ?? product.images[0];
  const discounted =
    product.discount_price !== null &&
    Number(product.discount_price) < Number(product.price);
  // The backend does not define a currency unit, so do not assume rial/toman.
  return (
    <article className="product-card">
      <div className="product-image">
        {image && !failedImage ? (
          <img
            src={mediaUrl(image.image)}
            alt={product.name}
            loading="lazy"
            onError={() => setFailedImage(true)}
          />
        ) : (
          <span
            className="image-placeholder"
            aria-label="تصویر محصول موجود نیست"
          >
            ◇
          </span>
        )}
        {discounted && (
          <span className="badge">
            {number.format(
              Math.round((1 - product.discount_price / product.price) * 100),
            )}
            ٪ تخفیف
          </span>
        )}
      </div>
      <div className="product-content">
        <p className="eyebrow">
          {product.brand?.name} / {product.category?.name}
        </p>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="price">
          {discounted && <del>{number.format(product.price)}</del>}
          <strong>
            {number.format(discounted ? product.discount_price : product.price)}
          </strong>
        </div>
        <details>
          <summary>دربارهٔ محصول</summary>
          <p>{product.description || "توضیحی برای این محصول ثبت نشده است."}</p>
          <p>{number.format(product.variants.length)} تنوع ثبت‌شده</p>
        </details>
        <Link className="product-link" to={`/products/${product.id}`}>
          مشاهده و انتخاب محصول <span aria-hidden="true">←</span>
        </Link>
      </div>
    </article>
  );
}
