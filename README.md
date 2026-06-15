# Sikka Checkout · Clover Payments Demo

A small full-stack demo that runs the full Clover custom-order payment flow end to end:

> **Authenticate → Create order → Add line item → Initiate payment → Fetch/display payment status → Log the transaction locally.**

It supports two authentication modes against the Clover **sandbox**:

- **Test-token mode** — a sandbox merchant ID + API token from `.env` for a fast local loop.
- **OAuth mode** — a real Clover OAuth 2.0 connect flow (authorize → code exchange → stored tokens with single-use refresh). When a merchant is connected via OAuth, those credentials take precedence automatically.

Card data never touches the backend: cards are tokenized client-side via Clover's hosted iframe into a `clv_` **source token**, and only that token is sent to the server.

---

## Requirements coverage

| Requirement | Where it's implemented |
|---|---|
| Authenticate with Clover | `utils/cloverAuth.ts` (OAuth token or test token) · OAuth flow in `handlers/cloverOauth.ts` |
| Create an order | `handlers/cloverOrders.ts` → `createCloverOrder()` |
| Add a line item | `handlers/cloverOrders.ts` → `addLineItem()` (amounts in cents) |
| Initiate a payment | `handlers/cloverPayments.ts` → `payForOrder()` (ecommerce API) |
| Fetch & display payment status | `getOrderPayments()` + `ResultPanel`/`StatusPill` in the UI |
| Log the transaction locally | `utils/transactionLog.ts` → `server/logs/transactions.json` |
| Orchestration of the whole flow | `handlers/checkout.ts` → `runCheckout()` (`POST /api/checkout`) |
| OAuth 2.0 connect (production-style) | `/api/clover/oauth/connect`, single-use refresh, token store |
| Keep card data off the backend (PCI) | Clover hosted iframe → `clv_` source token (`components/CardFields.tsx`) |

---

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Node.js, Express 5, TypeScript, Axios, dotenv |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Persistence | Local JSON files (transaction log + OAuth token store) |

---

## Project structure

```
sikkaDemo/
├── server/                     # Express + TypeScript backend
│   ├── index.ts                # App entry: middleware, routes, central error handler
│   ├── routes/
│   │   ├── clover.ts           # OAuth connect, connection status, orders, line items, pay, status
│   │   └── checkout.ts         # POST /api/checkout (the orchestrated flow)
│   ├── handlers/
│   │   ├── checkout.ts         # runCheckout(): create order → line item → pay → status → log
│   │   ├── cloverOrders.ts     # createCloverOrder, addLineItem, getOrderPayments
│   │   ├── cloverPayments.ts   # payForOrder() against the ecommerce host
│   │   ├── cloverTokens.ts     # mintDemoSource() — tokenizes a sandbox test card
│   │   └── cloverOauth.ts      # authorize URL, code exchange, single-use refresh
│   ├── utils/
│   │   ├── cloverConfig.ts     # Base URLs + credentials (sandbox/production aware)
│   │   ├── cloverAuth.ts       # Resolves merchant/ecommerce credentials (OAuth > test token)
│   │   ├── cloverHttp.ts       # Axios wrapper + normalized CloverApiError
│   │   ├── oauthStore.ts       # Local JSON store for merchant OAuth tokens
│   │   ├── transactionLog.ts   # Append/read local transaction log
│   │   └── money.ts            # dollars <-> cents helpers
│   ├── models/transaction.ts   # Transaction types (amounts in cents, no card data)
│   └── logs/                   # gitignored: transactions.json, oauth-credentials.json
│
└── client/                     # React + Vite frontend
    └── src/
        ├── App.tsx             # Layout, checkout state, connection status
        ├── api.ts              # Typed backend client
        ├── clover.ts           # Hosted-iframe SDK loading + types
        ├── hooks/useClover.ts  # Lazy-loads the Clover SDK only when card entry is used
        └── components/         # CheckoutCard, CardFields, ConnectionStatus, etc.
```

---

## Prerequisites

- Node.js 18+ and npm
- A Clover **sandbox** developer account ([Global Developer Dashboard](https://www.clover.com/global-developer-home))

---

## Setup

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure the backend environment

Copy the template and fill in values:

```bash
cd server
cp .env.example .env
```

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no (default `5001`) | Backend port |
| `CLOVER_ENV` | no (default `sandbox`) | `sandbox` or `production` |
| `CLOVER_MERCHANT_ID` | test-token mode | Sandbox test merchant ID |
| `CLOVER_TEST_ACCESS_TOKEN` | test-token mode | Sandbox dashboard API token |
| `CLOVER_ECOMMERCE_PRIVATE_KEY` | yes (for charges) | Ecommerce API **private** key (Bearer for pay/charges) |
| `CLOVER_ECOMMERCE_PUBLIC_KEY` | for card entry | Ecommerce API **public** key (`apikey` header for tokenization) |
| `CLOVER_TEST_SOURCE` | no | Optional static `clv_` source token (usually ephemeral) |
| `CLOVER_CLIENT_ID` | OAuth mode | Clover app ID |
| `CLOVER_CLIENT_SECRET` | OAuth mode | Clover app secret |
| `CLOVER_REDIRECT_URI` | OAuth mode | `http://localhost:5001/api/clover/oauth/connect` |
| `FRONTEND_URL` | no (default `http://localhost:5173`) | Where to return after OAuth connect |
| `CLOVER_*_BASE_URL` | no | Per-host base URL overrides (defaults derive from `CLOVER_ENV`) |

> `server/.env` and `server/logs/` are gitignored — secrets and tokens are never committed.

### 3. Run both apps

```bash
# terminal 1
cd server && npm run dev      # http://localhost:5001

# terminal 2
cd client && npm run dev      # http://localhost:5173 (proxies /api -> :5001)
```

Open http://localhost:5173.

---

## Clover dashboard setup (OAuth)

These steps are what make the OAuth flow actually mint a **permissioned** token. They are easy to get wrong — see [Troubleshooting](#troubleshooting).

1. In the **Global Developer Dashboard**, create a **new app**.
2. **App Type → REST Clients = Web.** Answer **No** to "Is this an integration of an existing point of sale?" (a *semi-integrated* app has a RAID and will **not** grant REST permissions to OAuth tokens).
3. **Requested Permissions** — enable **before** installing anywhere:
   - Orders — Read & Write
   - Inventory — Read
   - Merchant — Read & Write
   - (add justifications if prompted)
4. **REST Configuration:**
   - Site URL: `http://localhost:5001`
   - Alternate Launch Path: `/api/clover/oauth/connect`
   - CORS Domain: `http://localhost:5173`
   - **Default OAuth Response: Code**
5. Copy the **App ID** / **App Secret** into `server/.env` (`CLOVER_CLIENT_ID` / `CLOVER_CLIENT_SECRET`) and restart the backend.
6. Install the app on your test merchant: **Test Merchants → Launch Dashboard → More Tools (App Market) → your app → Connect/Install.**
7. Clover redirects to `/api/clover/oauth/connect?merchant_id=...&code=...`; the backend exchanges the code, stores the tokens, and the UI shows **"Clover connected."**

> The OAuth flow on the global platform is **merchant-initiated** (install from the App Market). Cold-starting it from the app's "Connect" button can hit the federated SSO login and fail; installing from the merchant dashboard reuses your authenticated session.

---

## How it works

### The checkout flow (`server/handlers/checkout.ts`)

`POST /api/checkout` runs the whole sequence and logs the result either way:

```
validate input
  → create order            (platform REST API, merchant token)
  → add custom line item    (platform REST API, merchant token)
  → resolve payment source  (iframe token > CLOVER_TEST_SOURCE > minted demo token)
  → pay for order           (ecommerce API, ecommerce private key)
  → fetch payment status    (platform REST API)
  → log transaction locally (server/logs/transactions.json)
```

### Two Clover hosts, two credentials

Clover does not serve everything from one base URL or one credential:

- **Platform REST API** (`apisandbox.dev.clover.com`) — orders, line items, order payments. Authenticated with the **merchant access token** (OAuth token when connected, else the sandbox dashboard token).
- **Ecommerce API** (`scl-sandbox.dev.clover.com`) — pay/charges. Authenticated with the dedicated **Ecommerce private key** (it rejects the platform token).

`getMerchantCredentials()` and `getEcommerceToken()` in `utils/cloverAuth.ts` encapsulate this so the rest of the code is auth-mode agnostic.

### Auth precedence

- `getMerchantCredentials()` → **OAuth token (if connected)** → else test-token from `.env`.
- `getEcommerceToken()` → **Ecommerce private key** → else OAuth token.

### OAuth token lifecycle (`handlers/cloverOauth.ts` + `utils/oauthStore.ts`)

- **Authorize:** `{oauthBaseUrl}/oauth/v2/authorize?client_id=...&redirect_uri=...&response_type=code`
- **Exchange:** `POST {platformBaseUrl}/oauth/v2/token` with `{ client_id, client_secret, code }`
- **Refresh:** `POST {platformBaseUrl}/oauth/v2/refresh` with `{ client_id, refresh_token }`. **Refresh tokens are single-use** — the new pair is persisted immediately. Tokens are refreshed automatically ~60s before expiry.
- Tokens are stored in `server/logs/oauth-credentials.json` (gitignored). **Disconnect** clears the local copy (it does not revoke the grant on Clover's side).

### PCI / card handling

Raw card details are entered only in **Clover's hosted iframe** and tokenized client-side into a `clv_` source token. The backend receives the token, never the PAN. The frontend lazily loads Clover's `sdk.js` only when "Card entry" mode is selected.

---

## Card vs. token: the two payment-source modes

Clover never charges a raw card directly. The model is always:

```
card details → Clover tokenizer → source token (clv_…) → backend charges the source token
```

The only question is **where the card → token step happens**. The UI exposes both via a toggle on the checkout card (`client/src/components/CheckoutCard.tsx`):

### 1. Demo token (server-side)

For a fast demo loop with no card typing. The server mints a fresh source token at pay-time from a known **Clover sandbox test card** (`server/handlers/cloverTokens.ts`):

- `mintDemoSource()` → `POST {tokenizerBaseUrl}/v1/tokens` with the card in the body and the **Ecommerce public key** in the `apikey` header (not a Bearer token).
- Source tokens are ephemeral, so we mint one per payment rather than hardcoding it.

The "Pay with Clover" button submits immediately; the backend resolves the source itself.

### 2. Card entry (Clover hosted iframe)

The production-style path where a real card is entered — but **never on our origin**. This is the iframe enhancement:

- Each card field (`number`, `expiry`, `cvv`, `postal`) is a **Clover-owned iframe**, so the PAN lives entirely inside Clover's domain. Our React app and server never see it (`client/src/components/CardFields.tsx`).
- On submit, `clover.createToken()` tokenizes the entered card client-side and returns a `clv_` token, which is sent to the backend as `sourceToken`.

### How the backend picks a source

`runCheckout()` (and the `/pay` route) resolve the source in this order:

```
explicit sourceToken (from the iframe)  >  CLOVER_TEST_SOURCE (static override)  >  mintDemoSource() (server-minted test card)
```

So Card-entry payments use the iframe token, and Demo-token payments fall through to a freshly minted test-card token.

### Frontend engineering notes (iframe)

Integrating Clover's hosted SDK cleanly took a few deliberate choices:

- **Lazy SDK loading** (`client/src/hooks/useClover.ts`): `sdk.js` is fetched only when "Card entry" is first selected (`ensureLoaded()`), not on page load. Clover's script injects a branding footer + reCAPTCHA into `<body>`, so deferring it keeps the default Demo-token view clean.
- **Scoped injected UI**: while in card mode the app sets a `card-mode` class on `<body>`; CSS hides Clover's injected `<body>` elements when that class is absent, so the footer doesn't linger after switching back.
- **Mount by CSS selector into fixed-id containers**: Clover mounts elements via `el.mount('#cc-number')` (a selector string), not a DOM ref — required by the SDK and the fix for the iframe initially taking over the page.
- **iframe sizing**: iframes default to ~150px tall, so the field height is constrained with Tailwind (`[&_iframe]:!h-[26px]`).
- **React StrictMode safety**: dev double-invokes effects, which mounted Clover elements twice into the same node (duplicate fields). Each container is cleared with `replaceChildren()` before mounting, and elements are `unmount()`-ed on cleanup.
- **Per-field validation**: each element's `change` event surfaces inline field errors; tokenization errors from `createToken()` are mapped to a readable message via `describeTokenErrors()`.

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/checkout` | Run the full flow. Body: `{ amount, description, sourceToken? }` (amount in dollars) |
| `GET` | `/api/transactions` | All locally-logged transactions |
| `GET` | `/api/clover/public-config` | Browser-safe config for the hosted iframe (public key, merchant ID, SDK URL) |
| `GET` | `/api/clover/oauth/connect` | OAuth entry/callback (no `code` → redirect to Clover; `code` → exchange + store) |
| `GET` | `/api/clover/connection` | Current auth mode: `oauth` \| `test` \| `none` |
| `DELETE` | `/api/clover/connection` | Forget stored OAuth tokens (local only) |
| `POST` | `/api/clover/orders` | Create an order |
| `POST` | `/api/clover/orders/:orderId/line-items` | Add a custom line item. Body: `{ amount, description? }` |
| `POST` | `/api/clover/orders/:orderId/pay` | Pay for an order. Body: `{ amount, sourceToken? }` |
| `GET` | `/api/clover/orders/:orderId/payments` | Payment status for an order |

All amounts in request bodies are in **dollars**; the backend converts to cents for Clover.

---

## Troubleshooting

**`401 Unauthorized` on `POST /v3/merchants/{id}/orders` right after connecting via OAuth.**
The OAuth token has `permission_bitmap: 0` (no scopes). Clover returns 401 for both invalid tokens and insufficient permissions. Causes, in order of likelihood:

1. **App type is "Semi-Integrated" (has a RAID).** Semi-integrated apps do not grant REST permissions to OAuth tokens. Recreate the app as a **Web app** (REST Clients = Web, POS-integration = No).
2. **Permissions set after install.** Permission changes only apply to a **fresh install** — uninstall and reinstall on the test merchant. Best practice: set permissions *before* the first install.
3. **Stale install record.** If repeated reinstalls keep producing `permission_bitmap: 0` with the same `merchant_app_uuid`, the install is stuck — create a brand-new Web app so a new install record is generated.

You can inspect the stored token's claims (the access token is a JWT):

```bash
node -e 'const t=require("./logs/oauth-credentials.json"); const c=Object.values(t)[0]; console.log(JSON.parse(Buffer.from(c.accessToken.split(".")[1],"base64").toString()))'
```

A healthy token has `app_uuid` matching `CLOVER_CLIENT_ID` and a **non-zero** `permission_bitmap`.

**"Connect Clover" button leads to a login that says "incorrect password."**
The cold authorize path hits Clover/Fiserv federated SSO. Use the **merchant-initiated** install instead (Test Merchants → Launch Dashboard → App Market → Connect).

**`.env` changes don't take effect.**
`tsx watch` reloads on `.ts` changes but the process must restart to re-read `.env`. Restart the backend after editing `.env`.

**`400 "Please provide a valid source for the charge."`**
Static `clv_` source tokens are ephemeral. Leave `CLOVER_TEST_SOURCE` blank so the server mints a fresh token from a sandbox test card at pay-time, or use the hosted iframe.

---

## Notes for production

This is a sandbox demo. For production you would, at minimum:

- Store OAuth tokens encrypted in a real datastore / secrets manager (not a JSON file), keyed per merchant, with access controls.
- Add CSRF/`state` protection to the OAuth flow and validate the `state` parameter.
- Use a durable datastore for the transaction log and add idempotency keys.
- Add request authentication/authorization for the backend's own API.
- Validate the OAuth token's freshness against Clover rather than trusting local "connected" state.
