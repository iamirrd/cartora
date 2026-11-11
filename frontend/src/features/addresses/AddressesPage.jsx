import React, { useState } from "react";
import { useResource } from "../../hooks/useResource.js";
import { useAction } from "../../hooks/useAction.js";
import { post, patch, remove } from "../../api/client.js";
import {
  ConfirmDelete,
  Feedback,
  Field,
  PageHeading,
  Resource,
} from "../../components/UI.jsx";
import AddressFields, { addressBody, emptyAddress } from "./AddressFields.jsx";

export default function AddressesPage() {
  const addresses = useResource("address/addresses/", true);
  const action = useAction();
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState({
    ...emptyAddress,
    title: "",
    is_default: false,
  });
  function reset() {
    setEditing(null);
    setValue({ ...emptyAddress, title: "", is_default: false });
  }
  function submit(event) {
    event.preventDefault();
    const body = {
      ...addressBody(value),
      title: value.title.trim(),
      is_default: value.is_default,
    };
    action.run(async () => {
      if (editing) await patch(`address/addresses/${editing}/`, body);
      else await post("address/addresses/", body);
      reset();
      addresses.reload();
    }, "نشانی ذخیره شد.");
  }
  return (
    <section className="page">
      <PageHeading
        title="نشانی‌های من"
        description="نشانی‌ها را ذخیره کن تا هنگام خرید سریع‌تر پیش بروی."
      />
      <Feedback action={action} />
      <div className="two-column">
        <div>
          <Resource
            resource={addresses}
            empty={!addresses.data?.length && "هنوز نشانی ذخیره نکرده‌ای."}
          >
            <div className="stack">
              {addresses.data?.map((address) => (
                <article className="panel" key={address.id}>
                  <div className="section-heading">
                    <h2>{address.title}</h2>
                    {address.is_default && (
                      <span className="status-pill">پیش‌فرض</span>
                    )}
                  </div>
                  <p>
                    {address.receiver_name} ·{" "}
                    <bdi>{address.receiver_phone}</bdi>
                  </p>
                  <p>
                    {address.province}، {address.city}، {address.full_address}
                  </p>
                  <p className="muted small">
                    کد پستی: <bdi>{address.postal_code}</bdi>
                  </p>
                  <div className="actions">
                    <button
                      className="text-button"
                      disabled={action.pending}
                      onClick={() => {
                        setEditing(address.id);
                        setValue(address);
                        document
                          .getElementById("address-form")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                    >
                      ویرایش
                    </button>
                    {!address.is_default && (
                      <button
                        className="text-button"
                        disabled={action.pending}
                        onClick={() =>
                          action.run(async () => {
                            await patch(`address/addresses/${address.id}/`, {
                              is_default: true,
                            });
                            addresses.reload();
                          }, "نشانی پیش‌فرض تغییر کرد.")
                        }
                      >
                        انتخاب پیش‌فرض
                      </button>
                    )}
                    <ConfirmDelete
                      pending={action.pending}
                      onConfirm={() =>
                        action.run(async () => {
                          await remove(`address/addresses/${address.id}/`);
                          if (editing === address.id) reset();
                          addresses.reload();
                        }, "نشانی حذف شد.")
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          </Resource>
        </div>
        <form id="address-form" className="panel" onSubmit={submit}>
          <h2>{editing ? "ویرایش نشانی" : "نشانی تازه"}</h2>
          <fieldset disabled={action.pending}>
            <Field
              label="عنوان نشانی"
              name="title"
              placeholder="مثلاً خانه یا محل کار"
              required
              maxLength={50}
              value={value.title}
              onChange={(event) =>
                setValue({ ...value, title: event.target.value })
              }
            />
            <AddressFields value={value} onChange={setValue} />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={value.is_default}
                onChange={(event) =>
                  setValue({ ...value, is_default: event.target.checked })
                }
              />
              نشانی پیش‌فرض من باشد
            </label>
            <div className="actions">
              <button className="button">
                {action.pending ? "در حال ذخیره…" : "ذخیرهٔ نشانی"}
              </button>
              {editing && (
                <button type="button" className="text-button" onClick={reset}>
                  انصراف
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
