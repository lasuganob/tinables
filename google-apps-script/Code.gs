var SPREADSHEET_ID = "REPLACE_WITH_YOUR_SPREADSHEET_ID";

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "REPLACE_WITH_YOUR_SPREADSHEET_ID") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error(
      "Spreadsheet not found. Set SPREADSHEET_ID in Code.gs or bind the script to the target sheet."
    );
  }
  return active;
}

function getSheet(sheetName) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }
  return sheet;
}

function getRows(sheetName) {
  var sheet = getSheet(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) {
    return [];
  }

  var headers = values.shift();
  return values
    .filter(function(row) {
      return row.join("") !== "";
    })
    .map(function(row) {
      var item = {};
      headers.forEach(function(header, index) {
        item[header] = row[index];
      });
      return item;
    });
}

function writeRows(sheetName, rows) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var nextValues = rows.map(function(row) {
    return headers.map(function(header) {
      return row[header] !== undefined ? row[header] : "";
    });
  });

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  if (nextValues.length) {
    sheet.getRange(2, 1, nextValues.length, headers.length).setValues(nextValues);
  }
}

function addRow(sheetName, payload) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(header) {
    return payload[header] !== undefined ? payload[header] : "";
  });
  sheet.appendRow(row);
  return { success: true, id: payload.id };
}

function deleteRow(sheetName, id) {
  var rows = getRows(sheetName).filter(function(row) {
    return String(row.id) !== String(id);
  });
  writeRows(sheetName, rows);
  return { success: true, id: id };
}

function updateRow(sheetName, payload) {
  var rows = getRows(sheetName);
  var index = rows.findIndex(function(row) {
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
  var rows = getRows(sheetName).filter(function(row) {
    return String(row.id) !== String(id);
  });
  writeRows(sheetName, rows);
  return { success: true, id: id };
}

function getTransactions(user) {
  var rows = getRows("transactions");
  if (user) {
    rows = rows.filter(function(row) {
      return String(row.user) === String(user);
    });
  }
  return rows;
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
      return jsonResponse(addRow("transactions", payload));
    }
    if (action === "updateTransaction") {
      return jsonResponse(updateRow("transactions", payload));
    }
    if (action === "deleteTransaction") {
      return jsonResponse(deleteRow("transactions", payload.id));
    }
    if (action === "addCategory") {
      return jsonResponse(addRow("categories", payload));
    }
    if (action === "updateCategory") {
      return jsonResponse(updateRow("categories", payload));
    }
    if (action === "deleteCategory") {
      return jsonResponse(deleteRow("categories", payload.id));
    }
    if (action === "addTag") {
      return jsonResponse(addRow("tags", payload));
    }
    if (action === "updateTag") {
      return jsonResponse(updateRow("tags", payload));
    }
    if (action === "deleteTag") {
      return jsonResponse(deleteRow("tags", payload.id));
    }

    return jsonResponse({ error: "Invalid action" });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
