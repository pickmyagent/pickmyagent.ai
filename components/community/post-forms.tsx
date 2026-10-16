"use client";

import { useActionState } from "react";
import {
  createReply,
  createThread,
  hidePost,
  reportPost,
  type ActionState,
} from "@/lib/community/actions";
import { COMMUNITY_LIMITS } from "@/lib/community-rules";

function Status({ state }: { state: ActionState }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p role="status" className={state.error ? "text-sm text-amber" : "text-sm text-gold"}>
      {state.error ?? state.message}
    </p>
  );
}

export function ThreadForm({
  categories,
  defaultCategory,
}: {
  categories: { slug: string; title: string }[];
  defaultCategory?: string;
}) {
  const [state, action, pending] = useActionState(createThread, null);
  return (
    <form action={action} className="space-y-4 border border-line bg-panel p-4">
      <div>
        <label htmlFor="thread-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="thread-category"
          name="category"
          defaultValue={defaultCategory ?? categories[0]?.slug}
          className="mt-2 h-12 w-full border border-line bg-bg px-3"
        >
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="thread-title" className="text-sm font-medium">
          Topic
        </label>
        <input
          id="thread-title"
          name="title"
          required
          minLength={COMMUNITY_LIMITS.titleMin}
          maxLength={COMMUNITY_LIMITS.titleMax}
          className="mt-2 h-12 w-full border border-line bg-bg px-3"
        />
      </div>
      <div>
        <label htmlFor="thread-body" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="thread-body"
          name="body"
          required
          rows={8}
          maxLength={COMMUNITY_LIMITS.bodyMax}
          className="mt-2 w-full border border-line bg-bg px-3 py-3"
        />
      </div>
      <p className="text-sm text-muted">
        5 posts every 10 minutes. New accounts can include one link.
      </p>
      <Status state={state} />
      <button
        type="submit"
        disabled={pending}
        className="btn-gold h-11 px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post thread"}
      </button>
    </form>
  );
}

export function ReplyForm({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState(createReply, null);
  return (
    <form action={action} className="space-y-3 border border-line bg-panel p-4">
      <input type="hidden" name="threadId" value={threadId} />
      <label htmlFor="reply-body" className="text-sm font-medium">
        Reply
      </label>
      <textarea
        id="reply-body"
        name="body"
        required
        rows={5}
        maxLength={COMMUNITY_LIMITS.bodyMax}
        className="w-full border border-line bg-bg px-3 py-3"
      />
      <p className="text-sm text-muted">
        5 posts every 10 minutes. New accounts can include one link.
      </p>
      <Status state={state} />
      <button
        type="submit"
        disabled={pending}
        className="btn-gold h-11 px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post reply"}
      </button>
    </form>
  );
}

export function ReportButton({
  threadId,
  replyId,
}: {
  threadId?: string;
  replyId?: string;
}) {
  const [state, action, pending] = useActionState(reportPost, null);
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted hover:text-text">Report</summary>
      <form action={action} className="mt-3 space-y-3">
        {threadId ? <input type="hidden" name="threadId" value={threadId} /> : null}
        {replyId ? <input type="hidden" name="replyId" value={replyId} /> : null}
        <label htmlFor={`report-${replyId ?? threadId}`} className="sr-only">
          Report note
        </label>
        <textarea
          id={`report-${replyId ?? threadId}`}
          name="note"
          rows={3}
          maxLength={COMMUNITY_LIMITS.reportNoteMax}
          placeholder="What is wrong with this post?"
          className="w-full border border-line bg-bg px-3 py-2"
        />
        <Status state={state} />
        <button
          type="submit"
          disabled={pending}
          className="h-10 border border-line px-3 font-semibold hover:border-gold disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send report"}
        </button>
      </form>
    </details>
  );
}

export function HideButton({
  threadId,
  replyId,
}: {
  threadId?: string;
  replyId?: string;
}) {
  const [state, action, pending] = useActionState(hidePost, null);
  return (
    <form action={action} className="space-y-2">
      {threadId ? <input type="hidden" name="threadId" value={threadId} /> : null}
      {replyId ? <input type="hidden" name="replyId" value={replyId} /> : null}
      <Status state={state} />
      <button
        type="submit"
        disabled={pending}
        className="h-10 border border-amber/60 px-3 text-sm font-semibold text-amber disabled:opacity-60"
      >
        {pending ? "Hiding…" : "Hide post"}
      </button>
    </form>
  );
}
