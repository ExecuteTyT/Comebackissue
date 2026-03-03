# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Russian-language legal services landing site (вернистраховку.рф) for insurance refund claims. Static HTML pages served by an Express.js backend with form handling, email/Telegram notifications, and security middleware. Deployed to both **Vercel** (serverless) and a **VPS with PM2/nginx**.

## Commands

```bash
npm run dev              # Start dev server with nodemon (port 3000)
npm start                # Start production server
npm test                 # Run form submission API tests (server must be running)
npm run build:css        # Build Tailwind CSS (minified)
npm run watch:css        # Watch & rebuild Tailwind CSS
npm run test:forms       # Alias for npm test
```

Test with custom URL: `node scripts/test-forms-api.js https://your-domain.com`

## Architecture

### Dual Deployment
- **VPS**: `backend/server.js` runs directly with PM2 (`ecosystem.config.js`), nginx as reverse proxy
- **Vercel**: `api/index.js` is a thin adapter that re-exports the Express app as a serverless function. All routes are rewritten to it via `vercel.json`

### Backend (`backend/server.js`)
Single-file Express server (~1100 lines) containing:
- Security middleware stack: helmet, CORS (allowlist from `ALLOWED_ORIGINS` env), CSRF (double-submit cookie via `csrf-csrf`), rate limiting, DOMPurify sanitization
- Static file serving from project root
- Route handlers for all pages (each page directory has its own `index.html`)
- `POST /api/submit-form` — main form endpoint with validation (express-validator), sends email via Nodemailer and Telegram via Bot API
- `GET /api/csrf-token` — CSRF token endpoint
- `GET /api/config` — returns Yandex Metrika / GA IDs
- `GET /api/health` — health check
- Winston logging (console-only in serverless/Vercel, file-based locally in `logs/`)
- NODE_ENV priority: PM2 ecosystem.config.js > .env file

### Frontend
- Plain HTML pages with Tailwind CSS (v3), no bundler/framework
- `src/js/main.js` — modals, form submission with CSRF, phone masks (IMask), exit-intent popup, AOS animations, Yandex Metrika goals
- `src/js/calculator.js` — `ReturnCalculator` class with fixed 2.45x multiplier, 60/40 client/company split
- `src/css/style.css` — custom styles; `src/css/tailwind-input.css` → `tailwind-output.css` via Tailwind CLI
- Libraries loaded via CDN: Swiper.js, AOS, IMask.js, Font Awesome

### Page Structure
- `/` — main landing (`index.html` at root)
- `/vozvrat-strahovki-{bank}/` — bank-specific landing pages (sberbank, vtb, alfa-bank, tinkoff, sovkombank, pochta-bank, rshb, gazprombank, dosrochno)
- `/blog/` and `/blog/{slug}/` — blog articles (static HTML)
- `/uslugi/`, `/kak-rabotaet/`, `/otzyvy/`, `/contacts/`, `/kalkulyator/`, `/faq/` — section pages
- `/thank-you/` — post-submission page
- `/privacy.html`, `/terms.html`, `/offer.html` — legal pages

### Scripts (`scripts/`)
- `create-bank-pages.js` — generates bank-specific landing pages from the alfa-bank template
- `blog-template.js` — blog page generator
- `test-forms-api.js` — automated API tests for form submission
- `audit-seo.js` / `audit-seo-full.js` — SEO audit utilities
- `copy-docx-to-assets.js` — copies DOCX templates to `assets/documents/`

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
- `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `NOTIFICATION_EMAIL` — email delivery
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — Telegram notifications
- `CSRF_SECRET` — CSRF protection secret
- `ALLOWED_ORIGINS` — comma-separated CORS origins
- `YANDEX_METRIKA_ID` — analytics
- `PORT` (default 3000), `NODE_ENV`

## Key Conventions

- All page routes use trailing slashes; the server redirects non-trailing to trailing
- Form submissions go through CSRF flow: frontend fetches `GET /api/csrf-token`, then sends token in `x-csrf-token` header on `POST /api/submit-form`
- Tailwind config uses custom colors: `primary` (#1E3A8A), `secondary` (#F97316), and fonts: Montserrat (headings), Inter (body)
- Bank-specific pages follow a template pattern — use `scripts/create-bank-pages.js` to generate new ones from the alfa-bank base template
- The site uses Cyrillic domain (вернистраховку.рф) with Punycode equivalent (xn--80aaffoba4b4cyb.xn--p1ai)
