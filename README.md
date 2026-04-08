# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## UCI-F Agent (Automation)

This repository now includes an automation agent at `automation/uci-agent` that:

- scans opportunities online (national + international sources),
- applies FUNDETER automatic filters,
- scores opportunities with the eligibility matrix,
- generates 3 files per viable opportunity,
- notifies `info@fundeter.org` by email,
- updates `public/uci-opportunity.json` for the Gestión-UCI section.

### Run once

```bash
npm run uci-agent:once
```

### Run continuously

```bash
npm run uci-agent:watch
```

### Environment file

1. Copy `.env.uci-agent.example` to `.env.uci-agent`.
2. Set the mail transport:
   - `UCI_MAIL_TRANSPORT=console` (no real email),
   - `UCI_MAIL_TRANSPORT=smtp` (requires `SMTP_*`),
   - `UCI_MAIL_TRANSPORT=resend` (requires `RESEND_*`).
3. Optional: limit sources with `UCI_SOURCE_IDS=usaid,minciencias`.
4. Optional (Windows): register scheduled execution:

```powershell
powershell -ExecutionPolicy Bypass -File automation/uci-agent/register-scheduled-task.ps1 -IntervalHours 6
```

### GitHub Actions automation

This repository can also run the agent automatically from GitHub Actions through
`.github/workflows/uci-agent.yml`.

What the workflow does:

- runs every 6 hours and also allows manual execution,
- installs dependencies and executes `npm run uci-agent:once`,
- updates `public/uci-opportunity.json`,
- persists deduplication in `automation/uci-agent/state/processed-opportunities.json`,
- uploads generated opportunity packages as workflow artifacts,
- commits the updated snapshot and state back to `main`.

Recommended repository variables:

- `UCI_MAIL_TRANSPORT=console|smtp|resend`
- `UCI_NOTIFY_EMAIL=info@fundeter.org`
- `UCI_SOURCE_IDS=` for optional source filtering
- optional tuning variables such as `UCI_MAX_DAYS_AHEAD`, `UCI_MIN_AMOUNT_USD`, `UCI_MAX_AMOUNT_USD`

Required secrets only when using real email delivery:

- SMTP mode: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Resend mode: `RESEND_API_KEY`, `RESEND_FROM`

If your production site rebuilds from GitHub on each push, the updated
`public/uci-opportunity.json` will be published automatically after every workflow run.
