import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "./useProducts.js";
import ProductCard from "./ProductCard.jsx";
import { useResource } from "../../hooks/useResource.js";
import { Resource } from "../../components/UI.jsx";

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const filters = {
    search: params.get("search") || "",
    ordering: params.get("ordering") || "-created_at",
    page: Math.max(1, Number(params.get("page")) || 1),
    category: params.get("category") || "",
    brand: params.get("brand") || "",
  };
  const [draft, setDraft] = useState(filters.search);
  useEffect(() => {
    setDraft(filters.search);
  }, [filters.search]);
  const categories = useResource("products/categories/", true);
  const brands = useResource("products/brands/", true);
  function setFilters(update) {
    const next = typeof update === "function" ? update(filters) : update;
    const query = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    setParams(query);
  }
  const { status, data, error, retry } = useProducts(filters);
  function search(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: draft.trim(), page: 1 }));
  }

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">انتخاب‌های تازه، برای هر روز</p>
          <h1>
            به دنیای کارتورا
            <br />
            خوش آمدی<span>.</span>
          </h1>
          <p className="hero-description">
            محصولات را ببین، مقایسه کن و انتخاب خودت را پیدا کن.
          </p>
          <a className="button" href="#catalog">
            کشف محصولات <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="shopping-bag">
            <div className="bag-handle" />
            <span>کارتورا.</span>
          </div>
          <span className="art-label">یک انتخاب تازه</span>
        </div>
      </section>
      <section id="catalog" className="catalog" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ویترین فروشگاه</p>
            <h2 id="catalog-title">محصولات ما</h2>
          </div>
          {status === "success" && (
            <span>
              {new Intl.NumberFormat("fa-IR").format(data.count)} محصول
            </span>
          )}
        </div>
        <div className="toolbar">
          <form role="search" onSubmit={search}>
            <label className="sr-only" htmlFor="search">
              جست‌وجوی محصولات
            </label>
            <input
              id="search"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="دنبال چه محصولی می‌گردی؟"
            />
            <button type="submit">جست‌وجو</button>
          </form>
          <label className="sort">
            چیدمان
            <select
              value={filters.ordering}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  ordering: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="-created_at">جدیدترین</option>
              <option value="price">کمترین قیمت</option>
              <option value="-price">بیشترین قیمت</option>
              <option value="name">نام محصول</option>
            </select>
          </label>
        </div>
        <div className="catalog-filters">
          <Resource resource={categories}>
            <label className="sort">
              دسته‌بندی
              <select
                value={filters.category}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    category: event.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="">همهٔ دسته‌ها</option>
                {categories.data?.map((item) => (
                  <option value={item.slug} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </Resource>
          <Resource resource={brands}>
            <label className="sort">
              برند
              <select
                value={filters.brand}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    brand: event.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="">همهٔ برندها</option>
                {brands.data?.map((item) => (
                  <option value={item.slug} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </Resource>
          {(filters.search || filters.category || filters.brand) && (
            <button className="text-button" onClick={() => setParams({})}>
              پاک‌کردن فیلترها ×
            </button>
          )}
        </div>
        <div aria-live="polite" aria-busy={status === "loading"}>
          {status === "loading" && (
            <div className="state">در حال دریافت محصولات…</div>
          )}
          {status === "error" && (
            <div className="state error">
              <p>{error}</p>
              <button className="button" onClick={retry}>
                تلاش دوباره
              </button>
            </div>
          )}
          {status === "success" &&
            (data.results.length ? (
              <>
                <div className="product-grid">
                  {data.results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <nav className="pagination" aria-label="صفحه‌بندی محصولات">
                  <button
                    disabled={!data.previous}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: current.page - 1,
                      }))
                    }
                  >
                    صفحهٔ قبل
                  </button>
                  <span>
                    صفحهٔ {new Intl.NumberFormat("fa-IR").format(filters.page)}
                  </span>
                  <button
                    disabled={!data.next}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  >
                    صفحهٔ بعد
                  </button>
                </nav>
              </>
            ) : (
              <div className="state">
                محصولی پیدا نشد. عبارت جست‌وجو یا محصولات فعال در پنل مدیریت را
                بررسی کنید.
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
