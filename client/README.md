# Client (React + Vite + Tailwind)

Frontend for the Sikka Checkout · Clover Payments demo.

See the [root README](../README.md) for the full overview, setup, architecture, and Clover dashboard configuration.

## Scripts

```bash
npm run dev      # start the Vite dev server (http://localhost:5173, proxies /api -> :5001)
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # eslint
```

The dev server proxies `/api/*` to the backend at `http://localhost:5001` (see `vite.config.ts`), so run the backend (`cd ../server && npm run dev`) alongside it.
