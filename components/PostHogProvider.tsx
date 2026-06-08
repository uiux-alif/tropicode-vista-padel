"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ── Boot PostHog once ──────────────────────────────────────────────────────

function PostHogBoot() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
  const booted = useRef(false);

  useEffect(() => {
    if (!key || booted.current || typeof window === "undefined") return;
    booted.current = true;
    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // we handle this manually below
      capture_pageleave: true,
      persistence: "localStorage",
      autocapture: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.opt_out_capturing();
      },
    });
  }, [key, host]);

  return null;
}

// ── Page-view tracking for App Router ─────────────────────────────────────

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    const url =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

// ── Provider ──────────────────────────────────────────────────────────────

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  // If no key is set (e.g. local dev without a project), render children
  // without wrapping to avoid SDK noise.
  if (!key) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <PostHogBoot />
      {/* Suspense required because useSearchParams suspends in App Router */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
