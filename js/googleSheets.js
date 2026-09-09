// ==========================================================================
// HOSSAIN HARDWARE - GOOGLE SHEETS APPS SCRIPT API ENGINE
// ==========================================================================
//
// GOOGLE APPS SCRIPT BACKEND CODE (Copy & Paste into Extensions -> Apps Script in your Google Sheet):

// ── READ ALL DATA BACK (used for loading on new devices/mobile) ──
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    function sheetToObjects(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      var rows = sheet.getDataRange().getValues();
      if (rows.length < 2) return [];
      var headers = rows[0];
      return rows.slice(1).map(function (row) {
        var obj = {};
        headers.forEach(function (h, i) {
          obj[h] = row[i];
        });
        return obj;
      });
    }

    var rawProducts = sheetToObjects("Products");
    var products = rawProducts
      .map(function (p) {
        return {
          id: String(p["ID"] || ""),
          name: String(p["Name"] || ""),
          category: String(p["Category"] || "Unknown Category"),
          brand: String(p["Brand"] || "Unknown Brand"),
          supplier: String(p["Supplier"] || "Unknown Supplier"),
          buyingPrice: parseFloat(p["Buying Price"]) || 0,
          sellingPrice: parseFloat(p["Selling Price"]) || 0,
          stock: parseInt(p["Stock"]) || 0,
          unit: String(p["Unit"] || "Pcs"),
          image: String(p["Image"] || ""),
          description: String(p["Description"] || ""),
        };
      })
      .filter(function (p) {
        return p.id !== "";
      });

    var rawCats = sheetToObjects("Categories");
    var categories = rawCats
      .map(function (c) {
        return String(c["Category Name"] || "");
      })
      .filter(Boolean);

    var rawSupp = sheetToObjects("Suppliers");
    var suppliers = rawSupp
      .map(function (s) {
        return {
          name: String(s["Supplier Name"] || ""),
          phone: String(s["Contact Phone"] || "-"),
          address: String(s["Address"] || "-"),
        };
      })
      .filter(function (s) {
        return s.name !== "";
      });

    var rawSales = sheetToObjects("Sales");
    var sales = rawSales
      .map(function (s) {
        return {
          invoiceId: String(s["Invoice ID"] || ""),
          date: String(s["Date"] || ""),
          customer: String(s["Customer"] || ""),
          subtotal: parseFloat(s["Subtotal"]) || 0,
          discount: parseFloat(s["Discount"]) || 0,
          total: parseFloat(s["Total"]) || 0,
          profit: parseFloat(s["Profit"]) || 0,
          items: [],
        };
      })
      .filter(function (s) {
        return s.invoiceId !== "";
      });

    var rawExp = sheetToObjects("Expenses");
    var expenses = rawExp
      .map(function (e) {
        return {
          id: parseInt(e["ID"]) || Date.now(),
          date: String(e["Date"] || ""),
          category: String(e["Category"] || ""),
          notes: String(e["Notes"] || ""),
          amount: parseFloat(e["Amount"]) || 0,
        };
      })
      .filter(function (e) {
        return e.date !== "";
      });

    var rawPur = sheetToObjects("Purchases");
    var purchases = rawPur
      .map(function (p) {
        return {
          date: String(p["Date"] || ""),
          supplier: String(p["Supplier"] || ""),
          productId: String(p["Product ID"] || ""),
          productName: String(p["Product Name"] || ""),
          qty: parseInt(p["Qty Added"]) || 0,
          buyingPrice: parseFloat(p["Buying Price"]) || 0,
        };
      })
      .filter(function (p) {
        return p.date !== "";
      });

    var result = {
      success: true,
      products: products,
      categories: categories,
      suppliers: suppliers,
      sales: sales,
      expenses: expenses,
      purchases: purchases,
    };

    // Support JSONP: if ?callback=xyz is passed, wrap response in xyz(...)
    var callback = e && e.parameter && e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(
        callback + "(" + JSON.stringify(result) + ")",
      ).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    var errResult = JSON.stringify({ success: false, error: err.toString() });
    var callback = e && e.parameter && e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(
        callback + "(" + errResult + ")",
      ).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(errResult).setMimeType(
      ContentService.MimeType.JSON,
    );
  }
}

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
    "https://script.google.com/macros/s/AKfycbwz1Bi8UhJeShuPIUJYkv9TgjI6Bf4juNqTnhY-CAtjUGAmxCfD7jmryXHNf3LGSCDTPg/exec";

  const GoogleSheetsAPI = {
    getScriptUrl() {
      // Always prefer the saved URL; fall back to the hardcoded one
      // .trim() removes any accidental spaces/newlines
      const stored = localStorage.getItem("hossain_gs_url");
      return stored ? stored.trim() : GOOGLE_SCRIPT_URL.trim();
    },

    setScriptUrl(url) {
      localStorage.setItem("hossain_gs_url", url.trim());
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
        // Google Apps Script requires no-cors POST.
        // Response will be opaque, but the script still runs server-side.
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

    // Fetch ALL data back from Google Sheets (used on new devices/mobile)
    // Uses JSONP (script-tag injection) because Google Apps Script doGet
    // does NOT send CORS headers — a regular fetch() will be blocked on mobile.
    fetchAllData() {
      return new Promise((resolve) => {
        const url = this.getScriptUrl();
        if (!url) {
          resolve(null);
          return;
        }

        // Unique callback name to avoid collisions
        const cbName = "__gsCallback_" + Date.now();
        let settled = false;

        // Timeout: if no response in 15 seconds, give up
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          console.warn("Cloud fetch timed out after 15s");
          resolve(null);
        }, 15000);

        function cleanup() {
          clearTimeout(timer);
          delete window[cbName];
          const el = document.getElementById("__gs_jsonp_script");
          if (el) el.remove();
        }

        // Google will call window[cbName](data) when the script loads
        window[cbName] = function (data) {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(data && data.success ? data : null);
        };

        // Inject a <script> tag — this bypasses CORS entirely
        const script = document.createElement("script");
        script.id = "__gs_jsonp_script";
        script.onerror = function () {
          if (settled) return;
          settled = true;
          cleanup();
          console.warn("JSONP script load failed");
          resolve(null);
        };
        // Append ?callback=cbName so Apps Script wraps the JSON in a function call
        script.src = url + "?callback=" + cbName + "&t=" + Date.now();
        document.head.appendChild(script);
      });
    },
  };

  window.GoogleSheetsAPI = GoogleSheetsAPI;
}
