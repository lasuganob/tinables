// =============================================================================
// CONFIG
// =============================================================================

const SPREADSHEET_ID = "12pQ-tIfYjF-nrfzxYZkRQ29Vz-JqWYFK2BeitRbIGnQ";
const APP_TIME_ZONE = "Asia/Manila";

// =============================================================================
// RESPONSE
// =============================================================================

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// =============================================================================
// SPREADSHEET ACCESS
// =============================================================================

function getSheet(sheetName) {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) throw new Error(`Missing sheet: ${sheetName}`);
  return sheet;
}

// =============================================================================
// ROW NORMALISATION
// =============================================================================

function normaliseCellValue(header, value) {
  if ((header === "date" || header === "due_date") && value instanceof Date) {
    return Utilities.formatDate(value, APP_TIME_ZONE, "yyyy-MM-dd");
  }
  return value;
}

function normaliseRow(headers, row) {
  return Object.fromEntries(
    headers.map((header, i) => [header, normaliseCellValue(header, row[i])]),
  );
}

// =============================================================================
// CRUD PRIMITIVES
// =============================================================================

function getRows(sheetName) {
  const values = getSheet(sheetName).getDataRange().getValues();
  if (values.length === 0) return [];

  const headers = values.shift();
  return values
    .filter((row) => row.join("") !== "")
    .map((row) => normaliseRow(headers, row));
}

function getRowById(sheetName, id) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return null;

  const headers = values.shift();
  const idColIndex = headers.indexOf("id");
  if (idColIndex === -1) return null;

  const row = values.find((row) => String(row[idColIndex]) === String(id));
  return row ? normaliseRow(headers, row) : null;
}

function writeRows(sheetName, rows) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = rows.map((row) =>
    headers.map((header) => (row[header] !== undefined ? row[header] : "")),
  );

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }
  if (values.length) {
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }
}

function addRow(sheetName, payload) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColIndex = headers.indexOf("id");

  let nextId = 1;
  if (idColIndex !== -1 && sheet.getLastRow() > 1) {
    const idValues = sheet
      .getRange(2, idColIndex + 1, sheet.getLastRow() - 1, 1)
      .getValues();
    const maxId = idValues.reduce((max, [val]) => {
      const n = Number(val);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    nextId = maxId + 1;
  }

  const enriched = { ...payload, id: nextId };
  const row = headers.map((h) =>
    enriched[h] !== undefined ? normaliseCellValue(h, enriched[h]) : "",
  );
  sheet.appendRow(row);
  return { success: true, id: nextId };
}

function updateRow(sheetName, payload) {
  const rows = getRows(sheetName);
  const index = rows.findIndex((row) => String(row.id) === String(payload.id));
  if (index === -1) throw new Error(`Row not found for id ${payload.id}`);

  rows[index] = { ...rows[index], ...payload };
  writeRows(sheetName, rows);
  return { success: true, id: payload.id };
}

function deleteRow(sheetName, id) {
  writeRows(
    sheetName,
    getRows(sheetName).filter((row) => String(row.id) !== String(id)),
  );
  return { success: true, id };
}

// =============================================================================
// UTILITIES
// =============================================================================

function toNumber(value) {
  const n = Number(value || 0);
  return isNaN(n) ? 0 : n;
}

function parseTransactionTags(value) {
  if (Array.isArray(value))
    return value.map((t) => String(t).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// =============================================================================
// LOOKUPS
// =============================================================================

function getAccountRowsById() {
  return Object.fromEntries(
    getRows("accounts").map((row) => [String(row.id), row]),
  );
}

function isSalaryTransactionRow(transaction) {
  if (String(transaction.type || "").toLowerCase() !== "income") return false;
  const category = getRows("categories").find(
    (row) => String(row.id) === String(transaction.category_id || ""),
  );
  return (
    String(category?.name || "")
      .trim()
      .toLowerCase() === "salary"
  );
}

// =============================================================================
// FINDERS
// =============================================================================

function findTransactionsReferencingAccount(accountId) {
  return getRows("transactions").filter(
    (row) =>
      String(row.account_id || "") === String(accountId) ||
      String(row.transfer_account_id || "") === String(accountId),
  );
}

function findTransactionsReferencingCategory(categoryId) {
  return getRows("transactions").filter(
    (row) => String(row.category_id || "") === String(categoryId),
  );
}

function findTransactionsReferencingTag(tagId) {
  return getRows("transactions").filter((row) =>
    parseTransactionTags(row.tags).some((tag) => String(tag) === String(tagId)),
  );
}

function findTransactionsAllocatedFromSalary(transactionId) {
  return getRows("transactions").filter(
    (row) =>
      String(row.source_salary_transaction_id || "") ===
      String(transactionId || ""),
  );
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateAccountDeletion(id) {
  const account = getRowById("accounts", id);
  if (!account) throw new Error(`Account not found for id ${id}`);
  if (toNumber(account.balance) !== 0)
    throw new Error("Account can only be deleted when its balance is 0.");
  if (findTransactionsReferencingAccount(id).length) {
    throw new Error(
      "Account cannot be deleted because it is referenced by transactions. Deactivate it instead.",
    );
  }
}

function validateCategoryDeletion(id) {
  if (!getRowById("categories", id))
    throw new Error(`Category not found for id ${id}`);
  if (findTransactionsReferencingCategory(id).length) {
    throw new Error(
      "Category cannot be deleted because it is used by transactions.",
    );
  }
}

function validateTagDeletion(id) {
  if (!getRowById("tags", id)) throw new Error(`Tag not found for id ${id}`);
  if (findTransactionsReferencingTag(id).length) {
    throw new Error(
      "Tag cannot be deleted because it is used by transactions.",
    );
  }
}

function validateTransactionAccountsActive(transaction, previousTransaction) {
  const accountRowsById = getAccountRowsById();

  function check(accountId, fieldName) {
    const id = String(accountId || "");
    if (!id) return;

    const account = accountRowsById[id];
    if (!account) throw new Error(`Account not found for id ${id}`);
    if (Number(account.is_active) === 1) return;

    const previousId = previousTransaction
      ? String(previousTransaction[fieldName] || "")
      : "";
    if (previousId === id) return;

    throw new Error(
      "Inactive accounts cannot be used for new transactions. Please choose an active account.",
    );
  }

  check(transaction.account_id, "account_id");
  check(transaction.transfer_account_id, "transfer_account_id");
}

function validateSufficientFunds(transaction, previousTransaction) {
  const type = String(transaction.type || "");
  if (type !== "expense" && type !== "transfer") return;

  const accountRowsById = getAccountRowsById();
  const balanceById = Object.fromEntries(
    Object.entries(accountRowsById).map(([id, row]) => [
      id,
      toNumber(row.balance),
    ]),
  );

  if (previousTransaction) {
    applyTransactionEffectToBalances(
      balanceById,
      previousTransaction,
      "reverse",
    );
  }

  const sourceId = String(transaction.account_id || "");
  const effectiveBalance = toNumber(balanceById[sourceId]);
  const required =
    type === "transfer"
      ? toNumber(transaction.amount) + toNumber(transaction.transfer_fee)
      : toNumber(transaction.amount);

  if (effectiveBalance < required) {
    throw new Error("Insufficient account balance for this transaction.");
  }
}

function validateAllocationSourceMetadata(transaction) {
  if (Number(transaction.is_salary_allocation_base || 0) !== 1) return;

  if (String(transaction.type || "").toLowerCase() !== "transfer") {
    throw new Error(
      "Only transfer transactions can be marked as an allocation base.",
    );
  }

  const sourceId = String(transaction.source_salary_transaction_id || "");
  if (!sourceId) {
    throw new Error(
      "Select the salary income linked to this allocation-base transfer.",
    );
  }

  const source = getRowById("transactions", sourceId);
  if (!source || !isSalaryTransactionRow(source)) {
    throw new Error(
      "Allocation-base transfers must reference a valid salary income transaction.",
    );
  }
}

function validateSalaryTransactionReferencesOnUpdate(
  nextTransaction,
  previousTransaction,
) {
  if (!findTransactionsAllocatedFromSalary(previousTransaction.id).length)
    return;
  if (!isSalaryTransactionRow(nextTransaction)) {
    throw new Error(
      "This salary transaction has linked allocations and cannot be changed to a non-salary transaction.",
    );
  }
}

function validateSalaryTransactionDeletion(id) {
  if (findTransactionsAllocatedFromSalary(id).length) {
    throw new Error(
      "This salary transaction has linked allocation transactions and cannot be deleted.",
    );
  }
}

// =============================================================================
// BALANCE MANAGEMENT
// =============================================================================

function applyTransactionEffectToBalances(balanceById, transaction, direction) {
  const amount = toNumber(transaction.amount);
  const fee = toNumber(transaction.transfer_fee);
  const m = direction === "reverse" ? -1 : 1;
  const type = String(transaction.type || "");

  function applyDelta(accountId, delta) {
    if (!accountId) return;
    const id = String(accountId);
    if (balanceById[id] === undefined)
      throw new Error(`Account not found for id ${id}`);
    balanceById[id] = toNumber(balanceById[id]) + delta;
  }

  if (type === "income") applyDelta(transaction.account_id, amount * m);
  else if (type === "expense") applyDelta(transaction.account_id, -amount * m);
  else if (type === "transfer") {
    applyDelta(transaction.account_id, -(amount + fee) * m);
    applyDelta(transaction.transfer_account_id, amount * m);
  }
}

function updateAccountBalancesForTransaction(transaction, direction) {
  const rows = getRows("accounts");
  const balanceById = Object.fromEntries(
    rows.map((r) => [String(r.id), toNumber(r.balance)]),
  );

  applyTransactionEffectToBalances(balanceById, transaction, direction);

  const updated = rows.map((row) => ({
    ...row,
    balance: balanceById[String(row.id)] ?? row.balance,
  }));
  writeRows("accounts", updated);
}

// =============================================================================
// TRANSACTION OPERATIONS
// =============================================================================

function addTransaction(payload) {
  validateTransactionAccountsActive(payload, null);
  validateSufficientFunds(payload);
  validateAllocationSourceMetadata(payload);
  const result = addRow("transactions", payload);
  updateAccountBalancesForTransaction({ ...payload, id: result.id }, "apply");
  return result;
}

function updateTransaction(payload) {
  const previous = getRowById("transactions", payload.id);
  if (!previous) throw new Error(`Transaction not found for id ${payload.id}`);

  const next = { ...previous, ...payload };
  validateTransactionAccountsActive(next, previous);
  validateSufficientFunds(next, previous);
  validateAllocationSourceMetadata(next);
  validateSalaryTransactionReferencesOnUpdate(next, previous);

  updateAccountBalancesForTransaction(previous, "reverse");
  const result = updateRow("transactions", payload);
  updateAccountBalancesForTransaction(next, "apply");
  return result;
}

function deleteTransaction(id) {
  const existing = getRowById("transactions", id);
  if (!existing) throw new Error(`Transaction not found for id ${id}`);

  validateSalaryTransactionDeletion(id);
  updateAccountBalancesForTransaction(existing, "reverse");
  const result = deleteRow("transactions", id);

  const historyRows = getRows("salary_allocation_history").filter(
    (row) =>
      String(row.allocated_transaction_id || "") !== String(id) &&
      String(row.source_transaction_id || "") !== String(id),
  );
  writeRows("salary_allocation_history", historyRows);
  return result;
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

function getTransactions(user) {
  const rows = getRows("transactions");
  return user ? rows.filter((row) => String(row.user) === String(user)) : rows;
}

function getAccount(account) {
  const rows = getRows("accounts");
  return account
    ? rows.filter((row) => String(row.account) === String(account))
    : rows;
}

function getSalaryAllocationItems(allocationId) {
  const rows = getRows("salary_allocation_items");
  return allocationId
    ? rows.filter((row) => String(row.allocation_id) === String(allocationId))
    : rows;
}

function getSalaryAllocationHistory(sourceTransactionId) {
  const rows = getRows("salary_allocation_history");
  return sourceTransactionId
    ? rows.filter(
        (row) =>
          String(row.source_transaction_id || "") ===
          String(sourceTransactionId),
      )
    : rows;
}

function getUpcomingPayments(user) {
  const rows = getRows("upcoming_payments");
  return user ? rows.filter((row) => String(row.user) === String(user)) : rows;
}

function markUpcomingPaymentPaid(id, status) {
  if (!getRowById("upcoming_payments", id))
    throw new Error(`Upcoming payment not found for id ${id}`);
  return updateRow("upcoming_payments", { id, status: status || "paid" });
}

// =============================================================================
// SALARY ALLOCATION ITEMS — REPLACE
// =============================================================================

function replaceSalaryAllocationItems(payload) {
  const allocationId = String(payload.allocation_id || "");
  if (!allocationId) throw new Error("Allocation id is required.");

  const existing = getRows("salary_allocation_items");
  const maxId = existing.reduce((max, row) => {
    const n = Number(row.id || 0);
    return !isNaN(n) && n > max ? n : max;
  }, 0);

  const preserved = existing.filter(
    (row) => String(row.allocation_id || "") !== allocationId,
  );

  let counter = maxId;
  const nextItems = (payload.items || []).map((item) => {
    const id = String(item.id || "").trim() || String(++counter);
    return {
      id,
      allocation_id: allocationId,
      label: String(item.label || "").trim(),
      percentage: Number(item.percentage || 0),
    };
  });

  writeRows("salary_allocation_items", [...preserved, ...nextItems]);
  return nextItems;
}

// =============================================================================
// HTTP DISPATCH
// =============================================================================

const GET_HANDLERS = {
  getTransactions: (e) => getTransactions(e.parameter.user),
  getCategories: (_) => getRows("categories"),
  getTags: (_) => getRows("tags"),
  getUsers: (_) => getRows("users"),
  getAccountTypes: (_) => getRows("account_type"),
  getAccounts: (_) => getRows("accounts"),
  getAccountById: (e) => getAccount(e.parameter.account),
  getSalaryAllocations: (_) => getRows("salary_allocations"),
  getSalaryAllocationItems: (e) =>
    getSalaryAllocationItems(e.parameter.allocation_id),
  getSalaryAllocationHistory: (e) =>
    getSalaryAllocationHistory(e.parameter.source_transaction_id),
  getUpcomingPayments: (e) => getUpcomingPayments(e.parameter.user),
};

const POST_HANDLERS = {
  addTransaction: ({ payload }) => addTransaction(payload),
  updateTransaction: ({ payload }) => updateTransaction(payload),
  deleteTransaction: ({ payload }) => deleteTransaction(payload.id),

  addCategory: ({ payload }) => addRow("categories", payload),
  updateCategory: ({ payload }) => updateRow("categories", payload),
  deleteCategory: ({ payload }) => {
    validateCategoryDeletion(payload.id);
    return deleteRow("categories", payload.id);
  },

  addTag: ({ payload }) => addRow("tags", payload),
  updateTag: ({ payload }) => updateRow("tags", payload),
  deleteTag: ({ payload }) => {
    validateTagDeletion(payload.id);
    return deleteRow("tags", payload.id);
  },

  addAccount: ({ payload }) => addRow("accounts", payload),
  updateAccount: ({ payload }) => updateRow("accounts", payload),
  deleteAccount: ({ payload }) => {
    validateAccountDeletion(payload.id);
    return deleteRow("accounts", payload.id);
  },

  addSalaryAllocation: ({ payload }) => addRow("salary_allocations", payload),
  updateSalaryAllocation: ({ payload }) =>
    updateRow("salary_allocations", payload),
  deleteSalaryAllocation: ({ payload }) =>
    deleteRow("salary_allocations", payload.id),

  addSalaryAllocationItem: ({ payload }) =>
    addRow("salary_allocation_items", payload),
  updateSalaryAllocationItem: ({ payload }) =>
    updateRow("salary_allocation_items", payload),
  deleteSalaryAllocationItem: ({ payload }) =>
    deleteRow("salary_allocation_items", payload.id),
  replaceSalaryAllocationItems: ({ payload }) =>
    replaceSalaryAllocationItems(payload),

  addSalaryAllocationHistory: ({ payload }) =>
    addRow("salary_allocation_history", payload),

  addUpcomingPayment: ({ payload }) => addRow("upcoming_payments", payload),
  updateUpcomingPayment: ({ payload }) =>
    updateRow("upcoming_payments", payload),
  deleteUpcomingPayment: ({ payload }) =>
    deleteRow("upcoming_payments", payload.id),
  markUpcomingPaymentPaid: ({ payload }) =>
    markUpcomingPaymentPaid(payload.id, payload.status),
};

function doGet(e) {
  try {
    const handler = GET_HANDLERS[e.parameter.action];
    if (!handler) return jsonResponse({ error: "Invalid action" });
    return jsonResponse(handler(e));
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const handler = POST_HANDLERS[data.action];
    if (!handler) return jsonResponse({ error: "Invalid action" });
    return jsonResponse(handler(data));
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}
