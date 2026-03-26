# 📱 Cashflow PWA (React + Google Apps Script) Implementation Guide

## 🧠 Overview
This guide walks you through building a **Progressive Web App (PWA)** using React that uses **Google Sheets as a database** via Google Apps Script.

---

## 🏗️ Architecture

```
React PWA (Frontend)
        ↓ fetch()
Google Apps Script (API Layer)
        ↓
Google Sheets (Database)
```

---

## 📊 Features Covered

1. Cash Flow Tracking (Income/Expense)
2. Category Management (CRUD)
3. Tag Management (CRUD, multiple per item)
4. Charts (Line + Pie)
5. Multi-user support (based on sheet column)

---

## 📁 STEP 1: Setup Google Sheets

Create a Google Sheet with the following tabs:

### 1. `transactions`
| id | date | type | category_id | amount | note | tags | user |
|----|------|------|-------------|--------|------|------|------|

- `type`: income / expense
- `tags`: comma-separated values (e.g., food,urgent)

### 2. `categories`
| id | name | type |
|----|------|------|

### 3. `tags`
| id | name |

### 4. `users`
| id | name |

---

## ⚙️ STEP 2: Google Apps Script API

1. Open your sheet
2. Go to **Extensions → Apps Script**

### 🔹 Basic API Structure

```javascript
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getTransactions') {
    return getTransactions();
  }

  if (action === 'getCategories') {
    return getSheetData('categories');
  }

  if (action === 'getTags') {
    return getSheetData('tags');
  }

  if (action === 'getUsers') {
    return getSheetData('users');
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }));
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'addTransaction') {
    return addRow('transactions', data.payload);
  }

  if (action === 'addCategory') {
    return addRow('categories', data.payload);
  }

  if (action === 'addTag') {
    return addRow('tags', data.payload);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }));
}
```

---

### 🔹 Helper Functions

```javascript
function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const result = data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function addRow(sheetName, payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sheet.appendRow(Object.values(payload));

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

### 🚀 Deploy API

- Click **Deploy → New Deployment**
- Type: Web App
- Access: **Anyone**
- Copy URL

---

## ⚛️ STEP 3: React App Setup

### Create App
```bash
npm create vite@latest cashflow-app
cd cashflow-app
npm install
```

---

## 🔌 STEP 4: API Integration

Create `api.js`:

```javascript
const BASE_URL = "YOUR_SCRIPT_URL";

export async function fetchData(action) {
  const res = await fetch(`${BASE_URL}?action=${action}`);
  return res.json();
}

export async function postData(action, payload) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    body: JSON.stringify({ action, payload })
  });

  return res.json();
}
```

---

## 💰 STEP 5: Cash Flow Features

### Add Transaction

```javascript
postData('addTransaction', {
  id: Date.now(),
  date: '2026-03-24',
  type: 'expense',
  category_id: 1,
  amount: 100,
  note: 'Lunch',
  tags: 'food,quick',
  user: 'Leo'
});
```

---

## 🏷️ STEP 6: Category CRUD

- Fetch categories → `getCategories`
- Add → `addCategory`
- (Extend Apps Script for update/delete)

---

## 🔖 STEP 7: Tags (Multiple per Item)

- Store as comma-separated string
- Convert in React:

```javascript
const tagsArray = tags.split(',');
```

---

## 👥 STEP 8: Multi-user Support

- Fetch users from sheet
- Dropdown selection when adding transaction
- Store `user` field in transaction

---

## 📈 STEP 9: Charts

Install chart library:

```bash
npm install recharts
```

### Line Chart (Cash Flow Over Time)
- Group by date
- Plot income vs expense

### Pie Chart (Expenses by Category)
- Group expenses by category

---

## 📱 STEP 10: Make it a PWA

### Install PWA plugin

```bash
npm install vite-plugin-pwa
```

### Configure

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate'
    })
  ]
}
```

---

## ☁️ STEP 11: Deploy using Firebase Hosting

We will use Firebase to host your PWA.

### 🔹 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 🔹 Login

```bash
firebase login
```

### 🔹 Initialize Firebase in your project

```bash
firebase init
```

Choose:
- Hosting
- Select your Firebase project (or create new)
- Public directory: `dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: No (optional)

---

### 🔹 Build your React app

```bash
npm run build
```

---

### 🔹 Deploy

```bash
firebase deploy
```

---

### 📱 Install on your phone

1. Open the Firebase URL in Chrome (Android)
2. Tap **Add to Home Screen**
3. Your app is now installed like a native app

---

## 📦 STEP 12: Local Preview (Optional)

```bash
npm run preview
```

Use this to test before deploying.

---

## ⚠️ Limitations

---

## ⚠️ Limitations

- No real-time updates
- Limited scalability
- Manual ID handling

---

## 🚀 Future Improvements

- Add authentication
- Move to Laravel backend
- Sync offline data
- Better tag system (relational)

---

## 💡 Final Notes

This setup is perfect for:
- Personal finance tracking
- Small shared usage (you + wife)
- MVP development

You can later upgrade without rewriting your frontend.

---

Happy building 🚀

