import { useEffect, useState } from "react";
import { getProducts } from "./catalogApi.js";

export function useProducts(filters) {
  const { search, ordering, page, category, brand } = filters;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState({ status: "loading", data: null, error: "" });
    getProducts({ search, ordering, page, category, brand }, controller.signal)
      .then((data) => {
        if (active) setState({ status: "success", data, error: "" });
      })
      .catch((error) => {
        if (active && error.name !== "AbortError") {
          setState({
            status: "error",
            data: null,
            error:
              error instanceof TypeError
                ? "ارتباط با سرور برقرار نشد. اجرای بک‌اند روی پورت ۸۰۰۰ را بررسی کنید."
                : error.message,
          });
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [search, ordering, page, category, brand, attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
