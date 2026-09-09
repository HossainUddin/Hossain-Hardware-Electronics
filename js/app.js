/* ==========================================================================
   HOSSAIN HARDWARE & ELECTRONICS - INVENTORY & POS SYSTEM ENGINE
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Seed Product Catalog (empty by default)
  const INITIAL_PRODUCTS = [];

  const DEFAULT_CATEGORIES = [
    "Power Tools",
    "Hand Tools",
    "Electronics",
    "Fasteners",
    "Wiring & Cable",
    "Safety Gear",
  ];

  const DEFAULT_SUPPLIERS = [
    { name: "Demo Supplier", phone: "-", address: "-" },
  ];

  // Persistent Data State (Cloud Only)
  let DB = {
    products: [],
    categories: [],
    suppliers: [],
    sales: [],
    purchases: [],
    expenses: [],
    posCart: [],
  };

  // Demo clean removed since we don't use localStorage anymore

  // Local Storage Sync Helper - Disabled per user request to directly use Google Sheets
  function saveDB() {
    // No-op. Data is synced to Google Sheets instead.
  }

  // Toast Notification System
  function showToast(msg, isError = false) {
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.style.borderLeft = `4px solid ${isError ? "#ef4444" : "#f97316"}`;
    const iconColor = isError ? "#f87171" : "#fb923c";
    const iconClass = isError ? "fa-circle-xmark" : "fa-circle-check";
    toast.innerHTML = `<i class="fa-solid ${iconClass}" style="color:${iconColor}"></i> <span>${msg}</span>`;
    document.getElementById("toastContainer").appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideUp 0.3s ease reverse forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================================================
  // VIEW NAVIGATION SWITCHER
  // ==========================================================================
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const viewPanels = document.querySelectorAll(".view-panel");
  const pageTitle = document.getElementById("pageTitle");

  function switchView(viewName) {
    closeMobileSidebar();

    sidebarLinks.forEach((link) => {
      if (link.dataset.view === viewName) link.classList.add("active");
      else link.classList.remove("active");
    });

    viewPanels.forEach((panel) => {
      if (panel.id === `view-${viewName}`) panel.classList.remove("hidden");
      else panel.classList.add("hidden");
    });

    const titles = {
      dashboard: "Dashboard Overview",
      products: "Products & Inventory Master",
      categories: "Category Management",
      suppliers: "Supplier Management",
      sales: "Sales Terminal & POS",
      purchase: "Purchase Stock Stocking",
      expenses: "Expense Tracker",
      reports: "Financial Reports & Profit Analytics",
      settings: "System Settings & Cloud Sync",
    };
    pageTitle.textContent = titles[viewName] || "Dashboard";

    // Save active view tab to localStorage so it stays on page reload
    localStorage.setItem("hh_active_view", viewName);

    // Refresh view specific UI
    if (viewName === "dashboard") renderDashboard();
    if (viewName === "products") renderProductsMasterTable();
    if (viewName === "categories") renderCategoriesView();
    if (viewName === "suppliers") renderSuppliersView();
    if (viewName === "sales") renderPOSView();
    if (viewName === "purchase") renderPurchaseView();
    if (viewName === "expenses") renderExpensesView();
    if (viewName === "reports") renderReportsView();
  }

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => switchView(link.dataset.view));
  });

  // ==========================================================================
  // 1. DASHBOARD VIEW RENDERER
  // ==========================================================================
  function renderDashboard() {
    const totalProds = DB.products.length;
    const totalStock = DB.products.reduce(
      (acc, p) => acc + parseInt(p.stock),
      0,
    );
    const lowStockItems = DB.products.filter((p) => parseInt(p.stock) <= 5);

    const todayStr = new Date().toISOString().split("T")[0];
    const todaySalesArr = DB.sales.filter((s) => s.date === todayStr);
    const todaySalesTotal = todaySalesArr.reduce((acc, s) => acc + s.total, 0);
    const todayProfitTotal = todaySalesArr.reduce(
      (acc, s) => acc + s.profit,
      0,
    );

    document.getElementById("metricTotalProducts").textContent = totalProds;
    document.getElementById("metricTotalStock").textContent = totalStock;
    document.getElementById("metricTodaySales").textContent =
      `৳${todaySalesTotal.toFixed(2)}`;
    document.getElementById("metricTodayOrders").textContent =
      `${todaySalesArr.length} Orders Completed`;
    document.getElementById("metricTodayProfit").textContent =
      `৳${todayProfitTotal.toFixed(2)}`;
    document.getElementById("metricLowStockCount").textContent =
      lowStockItems.length;

    // Low Stock Alert Table
    const dashLowStockTable = document.getElementById("dashLowStockTable");
    if (lowStockItems.length === 0) {
      dashLowStockTable.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">All products have sufficient stock!</td></tr>`;
    } else {
      dashLowStockTable.innerHTML = lowStockItems
        .map(
          (p) => `
        <tr>
          <td class="p-3 font-mono font-bold text-slate-600">${p.id}</td>
          <td class="p-3 font-bold text-slate-800">${p.name}</td>
          <td class="p-3 text-slate-500">${p.category}</td>
          <td class="p-3"><span class="badge-warning">${p.stock} ${p.unit} left</span></td>
          <td class="p-3">
            <button onclick="window.hossainApp.switchView('purchase')" class="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded text-2xs hover:bg-blue-100">
              Restock
            </button>
          </td>
        </tr>
      `,
        )
        .join("");
    }

    // Recent Sales List
    const dashRecentSalesList = document.getElementById("dashRecentSalesList");
    if (DB.sales.length === 0) {
      dashRecentSalesList.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">No recent sales records.</p>`;
    } else {
      dashRecentSalesList.innerHTML = DB.sales
        .slice(-4)
        .reverse()
        .map(
          (s) => `
        <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p class="font-bold text-xs text-slate-800">${s.invoiceId} • ${s.customer}</p>
            <p class="text-2xs text-slate-400">${s.date}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-xs text-slate-900">৳${s.total.toFixed(2)}</p>
            <p class="text-2xs text-green-600 font-semibold">+৳${s.profit.toFixed(2)} Profit</p>
          </div>
        </div>
      `,
        )
        .join("");
    }
  }

  // ==========================================================================
  // 2. PRODUCTS MASTER RENDERER & CRUD
  // ==========================================================================
  const productsMasterTable = document.getElementById("productsMasterTable");
  const prodSearchInput = document.getElementById("prodSearchInput");
  const prodCatFilter = document.getElementById("prodCatFilter");

  function renderProductsMasterTable() {
    renderCategoryDropdowns();
    const q = prodSearchInput.value.toLowerCase().trim();
    const cat = prodCatFilter.value;

    const filtered = DB.products.filter((p) => {
      const matchQ =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      const matchCat = cat === "all" || p.category === cat;
      return matchQ && matchCat;
    });

    if (filtered.length === 0) {
      productsMasterTable.innerHTML = `<tr><td colspan="10" class="p-6 text-center text-slate-400">No products found matching criteria.</td></tr>`;
      return;
    }

    productsMasterTable.innerHTML = filtered
      .map((p, idx) => {
        const isLowStock = parseInt(p.stock) <= 5;
        const isUnknownCat = p.category === "Unknown Category";
        const catBadgeClass = isUnknownCat
          ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

        return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="p-3.5">
            <div class="relative group inline-block">
              <img
                src="${p.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80"}"
                ondblclick="window.hossainApp.openImageModal('${(p.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80").replace(/'/g, "\\'")}', '${p.name.replace(/'/g, "\\'")}')"
                onclick="window.hossainApp.openImageModal('${(p.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80").replace(/'/g, "\\'")}', '${p.name.replace(/'/g, "\\'")}')"
                class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer group-hover:scale-105 group-hover:border-orange-500 transition-all duration-200"
                title="Click or double-click to view large image"
                alt="${p.name}"
              >
              <span class="absolute bottom-1 right-1 bg-slate-900/70 text-white w-5 h-5 rounded-full flex items-center justify-center text-2xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <i class="fa-solid fa-magnifying-glass-plus"></i>
              </span>
            </div>
          </td>
          <td class="p-3.5 font-mono font-bold text-blue-900">${p.id}</td>
          <td class="p-3.5 font-bold text-slate-900">${p.name}</td>
          <td class="p-3.5 text-slate-600"><span class="${catBadgeClass} px-2 py-1 rounded text-2xs font-semibold">${p.category}</span></td>
          <td class="p-3.5 text-slate-600">
            <div class="font-bold text-slate-800">${p.brand || "Unknown Brand"}</div>
            <div class="text-2xs text-slate-400 font-medium">Supp: ${p.supplier || "Unknown Supplier"}</div>
          </td>
          <td class="p-3.5 font-mono text-slate-600">৳${parseFloat(p.buyingPrice).toFixed(2)}</td>
          <td class="p-3.5 font-mono font-bold text-slate-900">৳${parseFloat(p.sellingPrice).toFixed(2)}</td>
          <td class="p-3.5 font-bold">${p.stock} ${p.unit}</td>
          <td class="p-3.5">
            ${isLowStock ? `<span class="badge-warning">Low Stock (${p.stock})</span>` : `<span class="badge-success">In Stock</span>`}
          </td>
          <td class="p-3.5 text-right space-x-2">
            <button onclick="window.hossainApp.editProduct('${p.id}')" class="text-blue-600 hover:text-blue-800 font-bold p-1"><i class="fa-solid fa-pen-to-square"></i></button>
            <button onclick="window.hossainApp.deleteProduct('${p.id}')" class="text-red-500 hover:text-red-700 font-bold p-1"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  prodSearchInput.addEventListener("input", renderProductsMasterTable);
  prodCatFilter.addEventListener("change", renderProductsMasterTable);

  // Add / Edit Product Modal Handler
  const productModalOverlay = document.getElementById("productModalOverlay");
  const openAddProductModalBtn = document.getElementById(
    "openAddProductModalBtn",
  );
  const closeProductModalBtn = document.getElementById("closeProductModalBtn");
  const pmId = document.getElementById("pmId");

  function renderSupplierDropdowns() {
    const pmSupplierSelect = document.getElementById("pmSupplierSelect");
    if (!pmSupplierSelect) return;

    const supplierSet = new Set();

    DB.suppliers.forEach((s) => {
      const suppName = typeof s === "string" ? s : s.name;
      if (suppName) supplierSet.add(suppName);
    });

    DB.purchases.forEach((pur) => {
      if (pur.supplier) supplierSet.add(pur.supplier);
    });
    DB.products.forEach((p) => {
      if (p.supplier) supplierSet.add(p.supplier);
    });

    const supplierList = Array.from(supplierSet);
    let html = `<option value="">-- Select Supplier --</option>`;
    supplierList.forEach((s) => {
      html += `<option value="${s}">${s}</option>`;
    });
    html += `<option value="NEW">+ Type New Supplier Name</option>`;
    pmSupplierSelect.innerHTML = html;
  }

  function openProductModal(editId = null) {
    renderCategoryDropdowns();
    renderSupplierDropdowns();
    if (editId) {
      const p = DB.products.find((item) => item.id === editId);
      if (!p) return;
      document.getElementById("productModalTitle").textContent =
        "Edit Product Record";
      pmId.value = p.id;
      document.getElementById("pmName").value = p.name;
      document.getElementById("pmCategory").value = p.category;
      document.getElementById("pmBrand").value =
        p.brand && p.brand !== "Unknown Brand" ? p.brand : "";
      document.getElementById("pmSupplier").value =
        p.supplier && p.supplier !== "Unknown Supplier" ? p.supplier : "";
      document.getElementById("pmSupplierSelect").value = p.supplier || "";
      document.getElementById("pmBuyingPrice").value = p.buyingPrice;
      document.getElementById("pmSellingPrice").value = p.sellingPrice;
      document.getElementById("pmStock").value = p.stock;
      document.getElementById("pmUnit").value = p.unit;
      document.getElementById("pmImage").value = p.image || "";
      document.getElementById("pmDescription").value = p.description || "";
      document.getElementById("pmEditIndex").value = editId;
    } else {
      document.getElementById("productModalTitle").textContent =
        "Add New Product";
      document.getElementById("productForm").reset();
      document.getElementById("pmEditIndex").value = "-1";
      document.getElementById("pmBrand").value = "";
      document.getElementById("pmSupplier").value = "";
      document.getElementById("pmSupplierSelect").value = "";
      // Auto Generate HH000X ID
      const nextNum = DB.products.length + 1;
      pmId.value = `HH${String(nextNum).padStart(4, "0")}`;
    }
    productModalOverlay.classList.add("active");
  }

  openAddProductModalBtn.addEventListener("click", () => openProductModal());
  closeProductModalBtn.addEventListener("click", () =>
    productModalOverlay.classList.remove("active"),
  );

  // ==========================================================================
  // 3. SALES / POS TERMINAL RENDERER & LOGIC
  // ==========================================================================
  const posProductsGrid = document.getElementById("posProductsGrid");
  const posCartList = document.getElementById("posCartList");
  const posSearchInput = document.getElementById("posSearchInput");
  const posDiscountInput = document.getElementById("posDiscountInput");
  const posCustomerName = document.getElementById("posCustomerName");

  function renderPOSView() {
    const q = posSearchInput.value.toLowerCase().trim();
    const filtered = DB.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );

    posProductsGrid.innerHTML = filtered
      .map(
        (p) => `
      <div onclick="window.hossainApp.addPosItem('${p.id}')" class="bg-white p-3 rounded-xl border border-slate-200 hover:border-orange-500 cursor-pointer transition-all shadow-2xs group flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-2xs text-slate-400 font-bold mb-1">
            <span>${p.id}</span>
            <span class="${parseInt(p.stock) <= 5 ? "text-red-500" : "text-green-600"}">${p.stock} ${p.unit}</span>
          </div>
          <h4 class="font-bold text-xs text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">${p.name}</h4>
        </div>
        <div class="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
          <span class="font-extrabold text-sm text-slate-900">৳${parseFloat(p.sellingPrice).toFixed(2)}</span>
          <span class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <i class="fa-solid fa-plus"></i>
          </span>
        </div>
      </div>
    `,
      )
      .join("");

    renderPOSCart();
  }

  function renderPOSCart() {
    let subtotal = 0;
    let totalBuyingCost = 0;

    if (DB.posCart.length === 0) {
      posCartList.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">Select products from the catalog to build sale receipt.</p>`;
    } else {
      posCartList.innerHTML = DB.posCart
        .map((item) => {
          const itemTotal = item.product.sellingPrice * item.quantity;
          subtotal += itemTotal;
          totalBuyingCost += item.product.buyingPrice * item.quantity;

          return `
          <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
            <div class="overflow-hidden pr-2">
              <h5 class="font-bold text-xs text-slate-800 truncate">${item.product.name}</h5>
              <p class="text-2xs text-slate-400">৳${item.product.sellingPrice.toFixed(2)} x ${item.quantity}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs text-slate-900">৳${itemTotal.toFixed(2)}</span>
              <button onclick="window.hossainApp.updatePosQty('${item.product.id}', -1)" class="w-5 h-5 bg-slate-200 text-slate-700 rounded font-bold text-2xs flex items-center justify-center">-</button>
              <button onclick="window.hossainApp.updatePosQty('${item.product.id}', 1)" class="w-5 h-5 bg-slate-200 text-slate-700 rounded font-bold text-2xs flex items-center justify-center">+</button>
            </div>
          </div>
        `;
        })
        .join("");
    }

    const discount = parseFloat(posDiscountInput.value) || 0;
    const netTotal = Math.max(0, subtotal - discount);
    const netProfit = Math.max(0, netTotal - totalBuyingCost);

    document.getElementById("posNetTotalVal").textContent =
      `৳${netTotal.toFixed(2)}`;
    document.getElementById("posProfitVal").textContent =
      `+৳${netProfit.toFixed(2)}`;
  }

  posSearchInput.addEventListener("input", renderPOSView);
  posDiscountInput.addEventListener("input", renderPOSCart);

  // ==========================================================================
  // 4. PURCHASE STOCK VIEW RENDERER
  // ==========================================================================
  function renderPurchaseView() {
    const purProductSelect = document.getElementById("purProductSelect");
    purProductSelect.innerHTML = DB.products
      .map(
        (p) => `
      <option value="${p.id}">${p.id} - ${p.name} (Current: ${p.stock} ${p.unit})</option>
    `,
      )
      .join("");

    const purchaseLogTable = document.getElementById("purchaseLogTable");
    purchaseLogTable.innerHTML = DB.purchases
      .map(
        (pur) => `
      <tr>
        <td class="p-3 font-mono text-slate-500">${pur.date}</td>
        <td class="p-3 font-bold text-slate-800">${pur.supplier}</td>
        <td class="p-3 text-slate-700">${pur.productName}</td>
        <td class="p-3 font-bold text-blue-900">+${pur.qty} units</td>
        <td class="p-3 font-mono text-slate-900">৳${(pur.qty * pur.buyingPrice).toFixed(2)}</td>
      </tr>
    `,
      )
      .join("");
  }

  // ==========================================================================
  // 5. EXPENSE TRACKER RENDERER
  // ==========================================================================
  function renderExpensesView() {
    const expensesTable = document.getElementById("expensesTable");
    const totalExp = DB.expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0,
    );

    document.getElementById("expTotalBadge").textContent =
      `Total: ৳${totalExp.toFixed(2)}`;

    expensesTable.innerHTML = DB.expenses
      .map(
        (e) => `
      <tr>
        <td class="p-3 font-mono text-slate-500">${e.date}</td>
        <td class="p-3 font-bold text-slate-800"><span class="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-2xs">${e.category}</span></td>
        <td class="p-3 text-slate-600">${e.notes || "-"}</td>
        <td class="p-3 font-bold text-red-600">৳${parseFloat(e.amount).toFixed(2)}</td>
        <td class="p-3 text-right">
          <button onclick="window.hossainApp.deleteExpense(${e.id})" class="text-red-500 hover:text-red-700 font-bold p-1"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  // ==========================================================================
  // 6. REPORTS VIEW RENDERER & EXPORT
  // ==========================================================================
  function renderReportsView() {
    const totalRev = DB.sales.reduce((sum, s) => sum + s.total, 0);
    const totalExp = DB.expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0,
    );
    const totalGrossProfit = DB.sales.reduce((sum, s) => sum + s.profit, 0);
    const netProfit = totalGrossProfit - totalExp;

    document.getElementById("repTotalRevenue").textContent =
      `৳${totalRev.toFixed(2)}`;
    document.getElementById("repTotalExpenses").textContent =
      `৳${totalExp.toFixed(2)}`;
    document.getElementById("repNetProfit").textContent =
      `৳${netProfit.toFixed(2)}`;

    const reportsSalesLedger = document.getElementById("reportsSalesLedger");
    reportsSalesLedger.innerHTML = DB.sales
      .map(
        (s) => `
      <tr>
        <td class="p-3 font-mono font-bold text-blue-900">${s.invoiceId}</td>
        <td class="p-3 font-mono text-slate-500">${s.date}</td>
        <td class="p-3 font-bold text-slate-800">${s.customer}</td>
        <td class="p-3 font-bold text-slate-900">৳${s.total.toFixed(2)}</td>
        <td class="p-3 text-orange-600">-৳${s.discount.toFixed(2)}</td>
        <td class="p-3 font-bold text-green-600">+৳${s.profit.toFixed(2)}</td>
      </tr>
    `,
      )
      .join("");
  }

  // Light & Dark Theme Manager
  function applyTheme(theme) {
    const isDark = theme === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const icon = document.getElementById("themeToggleIcon");
    if (icon) {
      icon.className = isDark
        ? "fa-solid fa-sun text-amber-400"
        : "fa-solid fa-moon text-slate-700";
    }
    localStorage.setItem("hh_theme", theme);
  }

  function toggleTheme() {
    const currentTheme = localStorage.getItem("hh_theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme === "dark" ? "Dark" : "Light"} Mode`);
  }

  // Mobile Sidebar Drawer Controller
  function toggleMobileSidebar() {
    const sidebar = document.querySelector("aside");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.toggle("sidebar-open");
    if (overlay) overlay.classList.toggle("hidden");
  }

  function closeMobileSidebar() {
    const sidebar = document.querySelector("aside");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.remove("sidebar-open");
    if (overlay) overlay.classList.add("hidden");
  }

  // ==========================================================================
  // 2.5 CATEGORY MANAGEMENT RENDERER & LOGIC
  // ==========================================================================
  function renderCategoryDropdowns() {
    const catFilterSelect = document.getElementById("prodCatFilter");
    const pmCatSelect = document.getElementById("pmCategory");

    const categoryList = [...DB.categories];
    DB.products.forEach((p) => {
      if (p.category && !categoryList.includes(p.category)) {
        categoryList.push(p.category);
      }
    });

    if (catFilterSelect) {
      const currentVal = catFilterSelect.value || "all";
      let html = `<option value="all">All Categories</option>`;
      categoryList.forEach((c) => {
        html += `<option value="${c}">${c}</option>`;
      });
      catFilterSelect.innerHTML = html;
      if (categoryList.includes(currentVal) || currentVal === "all") {
        catFilterSelect.value = currentVal;
      }
    }

    if (pmCatSelect) {
      const currentVal = pmCatSelect.value;
      let html = "";
      categoryList.forEach((c) => {
        html += `<option value="${c}">${c}</option>`;
      });
      pmCatSelect.innerHTML = html;
      if (currentVal && categoryList.includes(currentVal)) {
        pmCatSelect.value = currentVal;
      }
    }
  }

  function renderCategoriesView() {
    renderCategoryDropdowns();
    const table = document.getElementById("categoriesTable");
    const badge = document.getElementById("catTotalBadge");

    if (!table) return;

    const countMap = {};
    DB.products.forEach((p) => {
      const cat = p.category || "Unknown Category";
      countMap[cat] = (countMap[cat] || 0) + 1;
    });

    const displayCategories = [...DB.categories];
    if (
      countMap["Unknown Category"] &&
      !displayCategories.includes("Unknown Category")
    ) {
      displayCategories.push("Unknown Category");
    }

    if (badge) {
      badge.textContent = `${displayCategories.length} Categories`;
    }

    if (displayCategories.length === 0) {
      table.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-slate-400">No categories created yet. Add one above!</td></tr>`;
      return;
    }

    table.innerHTML = displayCategories
      .map((catName) => {
        const count = countMap[catName] || 0;
        const isUnknown = catName === "Unknown Category";

        return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="p-3.5 font-bold ${isUnknown ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-200"}">
            <div class="flex items-center gap-2">
              <i class="${isUnknown ? "fa-solid fa-triangle-exclamation text-amber-500" : "fa-solid fa-folder text-orange-500"}"></i>
              <span>${catName}</span>
              ${isUnknown ? '<span class="badge-warning text-2xs bg-amber-50 text-amber-700 border-amber-200 ml-1">System Fallback</span>' : ""}
            </div>
          </td>
          <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400">
            <span class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-2xs font-semibold">${count} ${count === 1 ? "Product" : "Products"}</span>
          </td>
          <td class="p-3.5 text-right">
            ${
              isUnknown
                ? '<span class="text-xs text-slate-400 italic">Cannot delete fallback</span>'
                : `<button onclick="window.hossainApp.deleteCategory('${catName.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-700 font-bold px-3 py-1 rounded bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors text-xs flex items-center gap-1.5 ml-auto">
                    <i class="fa-solid fa-trash"></i> Delete
                  </button>`
            }
          </td>
        </tr>
      `;
      })
      .join("");
  }

  // ==========================================================================
  // 2.6 SUPPLIERS MANAGEMENT RENDERER & LOGIC
  // ==========================================================================
  function renderSuppliersView() {
    renderSupplierDropdowns();
    const table = document.getElementById("suppliersTable");
    const badge = document.getElementById("suppTotalBadge");
    if (!table) return;

    const countMap = {};
    DB.products.forEach((p) => {
      const suppName = p.supplier || "Standard Supplier";
      countMap[suppName] = (countMap[suppName] || 0) + 1;
    });

    const displaySuppliers = [...DB.suppliers];

    if (badge) {
      badge.textContent = `${displaySuppliers.length} Suppliers`;
    }

    if (displaySuppliers.length === 0) {
      table.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-slate-400">No suppliers registered yet. Add one above!</td></tr>`;
      return;
    }

    table.innerHTML = displaySuppliers
      .map((s) => {
        const suppName = typeof s === "string" ? s : s.name;
        const phone = typeof s === "string" ? "-" : s.phone || "-";
        const address = typeof s === "string" ? "-" : s.address || "-";
        const count = countMap[suppName] || 0;

        return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="p-3.5 font-bold text-slate-800 dark:text-slate-200">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-building text-blue-600"></i>
              <span>${suppName}</span>
            </div>
          </td>
          <td class="p-3.5 text-slate-600 dark:text-slate-400">
            <div class="text-xs">📞 ${phone}</div>
            <div class="text-2xs text-slate-400">📍 ${address}</div>
          </td>
          <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400">
            <span class="bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full text-2xs font-semibold">${count} ${count === 1 ? "Product" : "Products"}</span>
          </td>
          <td class="p-3.5 text-right">
            <button onclick="window.hossainApp.deleteSupplier('${suppName.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-700 font-bold px-3 py-1 rounded bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors text-xs flex items-center gap-1.5 ml-auto">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  // GLOBAL HOSSAIN APP PUBLIC INTERFACE
  window.hossainApp = {
    switchView,
    toggleTheme,
    toggleMobileSidebar,
    closeMobileSidebar,
    syncCategoriesNow: async () => {
      showToast("Syncing Categories to Google Sheets...");
      await window.GoogleSheetsAPI.syncData("SYNC_CATEGORIES", DB.categories);
      showToast("Categories synced to Google Sheets!");
    },
    handleCategorySubmit: () => {
      const input = document.getElementById("catNameInput");
      if (!input) return;
      const name = input.value.trim();
      if (!name) return;

      if (DB.categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
        showToast(`Category "${name}" already exists!`, true);
        return;
      }

      DB.categories.push(name);
      saveDB();
      input.value = "";
      renderCategoriesView();
      renderProductsMasterTable();
      showToast(`Category "${name}" added successfully!`);
      window.GoogleSheetsAPI.autoSync("SYNC_CATEGORIES", DB.categories);
    },
    deleteCategory: (catName) => {
      if (
        confirm(
          `Are you sure you want to delete category "${catName}"?\nAll products in this category will be reassigned to "Unknown Category".`,
        )
      ) {
        let reassignedCount = 0;
        DB.products.forEach((p) => {
          if (p.category === catName) {
            p.category = "Unknown Category";
            reassignedCount++;
          }
        });

        DB.categories = DB.categories.filter((c) => c !== catName);
        saveDB();

        renderCategoriesView();
        renderProductsMasterTable();

        if (reassignedCount > 0) {
          showToast(
            `Category "${catName}" deleted. ${reassignedCount} product(s) reassigned to "Unknown Category".`,
          );
        } else {
          showToast(`Category "${catName}" deleted.`);
        }
        window.GoogleSheetsAPI.autoSync("SYNC_CATEGORIES", DB.categories);
        if (reassignedCount > 0) {
          window.GoogleSheetsAPI.autoSync("SYNC_PRODUCTS", DB.products);
        }
      }
    },
    openImageModal: (imageUrl, title) => {
      const modal = document.getElementById("imagePreviewModalOverlay");
      const img = document.getElementById("imageModalSrc");
      const titleEl = document.getElementById("imageModalTitle");
      if (modal && img) {
        img.src =
          imageUrl ||
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
        if (titleEl) titleEl.textContent = title || "Product Image Preview";
        modal.classList.add("active");
      }
    },
    editProduct: (id) => openProductModal(id),
    deleteProduct: (id) => {
      if (confirm(`Are you sure you want to delete product ${id}?`)) {
        DB.products = DB.products.filter((p) => p.id !== id);
        saveDB();
        renderProductsMasterTable();
        showToast("Product deleted from inventory");
        window.GoogleSheetsAPI.autoSync("SYNC_PRODUCTS", DB.products);
      }
    },
    handleProductSupplierSelect: (val) => {
      const pmSupplier = document.getElementById("pmSupplier");
      if (!pmSupplier) return;
      if (val && val !== "NEW") {
        pmSupplier.value = val;
      } else if (val === "NEW") {
        pmSupplier.value = "";
        pmSupplier.focus();
      }
    },
    handleSupplierSubmit: () => {
      const nameInput = document.getElementById("suppNameInput");
      const phoneInput = document.getElementById("suppPhoneInput");
      const addressInput = document.getElementById("suppAddressInput");
      if (!nameInput) return;

      const name = nameInput.value.trim();
      const phone = phoneInput ? phoneInput.value.trim() : "";
      const address = addressInput ? addressInput.value.trim() : "";

      if (!name) return;

      const exists = DB.suppliers.some((s) => {
        const sName = typeof s === "string" ? s : s.name;
        return sName.toLowerCase() === name.toLowerCase();
      });

      if (exists) {
        showToast(`Supplier "${name}" already exists!`, true);
        return;
      }

      const newSuppObj = { name, phone: phone || "-", address: address || "-" };
      DB.suppliers.push(newSuppObj);
      saveDB();

      nameInput.value = "";
      if (phoneInput) phoneInput.value = "";
      if (addressInput) addressInput.value = "";

      renderSuppliersView();
      renderSupplierDropdowns();
      showToast(`Supplier "${name}" added successfully!`);
      window.GoogleSheetsAPI.autoSync("SYNC_SUPPLIERS", DB.suppliers);
    },
    deleteSupplier: (suppName) => {
      if (confirm(`Are you sure you want to delete supplier "${suppName}"?`)) {
        DB.suppliers = DB.suppliers.filter((s) => {
          const sName = typeof s === "string" ? s : s.name;
          return sName !== suppName;
        });
        saveDB();
        renderSuppliersView();
        renderSupplierDropdowns();
        showToast(`Supplier "${suppName}" deleted.`);
        window.GoogleSheetsAPI.autoSync("SYNC_SUPPLIERS", DB.suppliers);
      }
    },
    saveProductSubmit: async () => {
      const editIndex = document.getElementById("pmEditIndex").value;
      const id = pmId.value;
      const brandInput = document.getElementById("pmBrand").value.trim();
      const supplierInput = document.getElementById("pmSupplier").value.trim();
      const descInput = document.getElementById("pmDescription").value.trim();

      const productObj = {
        id,
        name: document.getElementById("pmName").value.trim(),
        category: document.getElementById("pmCategory").value,
        brand: brandInput !== "" ? brandInput : "Unknown Brand",
        supplier: supplierInput !== "" ? supplierInput : "Unknown Supplier",
        buyingPrice:
          parseFloat(document.getElementById("pmBuyingPrice").value) || 0,
        sellingPrice:
          parseFloat(document.getElementById("pmSellingPrice").value) || 0,
        stock: parseInt(document.getElementById("pmStock").value) || 0,
        unit: document.getElementById("pmUnit").value.trim() || "Pcs",
        image: document.getElementById("pmImage").value.trim(),
        description: descInput,
      };

      if (editIndex !== "-1") {
        const idx = DB.products.findIndex((p) => p.id === editIndex);
        if (idx > -1) DB.products[idx] = productObj;
      } else {
        DB.products.push(productObj);
      }

      saveDB();
      productModalOverlay.classList.remove("active");
      renderProductsMasterTable();
      showToast(`Product ${id} saved & refreshing...`);
      await window.GoogleSheetsAPI.autoSync("SYNC_PRODUCTS", DB.products);
      setTimeout(() => {
        window.location.reload();
      }, 300);
    },
    addPosItem: (productId) => {
      const p = DB.products.find((item) => item.id === productId);
      if (!p) return;
      if (p.stock <= 0) {
        showToast(`Stock empty for ${p.name}! Restock required.`, true);
        return;
      }
      const existing = DB.posCart.find((i) => i.product.id === productId);
      if (existing) {
        if (existing.quantity >= p.stock) {
          showToast(`Cannot add more than available stock (${p.stock}).`, true);
          return;
        }
        existing.quantity += 1;
      } else {
        DB.posCart.push({ product: p, quantity: 1 });
      }
      renderPOSCart();
    },
    updatePosQty: (productId, delta) => {
      const item = DB.posCart.find((i) => i.product.id === productId);
      if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
          DB.posCart = DB.posCart.filter((i) => i.product.id !== productId);
        }
        renderPOSCart();
      }
    },
    handlePurchaseSubmit: () => {
      const supplier = document.getElementById("purSupplier").value;
      const pId = document.getElementById("purProductSelect").value;
      const qty = parseInt(document.getElementById("purQty").value);
      const buyingPrice = parseFloat(
        document.getElementById("purBuyingPrice").value,
      );

      const p = DB.products.find((item) => item.id === pId);
      if (p) {
        p.stock += qty;
        p.buyingPrice = buyingPrice;
        const purchaseEntry = {
          date: new Date().toISOString().split("T")[0],
          supplier,
          productId: pId,
          productName: p.name,
          qty,
          buyingPrice,
        };
        DB.purchases.push(purchaseEntry);
        saveDB();
        renderPurchaseView();
        showToast(`Stock updated! Syncing to Sheets...`);
        window.GoogleSheetsAPI.autoSync("SYNC_PURCHASE", purchaseEntry);
        window.GoogleSheetsAPI.autoSync("SYNC_PRODUCTS", DB.products);
      }
    },
    handleExpenseSubmit: () => {
      const category = document.getElementById("expCategory").value;
      const amount = parseFloat(document.getElementById("expAmount").value);
      const notes = document.getElementById("expNotes").value;

      const expEntry = {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        category,
        amount,
        notes,
      };
      DB.expenses.push(expEntry);
      saveDB();
      document.getElementById("expenseForm").reset();
      renderExpensesView();
      showToast(`Expense of ৳${amount.toFixed(2)} logged & syncing...`);
      window.GoogleSheetsAPI.autoSync("SYNC_EXPENSE", expEntry);
    },
    deleteExpense: (id) => {
      DB.expenses = DB.expenses.filter((e) => e.id !== id);
      saveDB();
      renderExpensesView();
      showToast("Expense record deleted");
    },
    exportExcelCSV: () => {
      let csv = "Invoice ID,Date,Customer,Total Amount,Discount,Net Profit\n";
      DB.sales.forEach((s) => {
        csv += `"${s.invoiceId}","${s.date}","${s.customer}",${s.total},${s.discount},${s.profit}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Hossain_Hardware_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      showToast("Exported Sales Ledger to Excel CSV!");
    },
    saveSettings: () => {
      const url = document.getElementById("googleScriptUrlInput").value;
      window.GoogleSheetsAPI.setScriptUrl(url);
      showToast("Settings saved! New URL is now active.");
    },
    syncNow: async () => {
      showToast("Syncing all data to Google Sheets...");
      await window.GoogleSheetsAPI.syncData("SYNC_ALL", {
        products: DB.products,
        categories: DB.categories,
        suppliers: DB.suppliers,
        sales: DB.sales,
        expenses: DB.expenses,
        purchases: DB.purchases,
      });
      showToast("Full sync request sent to Google Sheets!");
    },
    resetDemoData: () => {
      if (confirm("Reset to initial demo inventory dataset?")) {
        localStorage.clear();
        location.reload();
      }
    },
  };

  // Complete POS Sale Handler
  document.getElementById("btnCompleteSale").addEventListener("click", () => {
    if (DB.posCart.length === 0) {
      showToast(
        "Please add products to the receipt before completing sale.",
        true,
      );
      return;
    }

    let subtotal = 0;
    let totalBuyingCost = 0;
    const saleItems = [];

    // Deduct stock
    DB.posCart.forEach((item) => {
      const p = DB.products.find((prod) => prod.id === item.product.id);
      if (p) {
        p.stock -= item.quantity;
      }
      const lineTotal = item.product.sellingPrice * item.quantity;
      subtotal += lineTotal;
      totalBuyingCost += item.product.buyingPrice * item.quantity;
      saleItems.push({
        id: item.product.id,
        name: item.product.name,
        category: item.product.category || "Unknown Category",
        qty: item.quantity,
        price: item.product.sellingPrice,
        buyingPrice: item.product.buyingPrice,
      });
    });

    const discount = parseFloat(posDiscountInput.value) || 0;
    const netTotal = Math.max(0, subtotal - discount);
    const netProfit = Math.max(0, netTotal - totalBuyingCost);
    const invoiceNum = `INV-2026-${String(DB.sales.length + 1).padStart(4, "0")}`;
    const customer = posCustomerName.value || "Walk-in Customer";
    const dateStr = new Date().toISOString().split("T")[0];

    const saleObj = {
      invoiceId: invoiceNum,
      date: dateStr,
      customer,
      items: saleItems,
      subtotal,
      discount,
      total: netTotal,
      profit: netProfit,
    };

    DB.sales.push(saleObj);
    DB.posCart = [];
    posDiscountInput.value = 0;
    posCustomerName.value = "";

    saveDB();

    // Fill Invoice Printable Modal
    document.getElementById("invModalId").textContent = invoiceNum;
    document.getElementById("invModalDate").textContent = dateStr;
    document.getElementById("invModalCustomer").textContent = customer;
    document.getElementById("invModalSubtotal").textContent =
      `৳${subtotal.toFixed(2)}`;
    document.getElementById("invModalDiscount").textContent =
      `-৳${discount.toFixed(2)}`;
    document.getElementById("invModalTotal").textContent =
      `৳${netTotal.toFixed(2)}`;
    document.getElementById("invModalTable").innerHTML = saleItems
      .map(
        (i) => `
      <tr>
        <td class="py-1">${i.name}</td>
        <td class="py-1">${i.qty}</td>
        <td class="py-1 text-right">৳${(i.price * i.qty).toFixed(2)}</td>
      </tr>
    `,
      )
      .join("");

    document.getElementById("invoiceModalOverlay").classList.add("active");
    renderPOSView();
    showToast(`Sale ${invoiceNum} Completed! Syncing to Sheets...`);
    // Auto-sync sale, full sales ledger & updated stock to Google Sheets
    window.GoogleSheetsAPI.autoSync("SYNC_SALE", saleObj);
    window.GoogleSheetsAPI.autoSync("SYNC_SALES", DB.sales);
    window.GoogleSheetsAPI.autoSync("SYNC_PRODUCTS", DB.products);
  });

  // Start Application - Restore active view tab & default to Dark mode
  const savedTheme = localStorage.getItem("hh_theme") || "dark";
  applyTheme(savedTheme);

  renderCategoryDropdowns();

  const savedView = localStorage.getItem("hh_active_view") || "dashboard";
  switchView(savedView);

  // Pre-fill Settings URL input from stored/default value
  const gsUrlInput = document.getElementById("googleScriptUrlInput");
  if (gsUrlInput) gsUrlInput.value = window.GoogleSheetsAPI.getScriptUrl();

  // ==========================================================================
  // AUTO-LOAD FROM CLOUD ON NEW DEVICE (Mobile Fix)
  // If localStorage has no products but a Google Sheets URL is configured,
  // automatically fetch all data from Google Sheets and populate the app.
  // ==========================================================================
  async function loadFromCloud(isManual = false) {
    // Always fetch from cloud. No local caching checks.

    const url = window.GoogleSheetsAPI.getScriptUrl();
    if (!url) {
      if (isManual)
        showToast("No Google Sheets URL configured in Settings!", true);
      return;
    }

    // Show loading indicator
    const loadingToast = document.createElement("div");
    loadingToast.className = "toast-msg";
    loadingToast.style.borderLeft = "4px solid #3b82f6";
    loadingToast.innerHTML = `<i class="fa-solid fa-cloud-arrow-down" style="color:#60a5fa"></i> <span>${isManual ? "Loading" : "Auto-loading"} data from Google Sheets cloud...</span>`;
    document.getElementById("toastContainer").appendChild(loadingToast);

    try {
      const data = await window.GoogleSheetsAPI.fetchAllData();

      loadingToast.remove();

      if (!data || !data.success) {
        showToast(
          isManual
            ? "Could not load from cloud. Check your Apps Script URL & permissions."
            : "Cloud auto-load failed — check Settings URL.",
          true,
        );
        return;
      }

      // Merge cloud data into DB (cloud is source of truth)
      if (data.products && data.products.length > 0) {
        DB.products = data.products;
      }
      if (data.categories && data.categories.length > 0) {
        DB.categories = [...new Set([...DB.categories, ...data.categories])];
      }
      if (data.suppliers && data.suppliers.length > 0) {
        DB.suppliers = data.suppliers;
      }
      if (data.sales && data.sales.length > 0) {
        DB.sales = data.sales;
      }
      if (data.expenses && data.expenses.length > 0) {
        DB.expenses = data.expenses;
      }
      if (data.purchases && data.purchases.length > 0) {
        DB.purchases = data.purchases;
      }

      saveDB();

      // Refresh current view
      renderCategoryDropdowns();
      switchView(localStorage.getItem("hh_active_view") || "dashboard");

      showToast(
        `✅ Cloud sync complete! ${DB.products.length} products loaded from Google Sheets.`,
      );
    } catch (err) {
      loadingToast.remove();
      showToast("Cloud load error: " + err.message, true);
    }
  }

  // Expose loadFromCloud to public API
  window.hossainApp.loadFromCloud = () => loadFromCloud(true);

  // Auto-trigger on every startup
  setTimeout(() => loadFromCloud(false), 800);
});
