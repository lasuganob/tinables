# Budgets & Goals Design Doc

## Goal

Design and implement the `Budgets & Goals` feature as a first-class page in Tinables Cashflow.

This feature should let users:

- define monthly spending budgets by category
- define savings goals with target amounts and optional target dates
- compare actual spending and savings progress against plan
- understand variance quickly from the existing transaction data

The design should fit the current architecture:

- React + Vite frontend
- Google Apps Script backend
- Google Sheets as the source of truth
- shared app data and filters via context

## Current State

The current `Budgets & Goals` page is a placeholder in [src/pages/BudgetsPage.jsx](/Users/ippuser/Desktop/Work/Apps/tinables-app/src/pages/BudgetsPage.jsx).

Already available in the app:

- transactions, categories, accounts, tags, and users are loaded centrally
- global filters already exist for user and date range
- transaction categories already distinguish income vs expense
- dashboard charts and summary patterns provide reusable UI conventions

What is missing:

- budget and goal data models
- backend read/write actions for budgets and goals
- derived calculations for plan vs actual
- page UI for managing and tracking these records

## Product Scope

### In Scope for V1

- monthly category budgets for expense categories
- optional user-specific budgets and shared budgets
- savings goals with current amount, target amount, and target date
- progress and variance indicators
- budget status states such as `on_track`, `near_limit`, and `over_budget`
- CRUD for budgets and goals
- filter-aware views that respect the existing selected user

### Out of Scope for V1

- rollover budgets
- automatic goal funding rules
- notifications or push reminders
- recurring budget templates beyond monthly recurrence
- multi-currency handling
- AI-generated recommendations

## User Problems

The feature should solve these concrete problems:

- "How much can I still spend in this category this month?"
- "Which categories are already over plan?"
- "How close am I to a savings target?"
- "Am I saving at the pace required to hit my target date?"

The page should be readable at a glance and should not require users to inspect raw transactions to answer these questions.

## UX Overview

The `Budgets & Goals` page should have two stacked sections:

1. `Monthly Budgets`
2. `Savings Goals`

Recommended page structure:

- page header with title, short description, and primary actions
- KPI summary strip
- monthly budgets section
- savings goals section

### Header

Recommended actions:

- `Add Budget`
- `Add Goal`

Recommended support text:

- explain that budgets are measured against actual transactions
- explain that goals track progress from saved contributions or a manually maintained current amount

### KPI Summary

Recommended summary cards:

- total monthly budget
- total actual spend this month
- remaining budget
- goals on track count

This gives the page an immediate summary before the user drills into individual items.

## Monthly Budgets

### Primary Use Case

User sets a budget amount for an expense category for a given month and optionally scopes it to a user.

### Data Rules

- budgets apply only to expense categories
- one active budget per `(month, category_id, user_scope)` combination
- `user_scope` can be a specific user id or empty for shared/household budget
- actual spend is derived from matching expense transactions in that month
- transfers should not count toward category budgets unless they are modeled as expense transactions

### Recommended UI

Use a card or table layout with one row per budget:

- category
- scope
- month
- budget amount
- actual amount
- remaining amount
- percentage used
- status
- actions

Recommended status thresholds:

- `on_track`: under 80%
- `near_limit`: 80% to below 100%
- `over_budget`: 100% and above

These thresholds should live in frontend constants first and can move server-side later if needed.

### Budget Calculations

For each budget:

- `actual = sum(expense transactions for category in month and scope)`
- `remaining = budget_amount - actual`
- `usage_percent = actual / budget_amount`
- `variance = actual - budget_amount`

If `budget_amount` is `0`, the UI should avoid divide-by-zero and show neutral status.

### Empty States

If no budgets exist:

- explain the benefit of setting category budgets
- show a single primary CTA to create the first budget

## Savings Goals

### Primary Use Case

User tracks progress toward a named financial target such as:

- Emergency Fund
- Travel Fund
- New Laptop

### Goal Model Choice

For V1, use manual `current_amount` tracking with optional linked account metadata later.

Reasoning:

- fastest implementation
- no need to infer intent from arbitrary transactions
- avoids fragile heuristics around what counts as a contribution

V2 can add automatic contribution rules or account-linked progress.

### Recommended Goal Fields

- goal name
- target amount
- current amount
- target date, optional
- owner user id, optional
- note, optional
- status

### Goal Calculations

- `remaining = target_amount - current_amount`
- `progress_percent = current_amount / target_amount`
- if target date exists:
  - compute days remaining
  - compute required monthly pace
  - compare current pace vs required pace when enough history exists

### Recommended Goal Status

- `not_started`
- `in_progress`
- `completed`
- `at_risk` if target date exists and current pace is insufficient

For V1, `at_risk` can be approximated from current amount, remaining amount, and months until target date.

## Filtering Behavior

The page should integrate with the existing global filter model.

Recommended behavior:

- `selectedUser` filters budgets and goals
- for shared budgets/goals, show them when no user filter is selected
- when a specific user is selected:
  - show records owned by that user
  - optionally also show shared records, clearly labeled

Date behavior:

- budgets should default to the current month
- users should be able to navigate month-to-month inside the page
- savings goals should not disappear with month filters, but date-based pace calculations can use the current month context

## Data Model

Add two new Google Sheets tabs.

### `budgets`

Recommended columns:

- `id`
- `month`
- `category_id`
- `amount`
- `user`
- `note`
- `is_active`
- `created_at`
- `updated_at`

Column notes:

- `month` should use a normalized key such as `YYYY-MM`
- `user` should match the existing user id pattern, or be blank for shared budgets
- `is_active` supports soft delete/archive without losing history

### `goals`

Recommended columns:

- `id`
- `name`
- `target_amount`
- `current_amount`
- `target_date`
- `user`
- `note`
- `status`
- `created_at`
- `updated_at`

Column notes:

- `status` can be stored or derived; for V1, storing it is acceptable if the frontend remains source of truth for display logic
- if the team prefers less write complexity, status can be derived client-side instead

## Backend / API Design

The Google Apps Script API should add:

- `getBudgets`
- `createBudget`
- `updateBudget`
- `deleteBudget`
- `getGoals`
- `createGoal`
- `updateGoal`
- `deleteGoal`

Recommended backend behavior:

- validate category existence before budget writes
- reject budgets on income categories
- prevent duplicate active budgets for same month/category/user scope
- validate positive numeric amounts
- validate dates and ids consistently with existing endpoints

The frontend should continue using the same request abstraction pattern already used for transactions and manager entities.

## Frontend Architecture

Recommended new files:

```text
src/hooks/useBudgetForm.js
src/hooks/useGoalForm.js
src/pages/BudgetsPage.jsx
src/components/BudgetProgressCard.jsx
src/components/GoalProgressCard.jsx
src/utils/budgets.js
```

Recommended responsibilities:

- `BudgetsPage.jsx`
  - page composition
  - month navigation
  - section-level state
- `useBudgetForm.js`
  - create/edit form state and validation
- `useGoalForm.js`
  - create/edit goal state and validation
- `utils/budgets.js`
  - pure calculation helpers for actuals, variance, and status

Keep derived calculations out of the render tree where possible. This feature will become difficult to maintain if formulas are duplicated across page sections.

## Derived Calculation Strategy

Budget actuals should be computed client-side from loaded transactions for V1.

Reasoning:

- transaction data is already loaded in the app
- avoids new aggregation endpoints initially
- keeps the backend simpler

Recommended helper inputs:

- transactions
- categories
- selected month
- selected user
- budgets

Recommended helper outputs:

- budget rows with actual, remaining, percent, and status
- page-level totals for summary cards

Goal progress can also be client-side because V1 uses manual `current_amount`.

## Validation Rules

### Budget Validation

- category is required
- category must be an expense category
- month is required
- amount must be greater than `0`
- duplicate active budget combinations are not allowed

### Goal Validation

- name is required
- target amount must be greater than `0`
- current amount must be `>= 0`
- current amount can exceed target amount
- target date is optional, but if present must be a valid date

## Risks

### 1. Double Counting or Misclassified Transactions

If categories are inconsistent, budget actuals will be misleading.

Mitigation:

- enforce expense-category-only budgets
- clearly exclude income and transfers in calculation helpers

### 2. User Scope Ambiguity

Shared vs user-specific budgets can confuse totals.

Mitigation:

- label scope explicitly
- define inclusion rules in the filter logic and keep them consistent everywhere

### 3. Goal Progress Accuracy

Manual `current_amount` can drift from reality.

Mitigation:

- be explicit in the UI that current amount is user-maintained for V1
- leave room for account-linked goals in a later phase

## Delivery Plan

### Phase 1

- add Sheets tabs and backend CRUD
- replace placeholder page with read/write UI
- implement monthly budgets and manual savings goals
- add summary cards and progress indicators

### Phase 2

- add better analytics such as trend vs prior month
- add target-date pacing insights
- add filters for active/completed goals

### Phase 3

- consider account-linked goals
- consider rollover budgets
- consider reminders and notifications

## Acceptance Criteria

The feature is successful when:

- users can create, edit, and delete monthly budgets
- users can create, edit, and delete savings goals
- actual budget usage is computed from existing transactions
- over-budget categories are visually obvious
- goal progress is visible without manual calculation
- the page works on mobile and desktop
- all calculations are consistent with the selected user and month context

## Recommendation

Implement V1 with monthly category budgets plus manual savings goals.

This is the best tradeoff for the current codebase because it:

- uses the existing transaction model directly
- avoids premature backend aggregation complexity
- delivers immediate user value
- leaves a clean path for smarter automation later
