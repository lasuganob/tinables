import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "./lib/format";
import { emptyCategory, emptyTag } from "./constants/defaults";
import { totalByType, groupCashflow, groupExpenseByCategory } from "./utils/transactions";
import { StatCard } from "./components/StatCard";
import { LineChart } from "./components/LineChart";
import { PieChart } from "./components/PieChart";
import { Modal } from "./components/Modal";
import { useFeedback } from "./hooks/useFeedback";
import { useAppData } from "./hooks/useAppData";
import { useTransactionForm } from "./hooks/useTransactionForm";
import { useCategoryForm } from "./hooks/useCategoryForm";
import { useTagForm } from "./hooks/useTagForm";

function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

function SkeletonTable({ rows = 5, columns = 7 }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index}>
                <SkeletonBlock className="skeleton-line skeleton-line--short" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <td key={columnIndex}>
                  <SkeletonBlock className="skeleton-line" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [selectedUser, setSelectedUser] = useState("");
  const [activeChart, setActiveChart] = useState("");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactionSort, setTransactionSort] = useState({ key: "date", direction: "desc" });
  const [activeManager, setActiveManager] = useState("");
  const [dateFilter, setDateFilter] = useState({
    mode: "all",
    month: "",
    year: "",
    startDate: "",
    endDate: ""
  });
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // ─── Hooks ────────────────────────────────────────────────────────────────
  const { error, setError, message, setMessage, isSaving, setIsSaving } = useFeedback();
  const feedback = { setError, setMessage, setIsSaving };

  const {
    transactions, categories, tags, users, isLoading,
    refreshTransactions, refreshCategories, refreshTags, handleDelete
  } = useAppData({ selectedUser, ...feedback });

  const { transactionForm, setTransactionForm, handleTransactionSubmit, resetTransactionForm } =
    useTransactionForm({ selectedUser, users, refreshTransactions, ...feedback });

  const { categoryForm, setCategoryForm, handleCategorySubmit } =
    useCategoryForm({ refreshCategories, ...feedback });

  const { tagForm, setTagForm, handleTagSubmit } =
    useTagForm({ refreshTags, ...feedback });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsFilterLoading(false), 220);
    setIsFilterLoading(true);

    return () => window.clearTimeout(timeoutId);
  }, [selectedUser, dateFilter.mode, dateFilter.month, dateFilter.year, dateFilter.startDate, dateFilter.endDate]);

  // ─── Derived data ─────────────────────────────────────────────────────────
  const availableYears = useMemo(
    () =>
      [...new Set(transactions.map((transaction) => String(transaction.date || "").slice(0, 4)).filter(Boolean))]
        .sort((left, right) => Number(right) - Number(left)),
    [transactions]
  );

  const visibleTransactions = useMemo(() => {
    const userScoped = selectedUser ? transactions.filter((transaction) => transaction.user === selectedUser) : transactions;

    return userScoped.filter((transaction) => {
      const transactionDate = String(transaction.date || "");

      if (dateFilter.mode === "month" && dateFilter.month) {
        return transactionDate.slice(0, 7) === dateFilter.month;
      }

      if (dateFilter.mode === "year" && dateFilter.year) {
        return transactionDate.slice(0, 4) === dateFilter.year;
      }

      if (dateFilter.mode === "range") {
        if (dateFilter.startDate && transactionDate < dateFilter.startDate) {
          return false;
        }

        if (dateFilter.endDate && transactionDate > dateFilter.endDate) {
          return false;
        }
      }

      return true;
    });
  }, [dateFilter, selectedUser, transactions]);

  const lineData = useMemo(() => groupCashflow(visibleTransactions), [visibleTransactions]);
  const pieData = useMemo(
    () => groupExpenseByCategory(visibleTransactions, categories),
    [visibleTransactions, categories]
  );

  const incomeTotal = totalByType(visibleTransactions, "income");
  const expenseTotal = totalByType(visibleTransactions, "expense");
  const balance = incomeTotal - expenseTotal;

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category.name])),
    [categories]
  );

  const tagNameById = useMemo(
    () => new Map(tags.map((tag) => [String(tag.id), tag.name])),
    [tags]
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          String(category.type || "").trim().toLowerCase() ===
          String(transactionForm.type || "").trim().toLowerCase()
      ),
    [categories, transactionForm.type]
  );

  const transactionFormTagIds = useMemo(
    () =>
      (transactionForm.tags || []).map((tagValue) => {
        const directId = String(tagValue);
        if (tagNameById.has(directId)) {
          return directId;
        }

        const matchedTag = tags.find((tag) => tag.name === tagValue);
        return matchedTag ? String(matchedTag.id) : directId;
      }),
    [transactionForm.tags, tagNameById, tags]
  );

  const sortedTransactions = useMemo(() => {
    const items = [...visibleTransactions];

    items.sort((left, right) => {
      if (transactionSort.key === "category") {
        const leftName = categoryNameById.get(String(left.category_id)) || "Unknown";
        const rightName = categoryNameById.get(String(right.category_id)) || "Unknown";
        return transactionSort.direction === "asc"
          ? leftName.localeCompare(rightName)
          : rightName.localeCompare(leftName);
      }

      if (transactionSort.key === "amount") {
        return transactionSort.direction === "asc"
          ? Number(left.amount) - Number(right.amount)
          : Number(right.amount) - Number(left.amount);
      }

      return transactionSort.direction === "asc"
        ? new Date(left.date) - new Date(right.date)
        : new Date(right.date) - new Date(left.date);
    });

    return items;
  }, [visibleTransactions, transactionSort, categoryNameById]);

  const latestTransactions = useMemo(
    () => [...visibleTransactions].sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 5),
    [visibleTransactions]
  );

  function toggleTransactionSort(key) {
    setTransactionSort((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }

      return { key, direction: key === "category" ? "asc" : "desc" };
    });
  }

  function getSortLabel(key) {
    if (transactionSort.key !== key) {
      return "";
    }

    return transactionSort.direction === "asc" ? " ▲" : " ▼";
  }

  function renderTagBadges(tagValues) {
    if (!tagValues?.length) {
      return <span className="tag-empty">-</span>;
    }

    return (
      <div className="tag-badges">
        {tagValues.map((tagValue, index) => {
          const resolvedName = tagNameById.get(String(tagValue)) || String(tagValue);
          return (
            <span key={`${tagValue}-${index}`} className="tag-badge">
              {resolvedName}
            </span>
          );
        })}
      </div>
    );
  }

  function updateDateFilter(key, value) {
    setDateFilter((current) => ({ ...current, [key]: value }));
  }

  const isViewLoading = isLoading || isFilterLoading;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1 className="eyebrow">Tinables App</h1>
        </div>
        <label className="field field--compact">
          <span>Active user</span>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </select>
        </label>
      </header>

      {error ? <div className="banner banner--error">{error}</div> : null}
      {message ? <div className="banner banner--success">{message}</div> : null}

      <section className="panel filter-panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>Filter all displayed data</h2>
          </div>
        </div>
        <div className="filter-grid">
          <label className="field">
            <span>Filter type</span>
            <select
              value={dateFilter.mode}
              onChange={(event) => setDateFilter((current) => ({ ...current, mode: event.target.value }))}
            >
              <option value="all">All dates</option>
              <option value="month">By month</option>
              <option value="year">By year</option>
              <option value="range">Date range</option>
            </select>
          </label>

          {dateFilter.mode === "month" ? (
            <label className="field">
              <span>Month</span>
              <input
                type="month"
                value={dateFilter.month}
                onChange={(event) => updateDateFilter("month", event.target.value)}
              />
            </label>
          ) : null}

          {dateFilter.mode === "year" ? (
            <label className="field">
              <span>Year</span>
              <select value={dateFilter.year} onChange={(event) => updateDateFilter("year", event.target.value)}>
                <option value="">Select year</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          ) : null}

          {dateFilter.mode === "range" ? (
            <>
              <label className="field">
                <span>Start date</span>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(event) => updateDateFilter("startDate", event.target.value)}
                />
              </label>
              <label className="field">
                <span>End date</span>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(event) => updateDateFilter("endDate", event.target.value)}
                />
              </label>
            </>
          ) : null}

          <div className="form-actions filter-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                setDateFilter({
                  mode: "all",
                  month: "",
                  year: "",
                  startDate: "",
                  endDate: ""
                })
              }
            >
              Clear filter
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="stats-grid">
        {isViewLoading ? (
          <>
            <article className="stat-card"><SkeletonBlock className="skeleton-line skeleton-line--short" /><SkeletonBlock className="skeleton-line skeleton-line--title" /></article>
            <article className="stat-card"><SkeletonBlock className="skeleton-line skeleton-line--short" /><SkeletonBlock className="skeleton-line skeleton-line--title" /></article>
            <article className="stat-card"><SkeletonBlock className="skeleton-line skeleton-line--short" /><SkeletonBlock className="skeleton-line skeleton-line--title" /></article>
          </>
        ) : (
          <>
            <StatCard label="Income" value={formatCurrency(incomeTotal)} tone="income" />
            <StatCard label="Expenses" value={formatCurrency(expenseTotal)} tone="expense" />
            <StatCard label="Balance" value={formatCurrency(balance)} tone={balance >= 0 ? "income" : "expense"} />
          </>
        )}
      </section>

      {/* ── Transaction form + table ───────────────────────────────────────── */}
      <section className="workspace-grid">
        <article className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Transactions</p>
            <h2>{transactionForm.id ? "Edit transaction" : "Add transaction"}</h2>
          </div>
        </div>
          {isViewLoading ? (
            <div className="form-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <label key={index} className="field">
                  <SkeletonBlock className="skeleton-line skeleton-line--short" />
                  <SkeletonBlock className="skeleton-field" />
                </label>
              ))}
              <label className="field field--full">
                <SkeletonBlock className="skeleton-line skeleton-line--short" />
                <SkeletonBlock className="skeleton-field skeleton-field--tall" />
              </label>
              <div className="form-actions field--full">
                <SkeletonBlock className="skeleton-button" />
                <SkeletonBlock className="skeleton-button" />
              </div>
            </div>
          ) : (
          <form className="form-grid" onSubmit={handleTransactionSubmit}>
            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Type</span>
              <select
                value={transactionForm.type}
                onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value, category_id: "" })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label className="field">
              <span>Category</span>
              <select
                value={String(transactionForm.category_id ?? "")}
                onChange={(e) => setTransactionForm({ ...transactionForm, category_id: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>User</span>
              <select
                value={transactionForm.user}
                onChange={(e) => setTransactionForm({ ...transactionForm, user: e.target.value })}
              >
                <option value="">All</option>
                {users.map((user) => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </label>
            <label className="field field--full">
              <span>Tags</span>
              <select
                multiple
                value={transactionFormTagIds}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    tags: [...e.target.selectedOptions].map((o) => o.value)
                  })
                }
              >
                {tags.map((tag) => (
                  <option key={tag.id} value={String(tag.id)}>{tag.name}</option>
                ))}
              </select>
            </label>
            <label className="field field--full">
              <span>Note</span>
              <textarea
                rows="3"
                value={transactionForm.note}
                onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
              />
            </label>
            <div className="form-actions field--full">
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : transactionForm.id ? "Update transaction" : "Add transaction"}
              </button>
              {transactionForm.id ? (
                <button type="button" className="button-secondary" onClick={resetTransactionForm}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Transactions</p>
              <h2>Recent entries</h2>
            </div>
            <button type="button" className="button-secondary" onClick={() => setShowAllTransactions(true)}>
              Show All
            </button>
          </div>
          {isViewLoading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>User</th>
                  <th>Tags</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {latestTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td className={`type-pill type-pill--${t.type}`}>{t.type}</td>
                    <td>{categoryNameById.get(String(t.category_id)) || "Unknown"}</td>
                    <td>{formatCurrency(t.amount)}</td>
                    <td>{t.user}</td>
                    <td>{renderTagBadges(t.tags)}</td>
                    <td className="row-actions">
                      <button type="button" className="button-secondary" onClick={() => setTransactionForm(t)}>
                        Edit
                      </button>
                      <button type="button" className="button-danger" onClick={() => handleDelete("deleteTransaction", t.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!latestTransactions.length && !isLoading ? (
                  <tr>
                    <td colSpan="7" className="empty-row">No transactions found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          )}
        </article>
      </section>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <section className="panel chart-actions-panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Charts</p>
            <h2>Open chart views</h2>
          </div>
        </div>
        <div className="chart-action-buttons">
          <button type="button" onClick={() => setActiveChart("timeline")}>
            Show Cashflow Timeline
          </button>
          <button type="button" className="button-secondary" onClick={() => setActiveChart("breakdown")}>
            Show Breakdown
          </button>
        </div>
      </section>

      <section className="panel chart-actions-panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Managers</p>
            <h2>Open category and tag management</h2>
          </div>
        </div>
        <div className="chart-action-buttons">
          <button type="button" onClick={() => setActiveManager("categories")}>
            Manage Categories
          </button>
          <button type="button" className="button-secondary" onClick={() => setActiveManager("tags")}>
            Manage Tags
          </button>
        </div>
      </section>

      {activeChart === "timeline" ? (
        <Modal title="Cashflow timeline" onClose={() => setActiveChart("")}>
          {isViewLoading ? <SkeletonBlock className="skeleton-chart" /> : <LineChart data={lineData} />}
        </Modal>
      ) : null}

      {activeChart === "breakdown" ? (
        <Modal title="Expense breakdown" onClose={() => setActiveChart("")}>
          {isViewLoading ? <SkeletonBlock className="skeleton-chart" /> : <PieChart data={pieData} />}
        </Modal>
      ) : null}

      {showAllTransactions ? (
        <Modal title="All transactions" onClose={() => setShowAllTransactions(false)}>
          {isViewLoading ? (
            <SkeletonTable rows={8} columns={7} />
          ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => toggleTransactionSort("category")}
                    >
                      Category{getSortLabel("category")}
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => toggleTransactionSort("amount")}
                    >
                      Amount{getSortLabel("amount")}
                    </button>
                  </th>
                  <th>User</th>
                  <th>Tags</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.date)}</td>
                    <td className={`type-pill type-pill--${transaction.type}`}>{transaction.type}</td>
                    <td>{categoryNameById.get(String(transaction.category_id)) || "Unknown"}</td>
                    <td>{formatCurrency(transaction.amount)}</td>
                    <td>{transaction.user}</td>
                    <td>{renderTagBadges(transaction.tags)}</td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => {
                          setTransactionForm(transaction);
                          setShowAllTransactions(false);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button-danger"
                        onClick={() => handleDelete("deleteTransaction", transaction.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!sortedTransactions.length && !isLoading ? (
                  <tr>
                    <td colSpan="7" className="empty-row">No transactions found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          )}
        </Modal>
      ) : null}

      {activeManager === "categories" ? (
        <Modal title="Manage categories" onClose={() => setActiveManager("")}>
          {isViewLoading ? (
            <>
              <div className="form-grid">
                <label className="field">
                  <SkeletonBlock className="skeleton-line skeleton-line--short" />
                  <SkeletonBlock className="skeleton-field" />
                </label>
                <label className="field">
                  <SkeletonBlock className="skeleton-line skeleton-line--short" />
                  <SkeletonBlock className="skeleton-field" />
                </label>
                <div className="form-actions field--full">
                  <SkeletonBlock className="skeleton-button" />
                </div>
              </div>
              <div className="stack-list">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="stack-list__item">
                    <div className="stack-list__content">
                      <SkeletonBlock className="skeleton-line" />
                      <SkeletonBlock className="skeleton-line skeleton-line--short" />
                    </div>
                    <div className="row-actions">
                      <SkeletonBlock className="skeleton-button" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
          <>
          <form className="form-grid" onSubmit={handleCategorySubmit}>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Type</span>
              <select
                value={categoryForm.type}
                onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <div className="form-actions field--full">
              <button type="submit" disabled={isSaving}>
                {categoryForm.id ? "Update category" : "Add category"}
              </button>
              {categoryForm.id ? (
                <button type="button" className="button-secondary" onClick={() => setCategoryForm(emptyCategory)}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
          <div className="stack-list">
            {categories.map((c) => (
              <div key={c.id} className="stack-list__item">
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.type}</span>
                </div>
                <div className="row-actions">
                  <button type="button" className="button-secondary" onClick={() => setCategoryForm(c)}>Edit</button>
                  <button type="button" className="button-danger" onClick={() => handleDelete("deleteCategory", c.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </Modal>
      ) : null}

      {activeManager === "tags" ? (
        <Modal title="Manage tags" onClose={() => setActiveManager("")}>
          {isViewLoading ? (
            <>
              <div className="form-grid">
                <label className="field field--full">
                  <SkeletonBlock className="skeleton-line skeleton-line--short" />
                  <SkeletonBlock className="skeleton-field" />
                </label>
                <div className="form-actions field--full">
                  <SkeletonBlock className="skeleton-button" />
                </div>
              </div>
              <div className="stack-list stack-list--chips">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="chip-card">
                    <SkeletonBlock className="skeleton-line skeleton-line--short" />
                    <div className="row-actions">
                      <SkeletonBlock className="skeleton-button" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
          <>
          <form className="form-grid" onSubmit={handleTagSubmit}>
            <label className="field field--full">
              <span>Name</span>
              <input
                type="text"
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                required
              />
            </label>
            <div className="form-actions field--full">
              <button type="submit" disabled={isSaving}>
                {tagForm.id ? "Update tag" : "Add tag"}
              </button>
              {tagForm.id ? (
                <button type="button" className="button-secondary" onClick={() => setTagForm(emptyTag)}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
          <div className="stack-list stack-list--chips">
            {tags.map((tag) => (
              <div key={tag.id} className="chip-card">
                <span>{tag.name}</span>
                <div className="row-actions">
                  <button type="button" className="button-secondary" onClick={() => setTagForm(tag)}>Edit</button>
                  <button type="button" className="button-danger" onClick={() => handleDelete("deleteTag", tag.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </Modal>
      ) : null}
    </div>
  );
}

export default App;
