# DuoSigna Analytics & Privacy Architecture (GTM + GA4 + Consent Mode v2)

DuoSigna includes a **\$0-tier, privacy-first analytics and tagging layer** built on **Client-Side Google Tag Manager (Web Container)**, **Google Analytics 4 (Standard Free Tier)**, and **Google Consent Mode v2**.

## 1. Cost & Infrastructure Guardrails

* **\$0 Free Tier Only:** Client-side GTM Web Container + GA4 Standard + BigQuery Sandbox (optional daily export).
* **No Server-Side GTM (sGTM):** No Cloud Run tagging proxy or paid third-party CMP is provisioned.
* **No Impact on Existing Free Tiers:** Backend Cloud Run (`min-instances=0`), Neon PostgreSQL, and Vercel Hobby settings remain untouched.
* **Non-Blocking & Ad-Blocker Resilient:** `gtm.js` loads asynchronously (`async`, `fetchpriority="low"`) in `frontend/app/plugins/gtm.client.ts`, never delays Vue hydration, MediaPipe frame processing, or Web Speech TTS playback, and fails silently when blocked.

---

## 2. Consent Mode v2 Flow & Storage

Consent is managed without external CMP scripts via `frontend/app/composables/useConsent.ts` and `frontend/app/components/ConsentBanner.vue`.

1. **Pre-GTM Synchronous Defaults (`frontend/app/plugins/gtm.client.ts`):**
   Before `gtm.js` is injected, `window.dataLayer` and `window.gtag()` are initialized synchronously on the client with privacy-protective defaults:
   * `analytics_storage: 'denied'`
   * `ad_storage: 'denied'`
   * `ad_user_data: 'denied'`
   * `ad_personalization: 'denied'`
   * `wait_for_update: 500`
   * `gtag('set', 'ads_data_redaction', true)`
2. **Stored Preference Rehydration (`localStorage`):**
   If `localStorage` contains a valid `duosigna-consent-v1` record (`{ version: 1, analytics_storage: 'granted' | 'denied', updated_at }`), `initStoredConsent()` triggers `gtag('consent', 'update', ...)` and pushes `consent_updated` (`consent_source: 'stored'`) before GTM loads.
3. **First-Visit Banner & Native `<dialog>` Preferences:**
   If no preference is stored, `ConsentBanner.vue` shows a non-blocking floating banner with equal-prominence **Accept Analytics** and **Reject Non-Essential** buttons plus **Manage Preferences**. Users can update their choice anytime from the footer trigger or `/settings`. Advertising consent signals (`ad_storage`, `ad_user_data`, `ad_personalization`) remain `'denied'`.

---

## 3. Strict PII Protection Policy

Every event flows through `sanitizePayload()` inside `frontend/app/composables/useAnalytics.ts`, which enforces:

* **Per-event parameter allowlists:** Unexpected keys are dropped.
* **Blocked PII key check:** Keys such as `email`, `nome`, `name`, `username`, `password`, `token`, `jwt`, `prompt`, `question`, `answer`, `content`, `frames`, `landmarks`, `user_id`, `avatar_url`, and `chat_id` are stripped.
* **Pattern redaction:** Email addresses, Bearer tokens, and JWT strings are automatically redacted.
* **Query/Hash stripping:** `virtual_page_view` strips query strings and URL fragments from `page_path`.

---

## 4. `dataLayer` Event Schema

| Event Name | Source File | Parameters & Types | Notes |
| --- | --- | --- | --- |
| `virtual_page_view` | `app/plugins/gtm.client.ts` | `page_path` (string), `page_title` (string) | Fires once on `router.isReady()` and on `router.afterEach` path changes; mapped in GTM to GA4 `page_view` (`send_page_view: false` on base tag). |
| `consent_updated` | `app/composables/useConsent.ts` | `consent_analytics` (`'granted' \| 'denied'`), `consent_source` (`'banner' \| 'preferences' \| 'settings' \| 'stored'`) | Pushed to `dataLayer` on rehydration and preference changes. |
| `auth_completed` | `app/pages/index.vue` | `action` (`'login' \| 'register'`) | Fires only after `signIn` completes with a valid session token. |
| `onboarding_tour_action` | `app/composables/useOnboarding.js` | `status` (`'completed' \| 'skipped'`), `step_reached` (number 1–6) | Distinguishes completing step 6 (`Done`) from closing early (`×`). |
| `tutor_interaction` | `app/pages/chatbot.vue` | `input_mode` (`'text' \| 'voice'`), `tts_active` (boolean), `intent_purpose` (`'translation' \| 'general' \| 'error'`), `sign_level` (`'level_0' \| 'level_1' \| 'level_2' \| 'none'`) | Emitted once per tutor message exchange; raw prompt/reply text is never logged. |
| `camera_practice_result` | `app/pages/chatbot.vue`, `app/pages/quiz.vue` | `context` (`'tutor' \| 'quiz'`), `target_type` (`'letter' \| 'word'`), `passed` (boolean), `confidence_pct` (0–100), `latency_ms` (number) | Measures inference `$fetch` round-trip latency only (excludes webcam buffering). |
| `dictionary_sign_viewed` | `app/pages/dictionary.vue` | `category` (string), `sign_name` (string), `is_unlocked` (boolean) | Fires when opening a sign modal on `/dictionary`. |
| `dictionary_sign_unlocked` | `app/pages/chatbot.vue` | `category` (string), `sign_name` (string) | Fires when a practice sign passes `>= 65%` and was not yet unlocked in the session cache. |
| `quiz_started` | `app/pages/quiz.vue` | `categories_count` (number), `is_mixed` (boolean), `question_count` (number) | Fires after `/api/quiz/start` returns valid quiz questions. |
| `quiz_completed` | `app/pages/quiz.vue` | `categories_count` (number), `score_percent` (0–100), `hints_used` (number), `question_count` (number) | Fires when transitioning to the quiz result screen; `hints_used` counts distinct questions where the video hint was opened. |

---

## 5. Environment Variable Setup (Local & Vercel)

| Variable | Required? | Purpose |
| --- | --- | --- |
| `NUXT_PUBLIC_GTM_ID` | Optional in local dev; required in prod | Web GTM container ID (`GTM-XXXXXXX`). If empty or invalid, GTM `<script>` injection safely no-ops while `dataLayer` continues working locally. |
| `NUXT_PUBLIC_ANALYTICS_DEBUG` | Optional (`false` default) | Set to `'true'` locally to print `[DuoSigna Analytics]` and `[DuoSigna Consent]` payloads in browser DevTools. |

### Vercel Configuration

1. Open **Vercel Dashboard → DuoSigna Frontend Project → Settings → Environment Variables**.
2. Add `NUXT_PUBLIC_GTM_ID` with your Web GTM ID (`GTM-XXXXXXX`) scoped to **Production** (and optionally **Preview**).
3. Keep `NUXT_PUBLIC_ANALYTICS_DEBUG` unset or `false` in Production.
4. Trigger a **Redeploy** so `runtimeConfig.public.gtmId` is active.

> **CSP Note:** DuoSigna currently deploys without restrictive Content-Security-Policy headers. If you later add a CSP on Vercel (`vercel.json`) or middleware, allow `https://www.googletagmanager.com` in `script-src` and `img-src`, and `https://*.google-analytics.com` / `https://*.analytics.google.com` in `connect-src` and `img-src`.

---

## 6. Quick Verification

1. **Consent Banner & Local Dry-Run:** Run `NUXT_PUBLIC_ANALYTICS_DEBUG=true npm run dev` inside `frontend/` with `NUXT_PUBLIC_GTM_ID` empty, open DevTools Console, and verify `consent_updated` + `virtual_page_view` logs with zero GTM network errors.
2. **Tag Assistant & GA4 DebugView:** With `NUXT_PUBLIC_GTM_ID=GTM-XXXXXXX`, connect `https://tagassistant.google.com/` to your deployment or localhost, toggle **Reject** (`gcs=G100`) vs **Accept** (`gcs=G110`) in Network `collect?v=2` requests, and confirm events appear live in **GA4 → Admin → DebugView**.
