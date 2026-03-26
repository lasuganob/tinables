import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "./lib/format";
import { emptyCategory, emptyTag } from "./constants/defaults";
import { totalByType, groupCashflow, groupExpenseByCategory } from "./utils/transactions";
import { StatCard } from "./components/StatCard";
import { LineChart } from "./components/LineChart";
import { PieChart } from "./components/PieChart";
import { useFeedback } from "./hooks/useFeedback";
import { useAppData } from "./hooks/useAppData";
import { useTransactionForm } from "./hooks/useTransactionForm";
import { useCategoryForm } from "./hooks/useCategoryForm";
import { useTagForm } from "./hooks/useTagForm";

function App() {
  const [selectedUser, setSelectedUser] = useState("");

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

  // ─── Derived data ─────────────────────────────────────────────────────────
  const visibleTransactions = useMemo(
    () => selectedUser ? transactions.filter((t) => t.user === selectedUser) : transactions,
    [selectedUser, transactions]
  );

  const lineData = useMemo(() => groupCashflow(visibleTransactions), [visibleTransactions]);
  const pieData = useMemo(
    () => groupExpenseByCategory(visibleTransactions, categories),
    [visibleTransactions, categories]
  );

  const incomeTotal = totalByType(visibleTransactions, "income");
  const expenseTotal = totalByType(visibleTransactions, "expense");
  const balance = incomeTotal - expenseTotal;

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

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="stats-grid">
        <StatCard label="Income" value={formatCurrency(incomeTotal)} tone="income" />
        <StatCard label="Expenses" value={formatCurrency(expenseTotal)} tone="expense" />
        <StatCard label="Balance" value={formatCurrency(balance)} tone={balance >= 0 ? "income" : "expense"} />
      </section>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>Income vs expense</h2>
            </div>
          </div>
          <LineChart data={lineData} />
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Breakdown</p>
              <h2>Expenses by category</h2>
            </div>
          </div>
          <PieChart data={pieData} />
        </article>
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
                value={transactionForm.category_id}
                onChange={(e) => setTransactionForm({ ...transactionForm, category_id: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {categories
                  .filter((c) => c.type === transactionForm.type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
              <input
                list="users"
                value={transactionForm.user}
                onChange={(e) => setTransactionForm({ ...transactionForm, user: e.target.value })}
                required
              />
              <datalist id="users">
                {users.map((user) => (
                  <option key={user.id} value={user.name} />
                ))}
              </datalist>
            </label>
            <label className="field field--full">
              <span>Tags</span>
              <select
                multiple
                value={transactionForm.tags}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    tags: [...e.target.selectedOptions].map((o) => o.value)
                  })
                }
              >
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.name}>{tag.name}</option>
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
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Transactions</p>
              <h2>Recent entries</h2>
            </div>
          </div>
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
                {visibleTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td className={`type-pill type-pill--${t.type}`}>{t.type}</td>
                    <td>{categories.find((c) => String(c.id) === String(t.category_id))?.name || "Unknown"}</td>
                    <td>{formatCurrency(t.amount)}</td>
                    <td>{t.user}</td>
                    <td>{t.tags.join(", ") || "-"}</td>
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
                {!visibleTransactions.length && !isLoading ? (
                  <tr>
                    <td colSpan="7" className="empty-row">No transactions found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* ── Category + Tag management ─────────────────────────────────────── */}
      <section className="workspace-grid workspace-grid--secondary">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Categories</p>
              <h2>{categoryForm.id ? "Edit category" : "Add category"}</h2>
            </div>
          </div>
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
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Tags</p>
              <h2>{tagForm.id ? "Edit tag" : "Add tag"}</h2>
            </div>
          </div>
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
        </article>
      </section>
    </div>
  );
}

export default App;
