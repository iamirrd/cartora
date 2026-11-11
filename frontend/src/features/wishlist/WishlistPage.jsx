import React from "react";
import { Link } from "react-router-dom";
import { useResource } from "../../hooks/useResource.js";
import { useAction } from "../../hooks/useAction.js";
import { remove } from "../../api/client.js";
import {
  ConfirmDelete,
  Feedback,
  number,
  PageHeading,
  Price,
  ProductImage,
  Resource,
} from "../../components/UI.jsx";

function WishlistCard({ item, erase, pending }) {
  const variant = useResource(`products/product-variants/${item.variant}/`);
  return (
    <article className="panel wishlist-card">
      <div className="wishlist-image">
        <ProductImage src={variant.data?.image} alt={item.variant_name} />
      </div>
      <h2>{item.variant_name || `تنوع ${number(item.variant)}`}</h2>
      <Resource resource={variant}>
        {variant.data && (
          <>
            <Price item={variant.data} />
            <Link
              className="button full"
              to={`/products/${variant.data.product}`}
            >
              مشاهده و خرید ←
            </Link>
          </>
        )}
      </Resource>
      <ConfirmDelete
        pending={pending}
        onConfirm={erase}
        label="حذف از علاقه‌مندی‌ها"
      />
    </article>
  );
}
export default function WishlistPage() {
  const resource = useResource("wishlist/wishlist-items/", true);
  const action = useAction();
  return (
    <section className="page">
      <PageHeading
        title="علاقه‌مندی‌های من"
        description="انتخاب‌هایی که برای بعد کنار گذاشته‌ای."
      />
      <Feedback action={action} />
      <Resource
        resource={resource}
        empty={
          !resource.data?.length && (
            <>
              <p>هنوز محصولی ذخیره نکرده‌ای.</p>
              <Link className="button" to="/">
                دیدن محصولات
              </Link>
            </>
          )
        }
      >
        <div className="product-grid">
          {resource.data?.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              pending={action.pending}
              erase={() =>
                action.run(async () => {
                  await remove(`wishlist/wishlist-items/${item.id}/`);
                  resource.reload();
                }, "از علاقه‌مندی‌ها حذف شد.")
              }
            />
          ))}
        </div>
      </Resource>
    </section>
  );
}
