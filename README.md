# 💰 Tinables Cashflow PWA 🏦

**Tinables Cashflow** is a modern, responsive personal finance tracker built as a **passion project** to manage daily expenses and income with ease. This application is an **AI-assisted development** project, leveraging state-of-the-art agentic workflows to build a robust, modular, and performant financial management tool.

The app functions as a sophisticated frontend (React/Vite) that synchronizes and persists all data directly to **Google Sheets** using Google Apps Script as a serverless backend.

---

## ✨ Key Features

- 📱 **Progressive Web App (PWA)**: Installable on your mobile devices with offline caching capabilities.
- 🗺️ **Multi-Page Architecture**: A clean navigation structure using React Router with a persistent sidebar shell.
- 📊 **Dynamic Dashboard**:
  - **Cashflow Timeline**: Interactive Highcharts visualization of historical income vs. expenses.
  - **Expense Breakdown**: Donut chart showcasing spending categories.
  - **Expandable Views**: Charts can be expanded into full-screen modals for deeper filtering (by category or tags).
- 💸 **Transaction Management**:
  - **Paginated Table**: Fast, inline transaction browsing with 15 entries per page.
  - **Smart Filtering**: Global filters by user and date ranges (Month/Year/Range).
  - **Inline Entry**: Add or edit transactions directly within the table view.
- 🏗️ **Modular Management**:
  - **Categories Manager**: Organize income and expense classifications.
  - **Tags Manager**: Fine-grained tracking with custom tags.
  - **Accounts Manager**: Manage multiple wallets, bank accounts, and balances.
- 🔒 **Data Sovereignty**: Your data stays in your own Google Sheet.

---

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **UI Library**: [Material UI (MUI)](https://mui.com/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Data Visualization**: [Highcharts](https://www.highcharts.com/)
- **Date Handling**: [Day.js](https://day.js.org/)
- **PWA Support**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- **Backend**: [Google Apps Script (GAS)](https://developers.google.com/apps-script)
- **Database**: [Google Sheets](https://www.google.com/sheets/about/)

---

## 🚀 Setup & Installation

### 1. Project Setup

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and set your Google Apps Script URL:

```env
VITE_GOOGLE_SCRIPT_URL=your_deployment_url_here
```

### 3. Development

Start the local development server:

```bash
npm run dev
```

### 4. Build

Generate the production bundle:

```bash
npm run build
```

---

## 📊 Google Sheets Configuration

Create a Google Sheet with the following tabs and exact header columns:

- **`transactions`**: `id, date, type, category_id, amount, note, tags, user, account_id, transfer_account_id`
- **`categories`**: `id, name, type`
- **`tags`**: `id, name`
- **`users`**: `id, name`
- **`accounts`**: `id, name, type, balance, user, is_active`
- **`account_types`**: `id, name`

---

## ⚙️ Google Apps Script Deployment

1. Open your Spreadsheet.
2. Go to `Extensions > Apps Script`.
3. Copy the contents of [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) into the editor.
4. If your script isn't "container-bound" to the sheet, set the `SPREADSHEET_ID` variable.
5. Deploy as a **Web App**:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` (Recommended for personal PWA use)
6. Copy the Deployment URL and paste it into your `.env` file.

---

> [!NOTE]
> This application is a **passion project** designed for personal financial clarity. It is actively developed with **AI assistance**, ensuring best practices in modern React architecture and rapid feature iteration.
