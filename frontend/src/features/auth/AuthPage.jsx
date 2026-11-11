import React from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useAction } from "../../hooks/useAction.js";
import { Feedback, Field } from "../../components/UI.jsx";

export default function AuthPage({ register = false }) {
  const { user, authenticate } = useAuth();
  const action = useAction();
  const navigate = useNavigate();
  const location = useLocation();
  const target = location.state?.from;
  const from =
    typeof target === "string" &&
    target.startsWith("/") &&
    !target.startsWith("//")
      ? target
      : "/";
  if (user) return <Navigate to={from} replace />;
  function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.email = body.email.trim().toLowerCase();
    if (register && !body.phone) delete body.phone;
    action.run(async () => {
      if (register && body.password !== body.password2)
        throw new Error("رمز عبور و تکرارش یکسان نیستند.");
      await authenticate(register ? "register" : "login", body);
      navigate(from, { replace: true });
    });
  }
  return (
    <section className="auth-page">
      <div className="auth-intro">
        <p className="eyebrow">به کارتورا خوش آمدی</p>
        <h1>{register ? "شروع یک همراهی تازه." : "خوشحالیم که برگشتی."}</h1>
        <p>
          انتخاب‌هایت را ذخیره کن، خریدت را کامل کن و سفارش‌هایت را دنبال کن.
        </p>
        <div className="auth-symbol" aria-hidden="true">
          ک.
        </div>
      </div>
      <div className="panel">
        <h2>{register ? "ساخت حساب کاربری" : "ورود به حساب"}</h2>
        <Feedback action={action} />
        <form onSubmit={submit} className="form-stack">
          <fieldset disabled={action.pending}>
            {register && (
              <div className="form-grid">
                <Field
                  label="نام"
                  name="first_name"
                  autoComplete="given-name"
                  maxLength={150}
                />
                <Field
                  label="نام خانوادگی"
                  name="last_name"
                  autoComplete="family-name"
                  maxLength={150}
                />
              </div>
            )}
            <Field
              label="ایمیل"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
            />
            {register && (
              <Field
                label="موبایل (اختیاری)"
                name="phone"
                type="tel"
                dir="ltr"
                autoComplete="tel"
                pattern="09[0-9]{9}"
                maxLength={11}
              />
            )}
            <Field
              label="رمز عبور"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 8 : undefined}
            />
            {register && (
              <>
                <Field
                  label="تکرار رمز عبور"
                  name="password2"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <p className="muted small">
                  رمز حداقل ۸ کاراکتر داشته باشد و خیلی رایج یا فقط عدد نباشد.
                </p>
              </>
            )}
            <button className="button full" disabled={action.pending}>
              {action.pending
                ? "در حال بررسی…"
                : register
                  ? "ساخت حساب"
                  : "ورود"}
            </button>
          </fieldset>
        </form>
        <p className="small">
          {register ? "حساب داری؟" : "هنوز حساب نساختی؟"}{" "}
          <Link
            className="inline-link"
            to={register ? "/login" : "/register"}
            state={{ from }}
          >
            {register ? "وارد شو" : "ثبت‌نام کن"}
          </Link>
        </p>
      </div>
    </section>
  );
}
