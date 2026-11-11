import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useResource } from "../../hooks/useResource.js";
import { useAction } from "../../hooks/useAction.js";
import { post, patch, remove } from "../../api/client.js";
import {
  ConfirmDelete,
  date,
  Feedback,
  Field,
  number,
  Resource,
} from "../../components/UI.jsx";

export default function Reviews({ productId }) {
  const { user } = useAuth();
  const resource = useResource(`reviews/reviews/?product=${productId}`, true);
  const action = useAction();
  const [editing, setEditing] = useState(null);
  const own = resource.data?.find((item) => user?.id && item.user === user.id);
  function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    body.product = productId;
    body.rating = Number(body.rating);
    action.run(async () => {
      if (editing) await patch(`reviews/reviews/${editing.id}/`, body);
      else await post("reviews/reviews/", body);
      form.reset();
      setEditing(null);
      resource.reload();
    }, "نظر ذخیره شد و پس از تأیید مدیریت عمومی می‌شود.");
  }
  return (
    <section className="reviews-section">
      <h2>دیدگاه خریداران</h2>
      <Feedback action={action} />
      <Resource
        resource={resource}
        empty={!resource.data?.length && "هنوز دیدگاهی ثبت نشده است."}
      >
        <div className="review-list">
          {resource.data?.map((review) => (
            <article className="panel" key={review.id}>
              <div className="section-heading">
                <strong>{review.user_name}</strong>
                <span>★ {number(review.rating)} از ۵</span>
              </div>
              <h3>{review.title}</h3>
              <p className="description">{review.comment}</p>
              <p className="muted small">
                {date(review.created_at)}{" "}
                {!review.is_approved && " · در انتظار تأیید"}
              </p>
              {user?.id === review.user && (
                <div className="actions">
                  <button
                    className="text-button"
                    disabled={action.pending}
                    onClick={() => setEditing(review)}
                  >
                    ویرایش
                  </button>
                  <ConfirmDelete
                    pending={action.pending}
                    onConfirm={() =>
                      action.run(async () => {
                        await remove(`reviews/reviews/${review.id}/`);
                        setEditing(null);
                        resource.reload();
                      }, "نظر حذف شد.")
                    }
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </Resource>
      {user ? (
        (!own || editing) && (
          <form
            key={editing?.id || "new"}
            onSubmit={submit}
            className="panel review-form"
          >
            <h3>{editing ? "ویرایش دیدگاه" : "دیدگاه تو"}</h3>
            <fieldset
              disabled={action.pending || resource.status !== "success"}
            >
              <div className="form-grid">
                <Field
                  label="عنوان"
                  name="title"
                  maxLength={255}
                  defaultValue={editing?.title || ""}
                />
                <Field label="امتیاز">
                  <select name="rating" defaultValue={editing?.rating || 5}>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {number(value)} از ۵
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="توضیحات">
                <textarea
                  name="comment"
                  rows={4}
                  required
                  defaultValue={editing?.comment || ""}
                />
              </Field>
              <div className="actions">
                <button className="button">ثبت دیدگاه</button>
                {editing && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setEditing(null)}
                  >
                    انصراف
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        )
      ) : (
        <p>
          <Link
            className="inline-link"
            to="/login"
            state={{ from: `/products/${productId}` }}
          >
            برای ثبت نظر وارد حساب شو.
          </Link>
        </p>
      )}
    </section>
  );
}
