# Google Sheets Derived Data Implementation Guidelines

## Goal

Define a safe and maintainable way to move selected computations from the frontend into Google Sheets while keeping transaction writes and validations reliable.

This document answers:

- which values should remain raw data
- which values can be computed in Google Sheets
- which rules must stay in Apps Script
- how the React app should consume computed results
- how to migrate without breaking existing behavior

## Current Architecture

The app currently uses:

- React frontend for forms, filtering, rendering, and some derived calculations
- Google Apps Script for reads, writes, and validation
- Google Sheets as persistent storage

Today, some financial effects are computed in app code, especially around transaction balance effects and derived summaries.

## Recommended Direction

Use a hybrid model.

- Google Sheets should be the source of truth for read-heavy derived data.
- Apps Script should remain the source of truth for write validation and mutation rules.
- React should focus on UX, form handling, and displaying already-derived data.

Do not move all logic into the frontend.
Do not move all logic into spreadsheet formulas either.

The right split is:

- raw transactional data in sheets
- derived reporting data in sheets
- validation and mutation logic in Apps Script
- presentation logic in React

## Design Principles

### 1. Keep the Ledger Raw

The `transactions` sheet should store atomic records only.

Examples:

- date
- type
- amount
- transfer_fee
- category_id
- account_id
- transfer_account_id
- tags
- note
- user

Do not store duplicated derived values in the transaction row unless there is a clear performance reason.

### 2. Compute Read Models Separately

Computed values should live in separate sheets or clearly separated formula ranges.

Examples:

- account balances
- monthly spending by category
- dashboard summary cards
- user-specific net cashflow by month
- budget actuals

These are read models, not editable source records.

### 3. Keep Validation Server-Side

Rules that protect data integrity must remain in Apps Script even if Sheets also computes the same result.

Examples:

- insufficient funds
- inactive account cannot be used for new transactions
- category/tag/account delete constraints
- transfer balance effect including transfer fee

Reason:

- frontend checks improve UX
- Apps Script checks preserve correctness
- sheet formulas alone are not sufficient as mutation guardrails

### 4. Prefer Refetch Over Reimplementing Complex Derivations

If Sheets already computes a value correctly, the app should fetch it instead of recomputing it in React.

This is especially true for:

- account balances
- dashboard totals
- monthly grouped summaries

## What Should Move to Google Sheets

These are strong candidates for formula-driven computation in Sheets:

- account current balance
- total income / expense for a selected month
- category spend totals
- monthly per-user summaries
- dashboard KPI aggregates
- budget actual amounts
- savings goal progress if based on simple arithmetic

These are good candidates because they are:

- derived from existing records
- read often
- explainable in formulas
- useful outside the app UI

## What Should Stay in Apps Script

These must stay in Apps Script:

- add/update/delete transaction flows
- reversing balance effects on delete or edit
- validating transfer source balance including transfer fee
- blocking inactive accounts for new references
- blocking delete of used accounts, tags, and categories
- archive/deactivate rules

If a formula is used to compute the final displayed balance, Apps Script still needs to validate writes against that same source of truth.

## What Can Stay in React

These can remain in React because they are presentation-oriented:

- local sorting
- pagination
- filter UI state
- modal state
- temporary optimistic UX where safe
- formatting and display fallbacks

React should not be the final authority for financial correctness.

## Recommended Data Layers

### 1. Base Sheets

Editable sheets that represent source records:

- `transactions`
- `accounts`
- `categories`
- `tags`
- `users`
- `account_types`

### 2. Derived Sheets

Computed sheets for reporting:

- `account_balances_view`
- `monthly_category_totals_view`
- `dashboard_summary_view`
- `budget_actuals_view`

The `_view` suffix is recommended to signal these are read-only computed outputs.

### 3. API Layer

Apps Script should expose:

- raw entity endpoints for forms and manager pages
- derived endpoints for dashboard/reporting pages

Examples:

- `getTransactions`
- `getAccounts`
- `getAccountBalances`
- `getDashboardSummary`
- `getMonthlyCategoryTotals`

## Recommended Balance Strategy

For this app, account balance is the most important derived value.

Recommended target model:

- transactions remain the ledger
- Sheets computes account balances from ledger rows
- Apps Script reads the computed account balance when validating writes
- React displays the fetched balance and stops recomputing it independently

For transfer transactions:

- destination account receives `amount`
- source account loses `amount + transfer_fee`

That same rule must exist consistently in:

- Sheets formulas
- Apps Script validations
- any remaining frontend optimistic update path

## Formula Strategy

Keep formulas centralized and predictable.

Recommended practices:

- put each read model in its own sheet
- keep one row per stable entity or period key
- avoid scattering formulas across many tabs
- avoid hidden one-off helper cells where possible
- document each derived sheet’s keys and output columns

For example, `account_balances_view` could expose:

- `account_id`
- `account_name`
- `user`
- `computed_balance`
- `is_active`

## API Strategy

### Raw Endpoints

Use raw endpoints for:

- transaction editor
- account/category/tag manager pages
- record details

### Derived Endpoints

Use derived endpoints for:

- dashboard
- summary cards
- charts
- reports
- budget actuals

This avoids forcing the frontend to assemble expensive aggregates from large raw datasets.

## Migration Plan

### Phase 1: Identify Derived Values

List every computed value currently produced in React or Apps Script.

Classify each as:

- raw data
- validation rule
- derived read model

### Phase 2: Move Read Models First

Start with values that are read-only and easy to verify.

Recommended first moves:

- account balances
- dashboard totals
- expense by category

Do not begin with destructive flows or transaction writes.

### Phase 3: Add Dedicated Apps Script Read Endpoints

Expose the new derived sheets through explicit endpoints.

Do not overload raw endpoints with mixed responsibilities.

### Phase 4: Update React to Consume Derived Endpoints

Replace duplicated client-side calculations with API responses.

Keep temporary fallback logic only if needed during rollout.

### Phase 5: Remove Redundant Frontend Computation

Once validated, delete duplicated React computations so there is only one authoritative implementation.

## Validation Rules During Migration

During the migration period, avoid split-brain logic.

Rules:

- if a number matters financially, define one canonical source
- if Sheets computes it, Apps Script should validate against that same computed value
- React may mirror the rule for UX, but not replace it

Do not leave a state where:

- React computes one value
- Apps Script computes another
- Sheets displays a third

## Error Handling

When using derived data from Sheets:

- fail loudly if a derived endpoint is missing
- show explicit errors if a required formula sheet is misconfigured
- include setup documentation for required sheet names and headers

Apps Script should return actionable messages such as:

- missing derived sheet
- missing required column
- invalid formula output

## Performance Considerations

This approach improves frontend performance when:

- transaction count grows
- dashboard aggregations become more expensive
- multiple pages depend on the same summary data

Watch for spreadsheet-side bottlenecks:

- very large formula ranges
- repeated whole-column formulas
- unstable array formulas with expensive filters

If performance degrades, consider:

- limiting formula ranges
- pre-aggregating monthly views
- caching derived reads in Apps Script where appropriate

## Testing Guidance

Validate each derived read model against a known ledger fixture.

Minimum checks:

- income updates increase correct balance
- expense updates decrease correct balance
- transfer updates deduct `amount + transfer_fee` from source and credit `amount` to destination
- editing a transaction reverses old effect before applying new effect
- deleting a transaction removes its effect
- inactive account validation still blocks new use
- account/category/tag delete rules still behave correctly

## Recommendation for Tinables

Recommended target split for this app:

- keep transaction CRUD and deletion validation in Apps Script
- move account balances and dashboard summary calculations into Google Sheets read models
- gradually move chart and budget aggregates into derived sheets
- simplify React so it renders fetched summaries instead of recalculating them

This gives:

- better auditability in Sheets
- less duplicated logic in React
- safer financial behavior
- a clearer long-term architecture

## Suggested Next Implementation

Start with `account_balances_view`.

Reason:

- high value
- easy to verify
- already central to transaction validation and dashboard display

After that, implement:

1. `dashboard_summary_view`
2. `monthly_category_totals_view`
3. optional budget/goal derived views

## Non-Goals

This guideline does not recommend:

- storing all business logic in formulas
- removing Apps Script validation
- keeping financial correctness only in frontend code
- migrating everything at once
