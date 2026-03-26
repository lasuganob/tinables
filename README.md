# Tinables Cashflow PWA

React + Vite PWA frontend for a cashflow tracker that uses Google Sheets through Google Apps Script.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set `VITE_GOOGLE_SCRIPT_URL`.

3. Start the app:

```bash
npm run dev
```

## Google Sheets tabs

Create these tabs with header rows:

- `transactions`: `id,date,type,category_id,amount,note,tags,user`
- `categories`: `id,name,type`
- `tags`: `id,name`
- `users`: `id,name`

## Apps Script

Use [google-apps-script/Code.gs](/Users/ippuser/Desktop/Work/Apps/tinables-app/google-apps-script/Code.gs) in the spreadsheet's Apps Script editor, set `SPREADSHEET_ID` if the script is not bound to the sheet, deploy it as a web app, and set the resulting URL in `.env`.

Recommended deployment settings:

- Execute as: `Me`
- Who has access: `Anyone`
