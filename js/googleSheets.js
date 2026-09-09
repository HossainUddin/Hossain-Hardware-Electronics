// ==========================================================================
// HOSSAIN HARDWARE - GOOGLE SHEETS APPS SCRIPT API ENGINE
// ==========================================================================
//
// GOOGLE APPS SCRIPT BACKEND CODE (Copy & Paste into Extensions -> Apps Script in your Google Sheet):

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var payload = contents.payload;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    function getSheet(sheetName, headers) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        if (headers && headers.length > 0) {
          sheet.appendRow(headers);
          sheet
            .getRange(1, 1, 1, headers.length)
            .setFontWeight("bold")
            .setBackground("#1E3A8A")
            .setFontColor("#FFFFFF");
        }
      }
      return sheet;
    }

    if (action === "SYNC_CATEGORIES") {
      var sheet = getSheet("Categories", ["Category Name", "Last Synced Date"]);
      sheet.clearContents();
      var now = new Date().toLocaleString();
      var data = [["Category Name", "Last Synced Date"]];
      if (Array.isArray(payload)) {
        payload.forEach(function (cat) {
          data.push([cat, now]);
        });
      }
      sheet.getRange(1, 1, data.length, 2).setValues(data);
      sheet
        .getRange(1, 1, 1, 2)
        .setFontWeight("bold")
        .setBackground("#1E3A8A")
        .setFontColor("#FFFFFF");
    }

    if (action === "SYNC_SUPPLIERS") {
      var sheet = getSheet("Suppliers", [
        "Supplier Name",
        "Contact Phone",
        "Address",
        "Last Synced Date",
      ]);
      sheet.clearContents();
      var now = new Date().toLocaleString();
      var data = [
        ["Supplier Name", "Contact Phone", "Address", "Last Synced Date"],
      ];
      if (Array.isArray(payload)) {
        payload.forEach(function (supp) {
          if (typeof supp === "string") {
            data.push([supp, "-", "-", now]);
          } else {
            data.push([
              supp.name || supp,
              supp.phone || "-",
              supp.address || "-",
              now,
            ]);
          }
        });
      }
      sheet.getRange(1, 1, data.length, 4).setValues(data);
      sheet
        .getRange(1, 1, 1, 4)
        .setFontWeight("bold")
        .setBackground("#1E3A8A")
        .setFontColor("#FFFFFF");
    }

    if (action === "SYNC_PRODUCTS") {
      var sheet = getSheet("Products", [
        "ID",
        "Name",
        "Category",
        "Brand",
        "Supplier",
        "Buying Price",
        "Selling Price",
        "Stock",
        "Unit",
      ]);
      sheet.clearContents();
      var data = [
        [
          "ID",
          "Name",
          "Category",
          "Brand",
          "Supplier",
          "Buying Price",
          "Selling Price",
          "Stock",
          "Unit",
        ],
      ];
      if (Array.isArray(payload)) {
        payload.forEach(function (p) {
          data.push([
            p.id,
            p.name,
            p.category,
            p.brand,
            p.supplier || "-",
            p.buyingPrice,
            p.sellingPrice,
            p.stock,
            p.unit,
          ]);
        });
      }
      sheet.getRange(1, 1, data.length, 9).setValues(data);
      sheet
        .getRange(1, 1, 1, 9)
        .setFontWeight("bold")
        .setBackground("#1E3A8A")
        .setFontColor("#FFFFFF");
    }

    if (action === "SYNC_SALE") {
      var sheet = getSheet("Sales", [
        "Invoice ID",
        "Date",
        "Customer",
        "Subtotal",
        "Discount",
        "Total",
        "Profit",
      ]);
      sheet.appendRow([
        payload.invoiceId,
        payload.date,
        payload.customer,
        payload.subtotal,
        payload.discount,
        payload.total,
        payload.profit,
      ]);
    }

    if (action === "SYNC_SALES") {
      var sheet = getSheet("Sales", [
        "Invoice ID",
        "Date",
        "Customer",
        "Subtotal",
        "Discount",
        "Total",
        "Profit",
      ]);
      sheet.clearContents();
      var data = [
        [
          "Invoice ID",
          "Date",
          "Customer",
          "Subtotal",
          "Discount",
          "Total",
          "Profit",
        ],
      ];
      if (Array.isArray(payload)) {
        payload.forEach(function (s) {
          data.push([
            s.invoiceId,
            s.date,
            s.customer,
            s.subtotal,
            s.discount,
            s.total,
            s.profit,
          ]);
        });
      }
      sheet.getRange(1, 1, data.length, 7).setValues(data);
      sheet
        .getRange(1, 1, 1, 7)
        .setFontWeight("bold")
        .setBackground("#1E3A8A")
        .setFontColor("#FFFFFF");
    }

    if (action === "SYNC_EXPENSE") {
      var sheet = getSheet("Expenses", [
        "ID",
        "Date",
        "Category",
        "Notes",
        "Amount",
      ]);
      sheet.appendRow([
        payload.id,
        payload.date,
        payload.category,
        payload.notes || "-",
        payload.amount,
      ]);
    }

    if (action === "SYNC_PURCHASE") {
      var sheet = getSheet("Purchases", [
        "Date",
        "Supplier",
        "Product ID",
        "Product Name",
        "Qty Added",
        "Buying Price",
      ]);
      sheet.appendRow([
        payload.date,
        payload.supplier,
        payload.productId,
        payload.productName,
        payload.qty,
        payload.buyingPrice,
      ]);
    }

    if (action === "SYNC_ALL") {
      if (payload.categories)
        doPost({
          postData: {
            contents: JSON.stringify({
              action: "SYNC_CATEGORIES",
              payload: payload.categories,
            }),
          },
        });
      if (payload.suppliers)
        doPost({
          postData: {
            contents: JSON.stringify({
              action: "SYNC_SUPPLIERS",
              payload: payload.suppliers,
            }),
          },
        });
      if (payload.products)
        doPost({
          postData: {
            contents: JSON.stringify({
              action: "SYNC_PRODUCTS",
              payload: payload.products,
            }),
          },
        });
      if (payload.sales)
        doPost({
          postData: {
            contents: JSON.stringify({
              action: "SYNC_SALES",
              payload: payload.sales,
            }),
          },
        });
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
// ==========================================================================

// ==========================================================================
// Browser-Only API Code
// This block will be ignored when you paste this file into Google Apps Script
// ==========================================================================

if (typeof window !== "undefined") {
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyIrFZx5wl-L1TYIE6_16Xt2NIRz87YgRVFZ-J7zTVmhh39We1gzaEwDI5B2bVC1kwZjg/exec";

  const GoogleSheetsAPI = {
    getScriptUrl() {
      // Always prefer the saved URL; fall back to the hardcoded one
      return localStorage.getItem("hossain_gs_url") || GOOGLE_SCRIPT_URL;
    },

    setScriptUrl(url) {
      localStorage.setItem("hossain_gs_url", url);
    },

    isEnabled() {
      const toggle = document.getElementById("autoSyncToggle");
      return toggle ? toggle.checked : true;
    },

    // Send a single action with a data payload to the Apps Script Web App
    async syncData(action, payload) {
      const url = this.getScriptUrl();
      if (!url) {
        console.warn("Google Sheets API: No Web App URL configured.");
        return { success: false, reason: "no_url" };
      }

      try {
        // Google Apps Script requires a GET or no-CORS POST.
        // Use fetch with no-cors so the browser doesn't block the request.
        // (Response will be opaque, but the script still runs.)
        await fetch(url, {
          method: "POST",
          mode: "no-cors",
          keepalive: true,
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action,
            payload,
            timestamp: new Date().toISOString(),
          }),
        });
        // With no-cors the response is opaque — treat as success
        return { success: true };
      } catch (err) {
        console.error("Google Sheets Sync Failed:", err);
        return { success: false, error: err.message };
      }
    },

    // Convenience: auto-sync only when the toggle is on
    async autoSync(action, payload) {
      if (!this.isEnabled()) return;
      return this.syncData(action, payload);
    },
  };

  window.GoogleSheetsAPI = GoogleSheetsAPI;
}
