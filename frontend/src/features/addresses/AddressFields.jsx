import React from "react";
import { Field } from "../../components/UI.jsx";

export const emptyAddress = {
  receiver_name: "",
  receiver_phone: "",
  province: "",
  city: "",
  postal_code: "",
  full_address: "",
};
export function addressBody(address) {
  return Object.fromEntries(
    Object.keys(emptyAddress).map((key) => [key, address[key]?.trim() || ""]),
  );
}
const latinDigits = (value) =>
  value
    .replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)));
export default function AddressFields({ value, onChange }) {
  const change = (key) => (event) =>
    onChange({
      ...value,
      [key]: ["receiver_phone", "postal_code"].includes(key)
        ? latinDigits(event.target.value)
        : event.target.value,
    });
  return (
    <>
      <div className="form-grid">
        <Field
          label="نام گیرنده"
          name="receiver_name"
          required
          maxLength={100}
          autoComplete="shipping name"
          value={value.receiver_name}
          onChange={change("receiver_name")}
        />
        <Field
          label="موبایل گیرنده"
          name="receiver_phone"
          required
          type="tel"
          dir="ltr"
          pattern="09[0-9]{9}"
          maxLength={11}
          placeholder="09123456789"
          autoComplete="shipping tel"
          value={value.receiver_phone}
          onChange={change("receiver_phone")}
        />
        <Field
          label="استان"
          name="province"
          required
          maxLength={50}
          autoComplete="shipping address-level1"
          value={value.province}
          onChange={change("province")}
        />
        <Field
          label="شهر"
          name="city"
          required
          maxLength={50}
          autoComplete="shipping address-level2"
          value={value.city}
          onChange={change("city")}
        />
        <Field
          label="کد پستی ۱۰ رقمی"
          name="postal_code"
          required
          dir="ltr"
          inputMode="numeric"
          pattern="[0-9]{10}"
          maxLength={10}
          autoComplete="shipping postal-code"
          value={value.postal_code}
          onChange={change("postal_code")}
        />
      </div>
      <Field label="نشانی کامل">
        <textarea
          name="full_address"
          required
          rows={3}
          autoComplete="shipping street-address"
          value={value.full_address}
          onChange={change("full_address")}
        />
      </Field>
    </>
  );
}
