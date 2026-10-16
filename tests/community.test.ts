import assert from "node:assert/strict";
import test from "node:test";
import {
  COMMUNITY_LIMITS,
  countLinks,
  isAdminEmail,
  isCommunityEnabled,
} from "../lib/community-rules.ts";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("community stays off until both public Supabase vars are set", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(isCommunityEnabled(), false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    assert.equal(isCommunityEnabled(), false);
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    assert.equal(isCommunityEnabled(), true);
  } finally {
    restoreEnv("NEXT_PUBLIC_SUPABASE_URL", previousUrl);
    restoreEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", previousKey);
  }
});

test("admin emails are matched case-insensitively", () => {
  const previous = process.env.ADMIN_EMAILS;
  try {
    process.env.ADMIN_EMAILS = " David@pickmyagent.ai, other@example.com ";
    assert.equal(isAdminEmail("david@pickmyagent.ai"), true);
    assert.equal(isAdminEmail("stranger@example.com"), false);
    assert.equal(isAdminEmail(null), false);
  } finally {
    restoreEnv("ADMIN_EMAILS", previous);
  }
});

test("new-account link counting matches the database rule", () => {
  assert.equal(countLinks("no links here"), 0);
  assert.equal(countLinks("See https://example.com once"), 1);
  assert.equal(countLinks("https://a.test and HTTPS://b.test"), 2);
  assert.equal(COMMUNITY_LIMITS.newAccountLinks, 1);
  assert.equal(COMMUNITY_LIMITS.postsPerWindow, 5);
  assert.equal(COMMUNITY_LIMITS.windowMinutes, 10);
  assert.equal(COMMUNITY_LIMITS.bodyMax, 4000);
  assert.equal(COMMUNITY_LIMITS.titleMax, 120);
});
