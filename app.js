const DB_NAME = "dompetku-db";
const DB_VERSION = 1;
const STORE_NAMES = ["transactions", "categories", "budgets", "settings"];

const defaultCategories = [
  { id: "food", name: "Makan", emoji: "🍽️", type: "expense", isDefault: true },
  { id: "transport", name: "Transportasi", emoji: "🚕", type: "expense", isDefault: true },
  { id: "shopping", name: "Belanja", emoji: "🛍️", type: "expense", isDefault: true },
  { id: "fun", name: "Hiburan", emoji: "🎬", type: "expense", isDefault: true },
  { id: "health", name: "Kesehatan", emoji: "💊", type: "expense", isDefault: true },
  { id: "salary", name: "Gaji", emoji: "💼", type: "income", isDefault: true },
  { id: "business", name: "Bisnis", emoji: "📈", type: "income", isDefault: true },
  { id: "other", name: "Lainnya", emoji: "💸", type: "both", isDefault: true }
];

const state = {
  db: null,
  transactions: [],
  categories: [],
  budgets: [],
  settings: { monthStart: 1 },
  activeView: "home",
  transactionType: "expense"
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const els = {
  currentPeriod: document.getElementById("current-period"),
  balanceValue: document.getElementById("balance-value"),
  incomeValue: document.getElementById("income-value"),
  expenseValue: document.getElementById("expense-value"),
  recentList: document.getElementById("recent-list"),
  historyList: document.getElementById("history-list"),
  historyMonth: document.getElementById("history-month"),
  historyCategory: document.getElementById("history-category"),
  budgetList: document.getElementById("budget-list"),
  budgetAlerts: document.getElementById("budget-alerts"),
  reportExpenseNow: document.getElementById("report-expense-now"),
  reportExpensePrev: document.getElementById("report-expense-prev"),
  categoryChart: document.getElementById("category-chart"),
  transactionSheet: document.getElementById("transaction-sheet"),
  transactionForm: document.getElementById("transaction-form"),
  transactionId: document.getElementById("transaction-id"),
  amountInput: document.getElementById("amount-input"),
  deleteTransaction: document.getElementById("delete-transaction"),
  categoryInput: document.getElementById("category-input"),
  noteInput: document.getElementById("note-input"),
  dateInput: document.getElementById("date-input"),
  sheetTitle: document.getElementById("sheet-title"),
  categorySheet: document.getElementById("category-sheet"),
  categoryForm: document.getElementById("category-form"),
  categoryList: document.getElementById("category-list"),
  categoryIdInput: document.getElementById("category-id-input"),
  categoryNameInput: document.getElementById("category-name-input"),
  categoryEmojiInput: document.getElementById("category-emoji-input"),
  categoryTypeInput: document.getElementById("category-type-input"),
  settingsSheet: document.getElementById("settings-sheet"),
  monthStartInput: document.getElementById("month-start-input"),
  installNudge: document.getElementById("install-nudge")
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("transactions")) {
        db.createObjectStore("transactions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("budgets")) {
        db.createObjectStore("budgets", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function storeAction(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const getAll = (storeName) => storeAction(storeName, "readonly", (store) => store.getAll());
const put = (storeName, value) => storeAction(storeName, "readwrite", (store) => store.put(value));
const remove = (storeName, id) => storeAction(storeName, "readwrite", (store) => store.delete(id));
const clear = (storeName) => storeAction(storeName, "readwrite", (store) => store.clear());

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(dateString = today()) {
  const startDay = Number(state.settings?.monthStart || 1);
  const date = new Date(`${dateString.slice(0, 10)}T12:00:00`);
  if (date.getDate() < startDay) date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
}

function currentMonthLabel() {
  const key = monthKey();
  return `Periode ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(`${key}-01T12:00:00`))}`;
}

function previousMonthKey() {
  const d = new Date(`${monthKey()}-01T00:00:00`);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function uid(prefix) {
  if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseAmount(value) {
  const cleaned = String(value).replace(/[^\d]/g, "");
  return Number(cleaned || 0);
}

function formatAmountInput(value) {
  const amount = parseAmount(value);
  return amount ? new Intl.NumberFormat("id-ID").format(amount) : "";
}

function getCategory(id) {
  return state.categories.find((category) => category.id === id) || defaultCategories.at(-1);
}

function categoriesForType(type) {
  return state.categories.filter((category) => category.type === type || category.type === "both");
}

function transactionsForMonth(month = monthKey()) {
  return state.transactions.filter((item) => monthKey(item.date) === month);
}

function expenseByCategory(month = monthKey()) {
  const totals = new Map();
  transactionsForMonth(month)
    .filter((item) => item.type === "expense")
    .forEach((item) => totals.set(item.categoryId, (totals.get(item.categoryId) || 0) + item.amount));
  return totals;
}

function showEmpty(container) {
  const template = document.getElementById("empty-template");
  container.append(template.content.cloneNode(true));
}

function renderTransactionList(container, transactions, limit) {
  container.innerHTML = "";
  const visibleItems = limit ? transactions.slice(0, limit) : transactions;
  if (!visibleItems.length) {
    showEmpty(container);
    return;
  }

  visibleItems.forEach((item) => {
    const category = getCategory(item.categoryId);
    const row = document.createElement("article");
    row.className = "transaction-item";
    row.innerHTML = `
      <span class="avatar">${category.emoji}</span>
      <span class="item-main">
        <strong>${escapeHtml(item.note || category.name)}</strong>
        <span>${category.name} · ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.date))}</span>
      </span>
      <span class="amount ${item.type}">${item.type === "income" ? "+" : "-"}${rupiah.format(item.amount)}</span>
    `;
    row.addEventListener("click", () => openTransactionSheet(item));
    container.append(row);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSummary() {
  const monthly = transactionsForMonth();
  const income = monthly.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = monthly.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  els.currentPeriod.textContent = currentMonthLabel();
  els.balanceValue.textContent = rupiah.format(income - expense);
  els.incomeValue.textContent = rupiah.format(income);
  els.expenseValue.textContent = rupiah.format(expense);

  const newest = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  renderTransactionList(els.recentList, newest, 5);
}

function renderFilters() {
  els.historyMonth.value = els.historyMonth.value || monthKey();
  els.historyCategory.innerHTML = `<option value="all">Semua kategori</option>`;
  state.categories.forEach((category) => {
    els.historyCategory.innerHTML += `<option value="${category.id}">${category.emoji} ${escapeHtml(category.name)}</option>`;
  });
}

function renderHistory() {
  const selectedMonth = els.historyMonth.value || monthKey();
  const selectedCategory = els.historyCategory.value || "all";
  const items = state.transactions
    .filter((item) => monthKey(item.date) === selectedMonth)
    .filter((item) => selectedCategory === "all" || item.categoryId === selectedCategory)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  renderTransactionList(els.historyList, items);
}

function renderBudgets() {
  const spent = expenseByCategory();
  const expenseCategories = categoriesForType("expense");
  els.budgetList.innerHTML = "";
  els.budgetAlerts.innerHTML = "";

  expenseCategories.forEach((category) => {
    const budget = state.budgets.find((item) => item.categoryId === category.id && item.month === monthKey());
    const budgetAmount = budget?.amount || 0;
    const used = spent.get(category.id) || 0;
    const percent = budgetAmount ? Math.min((used / budgetAmount) * 100, 120) : 0;
    const status = percent >= 100 ? "danger" : percent >= 80 ? "warn" : "";

    if (budgetAmount && percent >= 80) {
      const notice = document.createElement("div");
      notice.className = "notice";
      notice.textContent = percent >= 100
        ? `${category.name} sudah melewati anggaran bulan ini.`
        : `${category.name} sudah mendekati batas anggaran.`;
      els.budgetAlerts.append(notice);
    }

    const item = document.createElement("article");
    item.className = "budget-item";
    item.innerHTML = `
      <div class="budget-top">
        <span class="item-main">
          <strong>${category.emoji} ${escapeHtml(category.name)}</strong>
          <span>${rupiah.format(used)} dari ${budgetAmount ? rupiah.format(budgetAmount) : "belum diatur"}</span>
        </span>
        <b>${budgetAmount ? Math.round(Math.min(percent, 999)) + "%" : "-"}</b>
      </div>
      <div class="progress ${status}" style="--fill:${Math.min(percent, 100)}%"><span></span></div>
      <div class="budget-edit">
        <input inputmode="numeric" data-budget-input="${category.id}" value="${budgetAmount ? new Intl.NumberFormat("id-ID").format(budgetAmount) : ""}" placeholder="Anggaran kategori" />
        <button class="tiny-action" type="button" data-save-budget="${category.id}">✓</button>
      </div>
    `;
    els.budgetList.append(item);
  });
}

function renderReports() {
  const nowExpenses = transactionsForMonth()
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const prevExpenses = transactionsForMonth(previousMonthKey())
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  els.reportExpenseNow.textContent = rupiah.format(nowExpenses);
  els.reportExpensePrev.textContent = rupiah.format(prevExpenses);

  const totals = [...expenseByCategory().entries()]
    .map(([categoryId, amount]) => ({ category: getCategory(categoryId), amount }))
    .sort((a, b) => b.amount - a.amount);
  els.categoryChart.innerHTML = "";
  if (!totals.length) {
    showEmpty(els.categoryChart);
    return;
  }
  const max = Math.max(...totals.map((item) => item.amount));
  totals.forEach((item) => {
    const fill = max ? (item.amount / max) * 100 : 0;
    const row = document.createElement("article");
    row.className = "chart-item";
    row.innerHTML = `
      <div class="chart-top">
        <strong>${item.category.emoji} ${escapeHtml(item.category.name)}</strong>
        <b>${rupiah.format(item.amount)}</b>
      </div>
      <div class="bar-track" style="--fill:${fill}%"><span></span></div>
    `;
    els.categoryChart.append(row);
  });
}

function renderCategoryInputs() {
  els.categoryInput.innerHTML = "";
  categoriesForType(state.transactionType).forEach((category) => {
    els.categoryInput.innerHTML += `<option value="${category.id}">${category.emoji} ${escapeHtml(category.name)}</option>`;
  });
}

function renderCategoryManager() {
  els.categoryList.innerHTML = "";
  state.categories.forEach((category) => {
    const row = document.createElement("article");
    row.className = "category-item";
    row.innerHTML = `
      <span class="avatar">${category.emoji}</span>
      <span class="item-main">
        <strong>${escapeHtml(category.name)}</strong>
        <span>${category.type === "both" ? "Pemasukan & pengeluaran" : category.type === "income" ? "Pemasukan" : "Pengeluaran"}</span>
      </span>
      <button class="tiny-action" type="button" data-edit-category="${category.id}">Ubah</button>
      <button class="tiny-action" type="button" data-delete-category="${category.id}" ${category.isDefault ? "disabled" : ""}>Hapus</button>
    `;
    els.categoryList.append(row);
  });
}

function renderAll() {
  renderSummary();
  renderFilters();
  renderHistory();
  renderBudgets();
  renderReports();
  renderCategoryInputs();
  renderCategoryManager();
}

async function refreshData() {
  state.transactions = await getAll("transactions");
  state.categories = await getAll("categories");
  state.budgets = await getAll("budgets");
  const settings = await getAll("settings");
  state.settings = { monthStart: 1, ...Object.fromEntries(settings.map((item) => [item.key, item.value])) };
  if (!state.categories.length) {
    for (const category of defaultCategories) await put("categories", category);
    state.categories = await getAll("categories");
  }
  els.monthStartInput.value = state.settings.monthStart || 1;
  renderAll();
}

function setView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.dataset.view === viewName));
  document.querySelectorAll(".tab[data-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === viewName));
}

function setTransactionType(type) {
  state.transactionType = type;
  document.querySelectorAll("[data-type-choice]").forEach((button) => {
    button.classList.toggle("active", button.dataset.typeChoice === type);
  });
  renderCategoryInputs();
}

function openTransactionSheet(item = null, forcedType = "expense") {
  const editing = Boolean(item);
  els.sheetTitle.textContent = editing ? "Edit Transaksi" : "Tambah Transaksi";
  els.transactionId.value = item?.id || "";
  els.deleteTransaction.hidden = !editing;
  setTransactionType(item?.type || forcedType);
  els.amountInput.value = item ? formatAmountInput(item.amount) : "";
  els.noteInput.value = item?.note || "";
  els.dateInput.value = item?.date || today();
  renderCategoryInputs();
  els.categoryInput.value = item?.categoryId || categoriesForType(state.transactionType)[0]?.id || "";
  els.transactionSheet.hidden = false;
  setTimeout(() => els.amountInput.focus(), 80);
}

function closeTransactionSheet() {
  els.transactionSheet.hidden = true;
  els.transactionForm.reset();
  els.transactionId.value = "";
  els.deleteTransaction.hidden = true;
}

function openCategorySheet() {
  els.categorySheet.hidden = false;
  renderCategoryManager();
}

function closeCategorySheet() {
  els.categorySheet.hidden = true;
  els.categoryForm.reset();
  els.categoryIdInput.value = "";
}

async function saveTransaction(event) {
  event.preventDefault();
  const amount = parseAmount(els.amountInput.value);
  if (!amount) {
    els.amountInput.focus();
    return;
  }
  const existing = state.transactions.find((item) => item.id === els.transactionId.value);
  const item = {
    id: existing?.id || uid("trx"),
    amount,
    type: state.transactionType,
    categoryId: els.categoryInput.value,
    note: els.noteInput.value.trim(),
    date: els.dateInput.value,
    createdAt: existing?.createdAt || Date.now()
  };
  await put("transactions", item);
  closeTransactionSheet();
  await refreshData();
  if (navigator.vibrate) navigator.vibrate(20);
}

async function deleteTransaction(id) {
  if (!confirm("Hapus transaksi ini?")) return;
  await remove("transactions", id);
  closeTransactionSheet();
  await refreshData();
}

async function saveCategory(event) {
  event.preventDefault();
  const id = els.categoryIdInput.value || uid("cat");
  const existing = state.categories.find((category) => category.id === id);
  await put("categories", {
    id,
    name: els.categoryNameInput.value.trim(),
    emoji: els.categoryEmojiInput.value.trim() || "💸",
    type: els.categoryTypeInput.value,
    isDefault: Boolean(existing?.isDefault)
  });
  els.categoryForm.reset();
  els.categoryIdInput.value = "";
  await refreshData();
}

async function deleteCategory(id) {
  const used = state.transactions.some((item) => item.categoryId === id);
  if (used) {
    alert("Kategori masih dipakai di transaksi, jadi belum bisa dihapus.");
    return;
  }
  if (!confirm("Hapus kategori ini?")) return;
  await remove("categories", id);
  await refreshData();
}

async function saveBudget(categoryId) {
  const input = document.querySelector(`[data-budget-input="${categoryId}"]`);
  const amount = parseAmount(input.value);
  const id = `${monthKey()}-${categoryId}`;
  await put("budgets", { id, categoryId, month: monthKey(), amount });
  await refreshData();
}

async function exportJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    transactions: state.transactions,
    categories: state.categories,
    budgets: state.budgets,
    settings: state.settings
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `dompetku-backup-${today()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importJson(file) {
  const payload = JSON.parse(await file.text());
  if (!payload.transactions || !payload.categories) {
    alert("File backup tidak sesuai.");
    return;
  }
  for (const storeName of STORE_NAMES) await clear(storeName);
  for (const item of payload.transactions || []) await put("transactions", item);
  for (const item of payload.categories || []) await put("categories", item);
  for (const item of payload.budgets || []) await put("budgets", item);
  const settings = payload.settings || {};
  for (const [key, value] of Object.entries(settings)) await put("settings", { key, value });
  await refreshData();
  alert("Data berhasil dipulihkan.");
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.tab));
  });
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.go));
  });
  document.getElementById("add-button").addEventListener("click", () => openTransactionSheet());
  document.querySelectorAll("[data-quick-type]").forEach((button) => {
    button.addEventListener("click", () => openTransactionSheet(null, button.dataset.quickType));
  });
  document.querySelectorAll("[data-type-choice]").forEach((button) => {
    button.addEventListener("click", () => setTransactionType(button.dataset.typeChoice));
  });
  els.amountInput.addEventListener("input", () => {
    els.amountInput.value = formatAmountInput(els.amountInput.value);
  });
  els.transactionForm.addEventListener("submit", saveTransaction);
  els.deleteTransaction.addEventListener("click", () => {
    if (els.transactionId.value) deleteTransaction(els.transactionId.value);
  });
  document.getElementById("cancel-transaction").addEventListener("click", closeTransactionSheet);
  els.transactionSheet.addEventListener("click", (event) => {
    if (event.target === els.transactionSheet) closeTransactionSheet();
  });
  els.historyMonth.addEventListener("change", renderHistory);
  els.historyCategory.addEventListener("change", renderHistory);
  els.budgetList.addEventListener("input", (event) => {
    if (event.target.matches("[data-budget-input]")) event.target.value = formatAmountInput(event.target.value);
  });
  els.budgetList.addEventListener("click", (event) => {
    const categoryId = event.target.dataset.saveBudget;
    if (categoryId) saveBudget(categoryId);
  });
  document.getElementById("manage-categories-button").addEventListener("click", openCategorySheet);
  els.categoryForm.addEventListener("submit", saveCategory);
  document.getElementById("cancel-category").addEventListener("click", closeCategorySheet);
  els.categorySheet.addEventListener("click", (event) => {
    if (event.target === els.categorySheet) closeCategorySheet();
  });
  els.categoryList.addEventListener("click", (event) => {
    const editId = event.target.dataset.editCategory;
    const deleteId = event.target.dataset.deleteCategory;
    if (editId) {
      const category = state.categories.find((item) => item.id === editId);
      els.categoryIdInput.value = category.id;
      els.categoryNameInput.value = category.name;
      els.categoryEmojiInput.value = category.emoji;
      els.categoryTypeInput.value = category.type;
      els.categoryNameInput.focus();
    }
    if (deleteId) deleteCategory(deleteId);
  });
  document.getElementById("settings-button").addEventListener("click", () => {
    els.settingsSheet.hidden = false;
  });
  document.getElementById("close-settings").addEventListener("click", async () => {
    const monthStart = Math.max(1, Math.min(28, Number(els.monthStartInput.value || 1)));
    await put("settings", { key: "monthStart", value: monthStart });
    els.settingsSheet.hidden = true;
    await refreshData();
  });
  document.getElementById("export-json").addEventListener("click", exportJson);
  document.getElementById("import-json").addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) importJson(file);
  });
  document.getElementById("install-dismiss").addEventListener("click", () => {
    localStorage.setItem("installNudgeDismissed", "yes");
    els.installNudge.hidden = true;
  });
}

function maybeShowInstallNudge() {
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (!isStandalone && !localStorage.getItem("installNudgeDismissed")) {
    els.installNudge.hidden = false;
  }
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
      console.warn("Service worker belum aktif:", error);
    }
  }
}

async function init() {
  bindEvents();
  state.db = await openDb();
  els.historyMonth.value = monthKey();
  await refreshData();
  maybeShowInstallNudge();
  registerServiceWorker();
}

init();
