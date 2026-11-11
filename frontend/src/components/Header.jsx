import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.jsx";
import { useCart } from "../features/cart/CartContext.jsx";
import { useAction } from "../hooks/useAction.js";
import { Feedback, number } from "./UI.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const action = useAction();
  return (
    <>
      <header className="header">
        <Link className="logo" to="/" aria-label="کارتورا، خانه">
          <span className="logo-mark">ک</span> کارتورا
          <span className="logo-dot">.</span>
        </Link>
        <nav className="main-nav" aria-label="منوی اصلی">
          <NavLink to="/" end>
            فروشگاه
          </NavLink>
          <NavLink to="/wishlist">علاقه‌مندی‌ها</NavLink>
          <NavLink to="/orders">سفارش‌ها</NavLink>
        </nav>
        <div className="header-actions">
          <NavLink className="cart-link" to="/cart">
            سبد خرید{" "}
            <span className="cart-count">
              {cart.status === "success" ? number(cart.count) : "…"}
            </span>
          </NavLink>
          {user ? (
            <>
              <NavLink to="/account">حساب من</NavLink>
              <button
                className="text-button small"
                disabled={action.pending}
                onClick={() => action.run(logout)}
              >
                {action.pending ? "خروج…" : "خروج"}
              </button>
            </>
          ) : (
            <Link className="secondary-button" to="/login">
              ورود / ثبت‌نام
            </Link>
          )}
        </div>
      </header>
      <Feedback action={action} />
      {user && (
        <nav className="account-nav" aria-label="منوی حساب">
          <NavLink to="/account">پیشخوان</NavLink>
          <NavLink to="/addresses">نشانی‌ها</NavLink>
          <NavLink to="/notifications">پیام‌ها</NavLink>
        </nav>
      )}
    </>
  );
}
