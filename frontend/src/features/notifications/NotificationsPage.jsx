import React from "react";
import { useResource } from "../../hooks/useResource.js";
import { useAction } from "../../hooks/useAction.js";
import { post } from "../../api/client.js";
import { date, Feedback, PageHeading, Resource } from "../../components/UI.jsx";

export default function NotificationsPage() {
  const resource = useResource("notification/list/", true);
  const action = useAction();
  return (
    <section className="page">
      <PageHeading
        title="پیام‌های من"
        description="خبرهای مربوط به سفارش‌ها و حساب تو."
      >
        <button
          className="secondary-button"
          disabled={
            action.pending || !resource.data?.some((item) => !item.is_read)
          }
          onClick={() =>
            action.run(async () => {
              await post("notification/mark-read/");
              resource.reload();
            }, "همهٔ پیام‌ها خوانده شدند.")
          }
        >
          همه را خواندم
        </button>
      </PageHeading>
      <Feedback action={action} />
      <Resource
        resource={resource}
        empty={!resource.data?.length && "هنوز پیامی نداری."}
      >
        <div className="stack">
          {resource.data?.map((item) => (
            <article
              className={`panel notification ${item.is_read ? "" : "unread"}`}
              key={item.id}
            >
              <div className="section-heading">
                <h2>{item.title}</h2>
                {!item.is_read && <span className="status-pill">تازه</span>}
              </div>
              <p className="description">{item.message}</p>
              <p className="small muted">{date(item.created_at)}</p>
            </article>
          ))}
        </div>
      </Resource>
    </section>
  );
}
