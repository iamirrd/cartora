import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { PageHeading } from "../../components/UI.jsx";

export default function AccountPage() {
  const { user } = useAuth();
  const links = [
    ["/orders", "سفارش‌های من", "پیگیری وضعیت و پرداخت سفارش‌ها"],
    ["/addresses", "نشانی‌های من", "ثبت و مدیریت نشانی‌های تحویل"],
    ["/wishlist", "علاقه‌مندی‌ها", "محصولاتی که برای بعد ذخیره کردی"],
    ["/notifications", "پیام‌های من", "اعلان‌های حساب و سفارش‌ها"],
  ];
  return (
    <section className="page">
      <PageHeading
        title={`سلام ${user.first_name || "همراه کارتورا"}!`}
        description="از اینجا خریدها و حساب خودت را مدیریت کن."
      />
      <div className="account-banner">
        <span className="avatar" aria-hidden="true">
          {(user.first_name || user.email).slice(0, 1)}
        </span>
        <div>
          <strong>
            {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
              "حساب کاربری"}
          </strong>
          <p>
            <bdi>{user.email}</bdi>
          </p>
          {user.phone && (
            <p>
              <bdi>{user.phone}</bdi>
            </p>
          )}
        </div>
      </div>
      <div className="account-grid">
        {links.map(([to, title, description]) => (
          <Link className="panel account-tile" to={to} key={to}>
            <h2>
              {title} <span aria-hidden="true">←</span>
            </h2>
            <p className="muted small">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
