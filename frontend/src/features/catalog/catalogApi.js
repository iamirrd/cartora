import { get } from "../../api/client.js";

export function getProducts(
  { search, ordering, page, category = "", brand = "" },
  signal,
) {
  const query = new URLSearchParams({ search, ordering, page: String(page) });
  if (category) query.set("category", category);
  if (brand) query.set("brand", brand);
  return get(`products/products/?${query}`, signal);
}
