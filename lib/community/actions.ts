"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  COMMUNITY_LIMITS,
  countLinks,
  isAdminEmail,
  isCommunityEnabled,
} from "@/lib/community-rules";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; message?: string } | null;

async function requestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  if (!host) return "https://www.pickmyagent.ai";
  return `${proto}://${host}`;
}

function friendlyPostError(message: string) {
  if (message.includes("Rate limit")) {
    return "You can post 5 times every 10 minutes. Try again shortly.";
  }
  if (message.includes("at most one link")) {
    return "New accounts can include at most one link.";
  }
  if (message.includes("title_length") || message.includes("body_length")) {
    return "Check the length of the title and the message.";
  }
  if (message.includes("row-level security") || message.includes("Sign in")) {
    return "Sign in to post.";
  }
  return "Could not post. Try again.";
}

async function memberProfile() {
  if (!isCommunityEnabled()) return { error: "The board is not connected." as const };
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to post." as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, created_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return { error: "Your profile is not ready yet. Sign out and sign in again." as const };
  }
  return { supabase, user, profile };
}

function linkError(text: string, accountCreatedAt: string) {
  const ageMs = Date.now() - new Date(accountCreatedAt).getTime();
  const isNew = ageMs >= 0 && ageMs < COMMUNITY_LIMITS.newAccountDays * 24 * 60 * 60 * 1000;
  if (isNew && countLinks(text) > COMMUNITY_LIMITS.newAccountLinks) {
    return "New accounts can include at most one link.";
  }
  return null;
}

async function beginProviderSignIn(provider: "google" | "discord") {
  if (!isCommunityEnabled()) redirect("/community");
  const supabase = await createSupabaseServerClient();
  const origin = await requestOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect("/community?auth=error");
  redirect(data.url);
}

export async function signInWithGoogle() {
  await beginProviderSignIn("google");
}

export async function signInWithDiscord() {
  await beginProviderSignIn("discord");
}

export async function signOut() {
  if (!isCommunityEnabled()) redirect("/community");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/community");
}

export async function createThread(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await memberProfile();
  if ("error" in session) return { error: session.error };

  const category = String(formData.get("category") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (
    title.length < COMMUNITY_LIMITS.titleMin ||
    title.length > COMMUNITY_LIMITS.titleMax
  ) {
    return { error: "Titles need 8 to 120 characters." };
  }
  if (body.length < 1 || body.length > COMMUNITY_LIMITS.bodyMax) {
    return { error: "Messages can be up to 4,000 characters." };
  }
  const bodyError = linkError(`${title}\n${body}`, session.profile.created_at);
  if (bodyError) return { error: bodyError };

  const { data: categoryRow } = await session.supabase
    .from("categories")
    .select("slug")
    .eq("slug", category)
    .maybeSingle();
  if (!categoryRow) return { error: "Pick a category." };

  const { data, error } = await session.supabase
    .from("threads")
    .insert({
      category_slug: category,
      author_id: session.profile.id,
      title,
      body,
    })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyPostError(error?.message ?? "") };
  redirect(`/community/t/${data.id}`);
}

export async function createReply(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await memberProfile();
  if ("error" in session) return { error: session.error };

  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1 || body.length > COMMUNITY_LIMITS.bodyMax) {
    return { error: "Messages can be up to 4,000 characters." };
  }
  const bodyError = linkError(body, session.profile.created_at);
  if (bodyError) return { error: bodyError };

  const { error } = await session.supabase.from("replies").insert({
    thread_id: threadId,
    author_id: session.profile.id,
    body,
  });
  if (error) return { error: friendlyPostError(error.message) };
  redirect(`/community/t/${threadId}`);
}

export async function reportPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await memberProfile();
  if ("error" in session) return { error: session.error };

  const threadId = String(formData.get("threadId") ?? "") || null;
  const replyId = String(formData.get("replyId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim();
  if (note.length > COMMUNITY_LIMITS.reportNoteMax) {
    return { error: "Keep the report note under 280 characters." };
  }
  if (!threadId && !replyId) return { error: "Nothing to report." };

  const { error } = await session.supabase.from("reports").insert({
    reporter_id: session.profile.id,
    thread_id: threadId,
    reply_id: replyId,
    note: note || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "You already reported this." };
    return { error: "Could not send the report." };
  }
  return { message: "Report sent." };
}

export async function hidePost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isCommunityEnabled()) return { error: "The board is not connected." };
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) return { error: "Only an admin can hide a post." };

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { error: "Hiding posts needs SUPABASE_SERVICE_ROLE_KEY on the server." };
  }

  const threadId = String(formData.get("threadId") ?? "");
  const replyId = String(formData.get("replyId") ?? "");
  if (replyId) {
    const { error } = await admin.from("replies").update({ hidden: true }).eq("id", replyId);
    if (error) return { error: "Could not hide that reply." };
    if (threadId) redirect(`/community/t/${threadId}`);
    redirect("/community");
  }
  if (!threadId) return { error: "Nothing to hide." };
  const { error } = await admin.from("threads").update({ hidden: true }).eq("id", threadId);
  if (error) return { error: "Could not hide that thread." };
  redirect("/community");
}
