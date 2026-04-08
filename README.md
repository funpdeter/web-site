# FUNDETER Website

This project is a Create React App site for `www.fundeter.org`.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode at `http://localhost:3000`.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production in the `build` folder.

### `npm run eject`

Copies the build configuration into the repository. This action is not reversible.

## UCI-F Agent

This repository includes an automation agent in `automation/uci-agent` that:

- scans national and international opportunity sources,
- applies FUNDETER automatic filters,
- scores opportunities with the eligibility matrix,
- generates supporting files for detected opportunities,
- notifies `info@fundeter.org` by email when configured,
- updates `public/uci-opportunity.json`,
- updates `public/uci-opportunity-history.json`,
- persists deduplication in `automation/uci-agent/state/processed-opportunities.json`.

### Run Once

```bash
npm run uci-agent:once
```

### Run Continuously

```bash
npm run uci-agent:watch
```

### Environment File

1. Copy `.env.uci-agent.example` to `.env.uci-agent`.
2. Set the mail transport:
   - `UCI_MAIL_TRANSPORT=console`
   - `UCI_MAIL_TRANSPORT=smtp`
   - `UCI_MAIL_TRANSPORT=resend`
3. Optionally limit sources with `UCI_SOURCE_IDS=usaid,minciencias`.
4. Optionally register scheduled execution on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File automation/uci-agent/register-scheduled-task.ps1 -IntervalHours 6
```

## GitHub Actions

### UCI Agent Automation

`.github/workflows/uci-agent.yml`:

- runs every 6 hours and also supports manual execution,
- installs dependencies and runs `npm run uci-agent:once`,
- updates the public UCI snapshot and history files,
- uploads generated packages as workflow artifacts,
- commits updated state back to `main`.

Recommended repository variables:

- `UCI_MAIL_TRANSPORT`
- `UCI_NOTIFY_EMAIL`
- `UCI_SOURCE_IDS`
- `UCI_MAX_DAYS_AHEAD`
- `UCI_MIN_AMOUNT_USD`
- `UCI_MAX_AMOUNT_USD`

Optional email secrets:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `RESEND_API_KEY`, `RESEND_FROM`

### Vercel Production Deployment

`www.fundeter.org` is currently served by Vercel.

`.github/workflows/deploy-vercel.yml` deploys the frontend on every push to `main`,
including the automatic commits produced by the UCI agent.

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

How to obtain them:

1. Link the project locally with `npx vercel link`, or open the Vercel dashboard.
2. Read `orgId` and `projectId` from `.vercel/project.json` after linking, or copy them from the Vercel project settings.
3. Add the values as GitHub Actions secrets in this repository.

Once those secrets are configured, every push to `main` will deploy the latest frontend bundle and the updated `public/uci-opportunity*.json` files to production.
