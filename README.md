# reddit-mcp

**An MCP server that lets an AI agent operate Reddit accounts through the official OAuth API — multi-account, with an anti-spam / anti-manipulation safety layer as the core value, not an afterthought.**

We're an *assumed* bot (the API flags it — Reddit knows). The goal is never to impersonate a human; it's to never spam or manipulate. The safety layer *refuses* forbidden actions rather than warning about them.

## Design

- **Read is a homogeneous pass-through; actions are distinct native tools.** `reddit_call` covers all GET reads. Writing (submit, comment, vote, DM, subscribe, moderate) each gets its own tool — different risk profiles must never collapse into one free-form omnibus.
- **Safety layer = the value.** Enforced *before* any write:
  - **throttle** — anti-flood rate cap per account (not a human-imitation cadence; zero jitter).
  - **vote-guard** — *refuses* multiple accounts voting the same post/comment (anti-manipulation → network ban).
  - **shadowban** — logged-off check that the account's posts are publicly visible.
  - **warmup** — gates promotional actions by account age/karma; a brand-new account posting promo is a spammer profile.
- **Per-account everything.** Rate-limit state (Reddit's `X-Ratelimit-*` headers), OAuth refresh (concurrent-safe, lock + expiry buffer), and an optional per-account proxy for IP anti-correlation — all keyed per account, never shared.
- **Session-scoped active account.** Lives per MCP session, never a process-global — no leakage between concurrent HTTP agents. A switch commits only after identity is proven via `GET /api/v1/me`.
- **Minimal deps, no dead libraries.** Native `fetch`, no Reddit SDK (snoowrap is unmaintained). Just the MCP SDK + `zod`.

## Tools

| Tool | Purpose |
|------|---------|
| `reddit_call` | Raw GET read pass-through (full read coverage) |
| `reddit_discover` | Self-documenting read catalog |
| `reddit_submit` / `reddit_comment` / `reddit_vote` / `reddit_dm` / `reddit_subscribe` / `reddit_moderate` | Native write actions (each zod-validated, throttle + guards enforced) |
| `reddit_switch_account` | Switch active account (identity-proven) |
| `reddit_health` | Accounts + 401/403/429 window + shadowban status |

## Transports

- **stdio** — local use (`npm start`)
- **HTTP** — StreamableHTTP for a remote service (`npm run start:http`): binds `127.0.0.1`, constant-time Bearer auth (refuses to boot without it), DNS-rebind protection, one transport per session. Tailscale tunnel only.

## Status

The safety layer (throttle / vote-guard / warmup) is implemented and tested. The OAuth transport (authorization_code, `duration=permanent`) is gated on Reddit Data API access approval — a platform-side step, not a code one.

## Stack

Node ≥20, ESM. `@modelcontextprotocol/sdk` · `zod`.
**Testing:** Vitest (unit) + Stryker (mutation, ratcheted gate), wired into Husky pre-commit/pre-push. I/O is excluded from mutation; the safety layer's pure logic is fully mutated.

## Quick start

```bash
npm install
cp .secrets.example.json .secrets.json   # add app creds + account refresh tokens
npm start            # stdio
npm run start:http   # HTTP service
```

Secrets shape: `{ default, app: { client_id, client_secret }, accounts: { <name>: { refresh_token, proxy, warm } } }` — never committed (`.gitignore`).

## Compliance note

Reddit treats *any* use on behalf of a business as commercial (permission required); non-monetized personal use falls under the free OAuth tier. Beyond the API terms, the real line is communal — subreddits ban self-promotion. The unwritten 90/10 value-to-promo rule, karma + age before any promo: that's exactly what the safety layer encodes.

---
<sub>Part of a set of home-built MCP servers. Built to be driven by an agent, hardened for concurrency.</sub>
