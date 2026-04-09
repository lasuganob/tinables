const SPREADSHEET_ID = "12pQ-tIfYjF-nrfzxYZkRQ29Vz-JqWYFK2BeitRbIGnQ";
const APP_TIME_ZONE = "Asia/Manila";

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Missing sheet: ${sheetName}`);
  return sheet;
}

function normaliseCellValue(header, value) {
  if ((header === "date" || header === "due_date") && value instanceof Date) {
    return Utilities.formatDate(value, APP_TIME_ZONE, "yyyy-MM-dd");
  }

  return value;
}

function normaliseRow(headers, row) {
  var item = {};

  headers.forEach(function (header, index) {
    item[header] = normaliseCellValue(header, row[index]);
  });

  return item;
}

function getRows(sheetName) {
  var sheet = getSheet(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) {
    return [];
  }

  var headers = values.shift();
  return values
    .filter(function (row) {
      return row.join("") !== "";
    })
    .map(function (row) {
      return normaliseRow(headers, row);
    });
}

function getRowById(sheetName, id) {
  var sheet = getSheet(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) return null;

  var headers = values.shift();
  var idColIndex = headers.indexOf("id");
  if (idColIndex === -1) return null;

  var row = values.find(function (row) {
    return String(row[idColIndex]) === String(id);
  });

  if (!row) return null;

  return normaliseRow(headers, row);
}

function writeRows(sheetName, rows) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var nextValues = rows.map(function (row) {
    return headers.map(function (header) {
      return row[header] !== undefined ? row[header] : "";
    });
  });

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  if (nextValues.length) {
    sheet
      .getRange(2, 1, nextValues.length, headers.length)
      .setValues(nextValues);
  }
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (!values.length) return json([]);

  const headers = values.shift();
  const result = values
    .filter((row) => row.join("") !== "")
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    });

  return json(result);
}

function addRow(sheetName, payload) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Auto-increment
  var idColIndex = headers.indexOf("id");
  var nextId = 1;

  if (idColIndex !== -1) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      // Has data rows beyond the header
      var idValues = sheet
        .getRange(2, idColIndex + 1, lastRow - 1, 1)
        .getValues();
      var maxId = idValues.reduce(function (max, row) {
        var val = Number(row[0]);
        return !isNaN(val) && val > max ? val : max;
      }, 0);
      nextId = maxId + 1;
    }
  }

  payload.id = nextId;

  var row = headers.map(function (header) {
    return payload[header] !== undefined
      ? normaliseCellValue(header, payload[header])
      : "";
  });
  sheet.appendRow(row);
  return { success: true, id: payload.id };
}

function updateRow(sheetName, payload) {
  var rows = getRows(sheetName);
  var index = rows.findIndex(function (row) {
    return String(row.id) === String(payload.id);
  });

  if (index === -1) {
    throw new Error("Row not found for id " + payload.id);
  }

  rows[index] = Object.assign({}, rows[index], payload);
  writeRows(sheetName, rows);
  return { success: true, id: payload.id };
}

function deleteRow(sheetName, id) {
  var rows = getRows(sheetName).filter(function (row) {
    return String(row.id) !== String(id);
  });
  writeRows(sheetName, rows);
  return { success: true, id: id };
}

function toNumber(value) {
  var parsed = Number(value || 0);
  return isNaN(parsed) ? 0 : parsed;
}

function getAccountRowsById() {
  var rows = getRows("accounts");
  var byId = {};

  rows.forEach(function(row) {
    byId[String(row.id)] = row;
  });

  return byId;
}

function findTransactionsReferencingAccount(accountId) {
  return getRows("transactions").filter(function(row) {
    return (
      String(row.account_id || "") === String(accountId) ||
      String(row.transfer_account_id || "") === String(accountId)
    );
  });
}

function findTransactionsReferencingCategory(categoryId) {
  return getRows("transactions").filter(function(row) {
    return String(row.category_id || "") === String(categoryId);
  });
}

function findTransactionsAllocatedFromSalary(transactionId) {
  return getRows("transactions").filter(function(row) {
    return String(row.source_salary_transaction_id || "") === String(transactionId || "");
  });
}

function isSalaryTransactionRow(transaction) {
  if (String(transaction.type || "").toLowerCase() !== "income") {
    return false;
  }

  var categories = getRows("categories");
  var category = categories.find(function(row) {
    return String(row.id) === String(transaction.category_id || "");
  });

  return String(category && category.name || "").trim().toLowerCase() === "salary";
}

function parseTransactionTags(value) {
  if (Array.isArray(value)) {
    return value.map(function(tag) {
      return String(tag).trim();
    }).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map(function(tag) {
      return tag.trim();
    })
    .filter(Boolean);
}

function findTransactionsReferencingTag(tagId) {
  return getRows("transactions").filter(function(row) {
    return parseTransactionTags(row.tags).some(function(tag) {
      return String(tag) === String(tagId);
    });
  });
}

function validateTransactionAccountsActive(transaction, previousTransaction) {
  var accountRowsById = getAccountRowsById();

  function validateAccount(accountId, fieldName) {
    var normalizedId = String(accountId || "");

    if (!normalizedId) {
      return;
    }

    var account = accountRowsById[normalizedId];

    if (!account) {
      throw new Error("Account not found for id " + normalizedId);
    }

    if (Number(account.is_active) === 1) {
      return;
    }

    var previousAccountId = previousTransaction
      ? String(previousTransaction[fieldName] || "")
      : "";

    if (previousAccountId === normalizedId) {
      return;
    }

    throw new Error(
      'Inactive accounts cannot be used for new transactions. Please choose an active account.'
    );
  }

  validateAccount(transaction.account_id, "account_id");
  validateAccount(transaction.transfer_account_id, "transfer_account_id");
}

function validateAccountDeletion(id) {
  var account = getRowById("accounts", id);

  if (!account) {
    throw new Error("Account not found for id " + id);
  }

  if (toNumber(account.balance) !== 0) {
    throw new Error("Account can only be deleted when its balance is 0.");
  }

  if (findTransactionsReferencingAccount(id).length) {
    throw new Error("Account cannot be deleted because it is referenced by transactions. Deactivate it instead.");
  }
}

function validateCategoryDeletion(id) {
  var category = getRowById("categories", id);

  if (!category) {
    throw new Error("Category not found for id " + id);
  }

  if (findTransactionsReferencingCategory(id).length) {
    throw new Error("Category cannot be deleted because it is used by transactions.");
  }
}

function validateTagDeletion(id) {
  var tag = getRowById("tags", id);

  if (!tag) {
    throw new Error("Tag not found for id " + id);
  }

  if (findTransactionsReferencingTag(id).length) {
    throw new Error("Tag cannot be deleted because it is used by transactions.");
  }
}

function validateSalaryTransactionReferencesOnUpdate(nextTransaction, previousTransaction) {
  var linkedTransactions = findTransactionsAllocatedFromSalary(previousTransaction.id);

  if (!linkedTransactions.length) {
    return;
  }

  if (!isSalaryTransactionRow(nextTransaction)) {
    throw new Error("This salary transaction has linked allocations and cannot be changed to a non-salary transaction.");
  }
}

function validateSalaryTransactionDeletion(id) {
  if (findTransactionsAllocatedFromSalary(id).length) {
    throw new Error("This salary transaction has linked allocation transactions and cannot be deleted.");
  }
}

function validateAllocationSourceMetadata(transaction) {
  var isAllocationBase = Number(transaction.is_salary_allocation_base || 0) === 1;
  var sourceTransactionId = String(transaction.source_salary_transaction_id || "");

  if (!isAllocationBase) {
    return;
  }

  if (String(transaction.type || "").toLowerCase() !== "transfer") {
    throw new Error("Only transfer transactions can be marked as an allocation base.");
  }

  if (!sourceTransactionId) {
    throw new Error("Select the salary income linked to this allocation-base transfer.");
  }

  var sourceTransaction = getRowById("transactions", sourceTransactionId);

  if (!sourceTransaction || !isSalaryTransactionRow(sourceTransaction)) {
    throw new Error("Allocation-base transfers must reference a valid salary income transaction.");
  }
}

function getAccountBalance(accountRowsById, accountId) {
  if (!accountId) {
    return 0;
  }

  var account = accountRowsById[String(accountId)];
  if (!account) {
    throw new Error("Account not found for id " + accountId);
  }

  return toNumber(account.balance);
}

function applyTransactionEffectToBalances(balanceById, transaction, direction) {
  var amount = toNumber(transaction.amount);
  var transferFee = toNumber(transaction.transfer_fee);
  var multiplier = direction === "reverse" ? -1 : 1;
  var type = String(transaction.type || "");

  function applyDelta(accountId, delta) {
    if (!accountId) {
      return;
    }

    if (balanceById[String(accountId)] === undefined) {
      throw new Error("Account not found for id " + accountId);
    }

    balanceById[String(accountId)] = toNumber(balanceById[String(accountId)]) + delta;
  }

  if (type === "income") {
    applyDelta(transaction.account_id, amount * multiplier);
  } else if (type === "expense") {
    applyDelta(transaction.account_id, -amount * multiplier);
  } else if (type === "transfer") {
    applyDelta(transaction.account_id, -(amount + transferFee) * multiplier);
    applyDelta(transaction.transfer_account_id, amount * multiplier);
  }
}

function validateSufficientFunds(transaction, previousTransaction) {
  var type = String(transaction.type || "");

  if (type !== "expense" && type !== "transfer") {
    return;
  }

  var accountRowsById = getAccountRowsById();
  var balanceById = {};

  Object.keys(accountRowsById).forEach(function(accountId) {
    balanceById[accountId] = toNumber(accountRowsById[accountId].balance);
  });

  if (previousTransaction) {
    applyTransactionEffectToBalances(balanceById, previousTransaction, "reverse");
  }

  var sourceAccountId = String(transaction.account_id || "");
  var sourceBalance = getAccountBalance(accountRowsById, sourceAccountId);
  var effectiveSourceBalance =
    balanceById[sourceAccountId] !== undefined
      ? toNumber(balanceById[sourceAccountId])
      : sourceBalance;

  var requiredAmount =
    type === "transfer"
      ? toNumber(transaction.amount) + toNumber(transaction.transfer_fee)
      : toNumber(transaction.amount);

  if (effectiveSourceBalance < requiredAmount) {
    throw new Error("Insufficient account balance for this transaction.");
  }
}

function updateAccountBalancesForTransaction(transaction, direction) {
  var accountRows = getRows("accounts");
  var amount = toNumber(transaction.amount);
  var transferFee = toNumber(transaction.transfer_fee);
  var multiplier = direction === "reverse" ? -1 : 1;
  var type = String(transaction.type || "");

  function applyDelta(accountId, delta) {
    if (!accountId) {
      return;
    }

    var index = accountRows.findIndex(function (row) {
      return String(row.id) === String(accountId);
    });

    if (index === -1) {
      throw new Error("Account not found for id " + accountId);
    }

    accountRows[index].balance = toNumber(accountRows[index].balance) + delta;
  }

  if (type === "income") {
    applyDelta(transaction.account_id, amount * multiplier);
  } else if (type === "expense") {
    applyDelta(transaction.account_id, -amount * multiplier);
  } else if (type === "transfer") {
    applyDelta(transaction.account_id, -(amount + transferFee) * multiplier);
    applyDelta(transaction.transfer_account_id, amount * multiplier);
  }

  writeRows("accounts", accountRows);
}

function addTransaction(payload) {
  validateTransactionAccountsActive(payload, null);
  validateSufficientFunds(payload);
  validateAllocationSourceMetadata(payload);
  var result = addRow("transactions", payload);
  var storedTransaction = Object.assign({}, payload, { id: result.id });
  updateAccountBalancesForTransaction(storedTransaction, "apply");
  return result;
}

function updateTransaction(payload) {
  var previousTransaction = getRowById("transactions", payload.id);

  if (!previousTransaction) {
    throw new Error("Transaction not found for id " + payload.id);
  }

  validateTransactionAccountsActive(payload, previousTransaction);
  validateSufficientFunds(payload, previousTransaction);
  validateAllocationSourceMetadata(Object.assign({}, previousTransaction, payload));
  validateSalaryTransactionReferencesOnUpdate(
    Object.assign({}, previousTransaction, payload),
    previousTransaction
  );
  updateAccountBalancesForTransaction(previousTransaction, "reverse");
  var result = updateRow("transactions", payload);
  var nextTransaction = Object.assign({}, previousTransaction, payload);
  updateAccountBalancesForTransaction(nextTransaction, "apply");
  return result;
}

function deleteTransaction(id) {
  var existingTransaction = getRowById("transactions", id);

  if (!existingTransaction) {
    throw new Error("Transaction not found for id " + id);
  }

  validateSalaryTransactionDeletion(id);
  updateAccountBalancesForTransaction(existingTransaction, "reverse");
  var result = deleteRow("transactions", id);
  var historyRows = getRows("salary_allocation_history").filter(function(row) {
    return (
      String(row.allocated_transaction_id || "") !== String(id) &&
      String(row.source_transaction_id || "") !== String(id)
    );
  });
  writeRows("salary_allocation_history", historyRows);
  return result;
}

function getTransactions(user) {
  var rows = getRows("transactions");
  if (user) {
    rows = rows.filter(function (row) {
      return String(row.user) === String(user);
    });
  }
  return rows;
}

function getAccount(account) {
  var rows = getRows("accounts");
  if (account) {
    rows = rows.filter(function (row) {
      return String(row.account) === String(account);
    });
  }
  return rows;
}

function getSalaryAllocations(user) {
  return getRows("salary_allocations");
}

function getSalaryAllocationItems(allocationId) {
  var rows = getRows("salary_allocation_items");
  if (allocationId) {
    rows = rows.filter(function (row) {
      return String(row.allocation_id) === String(allocationId);
    });
  }
  return rows;
}

function replaceSalaryAllocationItems(payload) {
  var allocationId = String(payload.allocation_id || "");
  var items = payload.items || [];

  if (!allocationId) {
    throw new Error("Allocation id is required.");
  }

  var rows = getRows("salary_allocation_items");
  var maxId = rows.reduce(function(max, row) {
    var value = Number(row.id || 0);
    return !isNaN(value) && value > max ? value : max;
  }, 0);

  var preservedRows = rows.filter(function(row) {
    return String(row.allocation_id || "") !== allocationId;
  });

  var nextItems = items.map(function(item) {
    var nextId = String(item.id || "").trim();

    if (!nextId) {
      maxId += 1;
      nextId = String(maxId);
    }

    return {
      id: nextId,
      allocation_id: allocationId,
      label: String(item.label || "").trim(),
      percentage: Number(item.percentage || 0)
    };
  });

  writeRows("salary_allocation_items", preservedRows.concat(nextItems));
  return nextItems;
}

function getSalaryAllocationHistory(sourceTransactionId) {
  var rows = getRows("salary_allocation_history");
  if (sourceTransactionId) {
    rows = rows.filter(function (row) {
      return String(row.source_transaction_id || "") === String(sourceTransactionId);
    });
  }
  return rows;
}

function getUpcomingPayments(user) {
  var rows = getRows("upcoming_payments");
  if (user) {
    rows = rows.filter(function (row) {
      return String(row.user) === String(user);
    });
  }
  return rows;
}

function markUpcomingPaymentPaid(id, status) {
  var payment = getRowById("upcoming_payments", id);

  if (!payment) {
    throw new Error("Upcoming payment not found for id " + id);
  }

  return updateRow("upcoming_payments", {
    id: id,
    status: status || "paid"
  });
}

function doGet(e) {
  try {
    var action = e.parameter.action;

    if (action === "getTransactions") {
      return jsonResponse(getTransactions(e.parameter.user));
    }
    if (action === "getCategories") {
      return jsonResponse(getRows("categories"));
    }
    if (action === "getTags") {
      return jsonResponse(getRows("tags"));
    }
    if (action === "getUsers") {
      return jsonResponse(getRows("users"));
    }
    if (action === "getAccountTypes") {
      return jsonResponse(getRows("account_type"));
    }
    if (action === "getAccounts") {
      return jsonResponse(getRows("accounts"));
    }
    if (action === "getAccountById") {
      return jsonResponse(getAccount(e.parameter.account));
    }
    if (action === "getSalaryAllocations") {
      return jsonResponse(getSalaryAllocations(e.parameter.user));
    }
    if (action === "getSalaryAllocationItems") {
      return jsonResponse(getSalaryAllocationItems(e.parameter.allocation_id));
    }
    if (action === "getSalaryAllocationHistory") {
      return jsonResponse(getSalaryAllocationHistory(e.parameter.source_transaction_id));
    }
    if (action === "getUpcomingPayments") {
      return jsonResponse(getUpcomingPayments(e.parameter.user));
    }

    return jsonResponse({ error: "Invalid action" });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || "{}");
    var action = data.action;
    var payload = data.payload || {};

    if (action === "addTransaction") {
      return jsonResponse(addTransaction(payload));
    }
    if (action === "updateTransaction") {
      return jsonResponse(updateTransaction(payload));
    }
    if (action === "deleteTransaction") {
      return jsonResponse(deleteTransaction(payload.id));
    }
    if (action === "addCategory") {
      return jsonResponse(addRow("categories", payload));
    }
    if (action === "updateCategory") {
      return jsonResponse(updateRow("categories", payload));
    }
    if (action === "deleteCategory") {
      validateCategoryDeletion(payload.id);
      return jsonResponse(deleteRow("categories", payload.id));
    }
    if (action === "addTag") {
      return jsonResponse(addRow("tags", payload));
    }
    if (action === "updateTag") {
      return jsonResponse(updateRow("tags", payload));
    }
    if (action === "deleteTag") {
      validateTagDeletion(payload.id);
      return jsonResponse(deleteRow("tags", payload.id));
    }
    if (action === "addAccount") {
      return jsonResponse(addRow("accounts", payload));
    }
    if (action === "updateAccount") {
      return jsonResponse(updateRow("accounts", payload));
    }
    if (action === "deleteAccount") {
      validateAccountDeletion(payload.id);
      return jsonResponse(deleteRow("accounts", payload.id));
    }
    if (action === "addSalaryAllocation") {
      return jsonResponse(addRow("salary_allocations", payload));
    }
    if (action === "updateSalaryAllocation") {
      return jsonResponse(updateRow("salary_allocations", payload));
    }
    if (action === "deleteSalaryAllocation") {
      return jsonResponse(deleteRow("salary_allocations", payload.id));
    }
    if (action === "addSalaryAllocationItem") {
      return jsonResponse(addRow("salary_allocation_items", payload));
    }
    if (action === "updateSalaryAllocationItem") {
      return jsonResponse(updateRow("salary_allocation_items", payload));
    }
    if (action === "deleteSalaryAllocationItem") {
      return jsonResponse(deleteRow("salary_allocation_items", payload.id));
    }
    if (action === "replaceSalaryAllocationItems") {
      return jsonResponse(replaceSalaryAllocationItems(payload));
    }
    if (action === "addSalaryAllocationHistory") {
      return jsonResponse(addRow("salary_allocation_history", payload));
    }
    if (action === "addUpcomingPayment") {
      return jsonResponse(addRow("upcoming_payments", payload));
    }
    if (action === "updateUpcomingPayment") {
      return jsonResponse(updateRow("upcoming_payments", payload));
    }
    if (action === "deleteUpcomingPayment") {
      return jsonResponse(deleteRow("upcoming_payments", payload.id));
    }
    if (action === "markUpcomingPaymentPaid") {
      return jsonResponse(markUpcomingPaymentPaid(payload.id, payload.status));
    }

    return jsonResponse({ error: "Invalid action" });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
