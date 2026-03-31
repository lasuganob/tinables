# Navigation Refactor Guideline

## Goal

Refactor the current single-page app into a 5-page structure with a persistent navigation shell:

- Dashboard
- Transactions
- Budgets & Goals
- Recurring Dues
- Managers

This should improve information architecture, reduce page density, and create clear extension points for upcoming features without rewriting the existing data layer.

## Current State

The app is currently composed in [`src/App.jsx`](/Users/ippuser/Desktop/Work/Apps/tinables-app/src/App.jsx) as one stacked page with these sections:

- Header
- Global filters
- Summary stats
- Charts
- Recent transactions with inline transaction form
- Managers dialog launcher

Data loading and CRUD are already centralized enough to support a page split:

- Shared bootstrap and refresh logic live in [`src/hooks/useAppData.js`](/Users/ippuser/Desktop/Work/Apps/tinables-app/src/hooks/useAppData.js)
- Transaction form behavior lives in [`src/hooks/useTransactionForm.js`](/Users/ippuser/Desktop/Work/Apps/tinables-app/src/hooks/useTransactionForm.js)
- Category, tag, and account forms already have separate hooks

This means the recommended approach is to introduce app layout and page composition first, then move existing sections into page containers with minimal behavior changes.

## Target Information Architecture

### 1. Dashboard

Contains:

- Global filters
- Summary stats
- Charts

Purpose:

- High-level financial overview
- Read-heavy landing page
- Main analytics destination

### 2. Transactions

Contains:

- Transaction form
- Recent transactions table
- Transaction editing and deletion

Purpose:

- Daily operational workflow
- Fast add/edit/delete actions

### 3. Budgets & Goals

Initial phase:

- Placeholder page with empty state
- Brief description of upcoming budget tracking scope

Future scope:

- Monthly category budgets
- Savings goals
- Progress bars and variance from actual spending

### 4. Recurring Dues

Initial phase:

- Placeholder page with empty state
- Brief description of recurring items roadmap

Future scope:

- Recurring expenses and income
- Next due date tracking
- Auto-create draft transactions

### 5. Managers

Contains:

- Accounts
- Categories
- Tags

Purpose:

- Administrative setup
- Lower-frequency maintenance tasks

## Navigation Recommendation

Use a page-level navigation shell, not section-level navigation.

Recommended sidebar items:

- Dashboard
- Transactions
- Budgets & Goals
- Recurring Dues
- Managers

Do not expose these as sidebar items:

- Filters
- Transaction Form
- Charts
- Accounts
- Categories
- Tags

Those belong inside pages as page sections or tabs. If they become primary navigation items, the UI will feel too granular and mobile navigation will become noisy.

## Recommended Technical Approach

### Phase 1: Introduce Routing

Add client-side routing and introduce provider-backed shared state, then convert the app into route-based pages.

Recommended package:

- `react-router-dom`

Suggested route map:

- `/` -> Dashboard
- `/transactions` -> Transactions
- `/budgets` -> Budgets & Goals
- `/recurring-dues` -> Recurring Dues
- `/managers` -> Managers

Implementation notes:

- Move shared cross-page state into React context providers
- Render page components inside a shared app shell
- Avoid moving data-fetching into each page separately during the first pass
- Keep provider responsibilities narrow so later features can scale without one oversized global store

## Suggested File Structure

Suggested additions:

```text
src/
  context/
    AppDataContext.jsx
    AppFiltersContext.jsx
    AppProviders.jsx
  layout/
    AppShell.jsx
    SidebarNav.jsx
  pages/
    DashboardPage.jsx
    TransactionsPage.jsx
    BudgetsPage.jsx
    RecurringDuesPage.jsx
    ManagersPage.jsx
```

Possible section reuse:

- Keep existing section components in `src/sections/`
- Compose those sections inside page components

Example mapping:

- `DashboardPage.jsx`
  - `HeaderSection`
  - `GlobalFiltersSection`
  - `SummaryStatsSection`
  - `ChartsSection`
- `TransactionsPage.jsx`
  - transaction page header
  - `RecentTransactionsSection`
- `ManagersPage.jsx`
  - replace dialog-driven entry with direct on-page management UI

## App Shell Responsibilities

The new shell should own:

- Sidebar navigation
- Mobile drawer behavior
- Top-level content container
- Shared page title area if needed

The shell should not own:

- Data fetching logic
- Section-specific business rules
- Form state details

Recommended behavior:

- Desktop: fixed left sidebar
- Mobile: temporary drawer with a menu toggle
- Active route should be visually highlighted

## Shared State Strategy

Add React context as part of the refactor rather than as a later optimization.

Recommended providers:

- `AppDataProvider`
- `AppFiltersProvider`
- optional `AppFeedbackProvider` if alerts and save state start spanning multiple pages

Recommended ownership:

- `AppFiltersProvider`
  - `selectedUser`
  - `dateFilter`
  - filter update helpers
- `AppDataProvider`
  - loaded collections from `useAppData`
  - refresh handlers
  - delete handlers
  - loading state
- route-local state
  - chart UI state such as `chartCategoryId`, `chartTagIds`
  - table sort state
  - menu anchor state
  - inline editor visibility
  - page-only presentation state

Rationale:

- Dashboard and Transactions both depend on global filters
- Managers depends on the same loaded collections and refresh functions
- the 5-page layout will otherwise create avoidable prop-drilling
- budgets and recurring features will need shared collections and filter context later
- provider boundaries now will keep `App.jsx` from becoming a route-and-state orchestration file again

Guidelines:

- Split context by domain instead of using one large app-wide provider object
- Keep ephemeral page UI state local unless multiple pages truly share it
- Memoize provider values where useful to reduce unnecessary rerenders
- Expose context through custom hooks such as `useAppDataContext()` and `useAppFiltersContext()`

Recommended composition:

- `AppProviders`
  - `AppFiltersProvider`
  - `AppDataProvider`
  - optional feedback provider

This provider composition should wrap the routed shell near the top of the app tree.

## Page Composition Guidance

### Dashboard Page

Move these existing sections here:

- `HeaderSection`
- `GlobalFiltersSection`
- `SummaryStatsSection`
- `ChartsSection`

Notes:

- Keep current chart state here: `chartCategoryId`, `chartTagIds`
- Keep the global filter controls visible and prominent
- Consume filters and shared collections through context hooks instead of broad page props

### Transactions Page

Move these here:

- transaction form
- transaction table

Important note:

[`src/sections/RecentTransactionsSection.jsx`](/Users/ippuser/Desktop/Work/Apps/tinables-app/src/sections/RecentTransactionsSection.jsx) currently combines:

- inline creation/editing
- transaction list
- row actions

That is acceptable for phase 1. Do not split this component unless the refactor becomes unstable. Route it into its own page first, then decide whether to separate:

- `TransactionFormSection`
- `TransactionsTableSection`

Context guidance:

- use shared filters and collection data from context
- keep row actions, sort state, and inline editor state local to the page/component

### Managers Page

This page should stop relying on modal-first access as the primary interaction model.

[`src/sections/ManagersSection.jsx`](/Users/ippuser/Desktop/Work/Apps/tinables-app/src/sections/ManagersSection.jsx) currently opens dialogs for:

- categories
- tags
- accounts

Recommended transition:

Phase 1:

- Keep the existing component working on the Managers page
- Accept temporary dialog-based management while routing is introduced

Phase 2:

- Convert managers into direct page sections or tabs
- Recommended order:
  - Accounts
  - Categories
  - Tags

Suggested UI options:

- top tabs
- segmented control
- stacked sections if content remains small

Prefer tabs if all three managers stay form-heavy.

Context guidance:

- accounts, categories, tags, users, account types, refresh handlers, and delete handlers should come from `AppDataContext`
- the active manager tab or section state should remain local to the Managers page

### Budgets & Goals Page

Initial deliverable:

- page title
- short feature intro
- empty state card
- optional CTA such as "Coming soon"

Do not block the navigation refactor on budget logic implementation.

### Recurring Dues Page

Initial deliverable:

- page title
- short feature intro
- empty state card

Do not implement recurrence logic in the same pull request as the navigation refactor.

## Recommended Rollout Plan

### Step 1

Install router support, add context providers, and create page components with placeholder content.

Success criteria:

- navigation works
- shared app state is available through provider hooks
- no business logic removed
- current data still loads correctly

### Step 2

Move existing sections into Dashboard, Transactions, and Managers pages and replace broad prop chains with context consumption.

Success criteria:

- all current features remain usable
- no regressions in transaction CRUD
- filters still affect dashboard and transactions correctly
- `App.jsx` is no longer a large prop orchestrator

### Step 3

Add Budgets & Goals and Recurring Dues placeholder pages.

Success criteria:

- app feels complete from a navigation perspective
- future features have an obvious home

### Step 4

Refine Managers page from dialog launcher into tabs or inline sections.

Success criteria:

- fewer clicks to manage setup data
- better use of page space on desktop

### Step 5

Polish responsive navigation and page-level UX.

Include:

- mobile drawer
- route-aware titles
- loading consistency across pages

## UX Guidelines

### Navigation

- Keep labels short and stable
- Use icons, but do not rely on icons alone
- Highlight the active page clearly
- Preserve enough left padding and spacing so the app does not feel cramped

### Content Density

- Dashboard should remain read-focused
- Transactions should optimize for quick entry and scanning
- Managers should optimize for maintenance workflows

### Mobile

- Sidebar should collapse into a drawer
- Transaction creation must remain fast on mobile
- Avoid multi-column layouts where forms become cramped

## Risks and Mitigations

### Risk: Context becomes a dumping ground

Cause:

- adding unrelated UI state and page-only concerns into shared providers

Mitigation:

- split providers by domain
- keep transient UI state local
- define provider ownership before implementation

### Risk: Unnecessary rerenders across pages

Cause:

- large provider values recreated too often

Mitigation:

- memoize provider values where needed
- separate filters from loaded data
- avoid storing table/menu/dialog state in context

### Risk: Managers page feels unfinished

Cause:

- dialog-based management carried over into a page route

Mitigation:

- accept this temporarily
- plan a second pass to convert dialogs into tabs or page sections

### Risk: Navigation refactor gets bundled with new feature logic

Cause:

- attempting to implement budgets and recurring dues at the same time

Mitigation:

- keep Budgets & Goals and Recurring Dues as placeholders first
- separate architecture work from feature work

## Definition of Done for the Refactor

The navigation refactor is complete when:

- the app has 5 real page routes
- a persistent sidebar or drawer is present
- shared cross-page state is exposed through React context providers
- Dashboard contains filters, stats, and charts
- Transactions contains transaction entry and transaction management
- Managers has a dedicated route
- Budgets & Goals and Recurring Dues exist as routable pages
- current CRUD behavior still works
- mobile navigation is usable

## Recommended First Pull Request Scope

Keep the first implementation PR narrow.

Include:

- `react-router-dom`
- context providers for shared app data and filters
- shared app shell
- sidebar navigation
- route definitions
- Dashboard page
- Transactions page
- Managers page
- placeholder Budgets & Goals page
- placeholder Recurring Dues page

Do not include:

- new budget logic
- recurring transaction engine
- manager feature redesign
- major data layer rewrites

## Summary

The best path is an incremental route-based refactor:

1. Introduce a shared navigation shell.
2. Split the current single page into Dashboard, Transactions, and Managers.
3. Add placeholder pages for Budgets & Goals and Recurring Dues.
4. Improve page internals after the structure is stable.

This keeps the work low-risk, makes the product easier to grow, and avoids mixing navigation architecture with future finance features in one large change.
