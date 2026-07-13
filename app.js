const STORAGE_KEY = "spend-save-app-v1";
const DEFAULT_FIREBASE_CONFIG_TEXT = "";
const FALLBACK_RATES_CNY = {
  CNY: 1,
  USD: 0.139,
  IDR: 2250,
  SGD: 0.18,
  MYR: 0.60,
  THB: 4.55,
  EUR: 0.128,
  HKD: 1.09,
  JPY: 22,
  KRW: 190,
  GBP: 0.11,
  AUD: 0.21
};
const CURRENCY_OPTIONS = [
  ["CNY", "人民币 ¥"],
  ["USD", "美元 $"],
  ["IDR", "印尼盾 Rp"],
  ["SGD", "新币 S$"],
  ["MYR", "马币 RM"],
  ["THB", "泰铢 ฿"],
  ["EUR", "欧元 €"],
  ["HKD", "港币 HK$"],
  ["JPY", "日元 ¥"],
  ["KRW", "韩元 ₩"],
  ["GBP", "英镑 £"],
  ["AUD", "澳元 A$"]
];
const CATEGORY_NAMES = ["餐饮", "交通", "购物", "住房", "水电网", "医疗", "娱乐", "学习", "收入", "其他"];
const CATEGORY_KEYWORDS = [
  ["餐饮", ["饭", "餐", "咖啡", "奶茶", "外卖", "早餐", "午饭", "晚饭", "吃", "超市", "菜", "水果", "饮料"]],
  ["交通", ["打车", "出租", "地铁", "公交", "油", "停车", "高速", "机票", "火车", "交通"]],
  ["购物", ["买", "衣", "鞋", "淘宝", "京东", "拼多多", "商场", "日用品", "护肤", "电子"]],
  ["住房", ["房租", "租金", "物业", "按揭", "房贷"]],
  ["水电网", ["水费", "电费", "煤气", "燃气", "话费", "网费", "宽带", "流量"]],
  ["医疗", ["药", "医院", "门诊", "体检", "牙", "医保"]],
  ["娱乐", ["电影", "游戏", "酒", "唱歌", "旅行", "旅游", "健身", "会员"]],
  ["学习", ["书", "课程", "学费", "培训", "考试", "文具"]],
  ["收入", ["工资", "收入", "奖金", "报销", "退款"]]
];

const DEFAULT_STATE = {
  records: [],
  settings: {
    monthlyBudget: 0,
    currency: "CNY",
    deepseekKey: "",
    deepseekModel: "deepseek-v4-flash",
    deepseekEndpoint: "https://api.deepseek.com/chat/completions",
    firebaseConfigText: DEFAULT_FIREBASE_CONFIG_TEXT,
    exchangeRates: FALLBACK_RATES_CNY,
    exchangeUpdatedAt: "",
    autoRates: true
  }
};

const state = loadState();
let pendingAnalysis = [];
const firebaseState = {
  app: null,
  auth: null,
  db: null,
  user: null,
  unsubAuth: null,
  unsubRecords: null,
  modules: null,
  ready: false,
  initializing: false
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  hydrateControls();
  bindEvents();
  setTodayDefaults();
  renderAll();
  renderIcons();
});

function bindElements() {
  [
    "page-title",
    "month-spend",
    "month-count",
    "budget-left",
    "budget-status",
    "projected-spend",
    "projected-status",
    "optional-spend",
    "optional-status",
    "current-month-label",
    "rates-status",
    "insight-grid",
    "category-bars",
    "tips-list",
    "recent-records",
    "expense-input",
    "analyze-input",
    "clear-input",
    "ai-status",
    "manual-form",
    "manual-date",
    "manual-amount",
    "manual-currency",
    "manual-type",
    "manual-category",
    "manual-title",
    "manual-note",
    "manual-essential",
    "analysis-panel",
    "analysis-summary",
    "analysis-results",
    "save-analysis",
    "filter-month",
    "search-records",
    "records-list",
    "export-csv",
    "export-all-json",
    "import-csv",
    "export-json",
    "mobile-menu-button",
    "sidebar-backdrop",
    "settings-form",
    "monthly-budget",
    "currency",
    "exchange-form",
    "base-currency",
    "auto-rates",
    "exchange-status",
    "show-rates",
    "rates-grid",
    "firebase-form",
    "firebase-config",
    "firebase-status",
    "browser-warning",
    "copy-site-url",
    "firebase-sign-in",
    "firebase-sign-out",
    "firebase-sync-now",
    "quick-api-form",
    "quick-deepseek-key",
    "quick-deepseek-model",
    "quick-deepseek-endpoint",
    "quick-forget-key",
    "api-form",
    "deepseek-key",
    "deepseek-model",
    "deepseek-endpoint",
    "forget-key",
    "sample-data",
    "refresh-tips",
    "toast"
  ].forEach((id) => {
    els[toCamel(id)] = document.getElementById(id);
  });
}

function hydrateControls() {
  CATEGORY_NAMES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.manualCategory.appendChild(option);
  });
  CURRENCY_OPTIONS.forEach(([code, label]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = label;
    els.manualCurrency.appendChild(option);
  });

  els.monthlyBudget.value = state.settings.monthlyBudget || "";
  els.currency.value = state.settings.currency;
  els.manualCurrency.value = "CNY";
  els.baseCurrency.value = "CNY";
  els.autoRates.checked = Boolean(state.settings.autoRates);
  updateExchangeStatus();
  els.firebaseConfig.value = state.settings.firebaseConfigText || "";
  syncApiControls();
  els.aiStatus.textContent = state.settings.deepseekKey ? "DeepSeek 已启用" : "离线分析可用";
  setFirebaseStatus(state.settings.firebaseConfigText ? "未登录" : "未连接", state.settings.firebaseConfigText ? "warning" : "");
  updateBrowserWarning();
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  document.querySelectorAll("[data-go-tab]").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.goTab));
  });

  els.mobileMenuButton.addEventListener("click", toggleSidebar);
  els.sidebarBackdrop.addEventListener("click", closeSidebar);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1040) closeSidebar();
  });

  els.analyzeInput.addEventListener("click", analyzeInput);
  els.clearInput.addEventListener("click", () => {
    els.expenseInput.value = "";
    els.analysisPanel.hidden = true;
  });
  els.manualForm.addEventListener("submit", saveManualRecord);
  els.saveAnalysis.addEventListener("click", saveSelectedAnalysis);
  els.filterMonth.addEventListener("change", renderRecords);
  els.searchRecords.addEventListener("input", renderRecords);
  els.exportCsv.addEventListener("click", exportCsv);
  els.exportAllJson.addEventListener("click", exportJson);
  els.importCsv.addEventListener("change", importCsv);
  els.exportJson.addEventListener("click", exportJson);
  els.settingsForm.addEventListener("submit", saveSettings);
  els.exchangeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.settings.autoRates = els.autoRates.checked;
    persist();
    await refreshExchangeRates(true);
  });
  els.autoRates.addEventListener("change", () => {
    state.settings.autoRates = els.autoRates.checked;
    persist();
  });
  els.showRates.addEventListener("click", renderRatesGrid);
  els.firebaseForm.addEventListener("submit", saveFirebaseSettings);
  els.copySiteUrl.addEventListener("click", copySiteUrl);
  els.firebaseSignIn.addEventListener("click", signInFirebase);
  els.firebaseSignOut.addEventListener("click", signOutFirebase);
  els.firebaseSyncNow.addEventListener("click", syncAllRecordsToCloud);
  els.apiForm.addEventListener("submit", saveApiSettings);
  els.quickApiForm.addEventListener("submit", saveApiSettings);
  els.forgetKey.addEventListener("click", forgetApiKey);
  els.quickForgetKey.addEventListener("click", forgetApiKey);
  els.sampleData.addEventListener("click", addSampleData);
  els.refreshTips.addEventListener("click", () => {
    renderTips();
    toast("建议已刷新");
  });

  initFirebaseFromSaved();
  if (state.settings.autoRates) {
    refreshExchangeRates(false);
  } else {
    renderRatesGrid();
  }
}

function setTodayDefaults() {
  const today = formatDate(new Date());
  els.manualDate.value = today;
  els.filterMonth.value = today.slice(0, 7);
}

function switchTab(tabName) {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${tabName}-panel`);
  });
  const titles = {
    dashboard: "总览",
    capture: "记一笔",
    records: "明细",
    settings: "设置"
  };
  els.pageTitle.textContent = titles[tabName] || "总览";
  closeSidebar();
}

function toggleSidebar() {
  const isOpen = document.body.classList.toggle("sidebar-open");
  els.mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
  els.mobileMenuButton.setAttribute("aria-label", isOpen ? "关闭菜单" : "打开菜单");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  els.mobileMenuButton.setAttribute("aria-expanded", "false");
  els.mobileMenuButton.setAttribute("aria-label", "打开菜单");
}

async function analyzeInput() {
  const text = els.expenseInput.value.trim();
  if (!text) {
    toast("先写一点开销内容");
    return;
  }

  els.analyzeInput.disabled = true;
  els.analyzeInput.textContent = "分析中...";

  try {
    const result = state.settings.deepseekKey
      ? await analyzeWithDeepSeek(text)
      : analyzeLocally(text);
    pendingAnalysis = normalizeEntries(result.entries || []);
    renderAnalysis(result.summary || "已识别出这些可能的开销，请确认后保存。");
    toast(state.settings.deepseekKey ? "DeepSeek 分析完成" : "本地分析完成");
  } catch (error) {
    console.warn(error);
    const fallback = analyzeLocally(text);
    pendingAnalysis = normalizeEntries(fallback.entries);
    renderAnalysis(`DeepSeek 调用失败，已改用本地分析。原因：${error.message}`);
    toast("已改用本地分析");
  } finally {
    els.analyzeInput.disabled = false;
    els.analyzeInput.innerHTML = iconHtml("wand-sparkles") + "分析输入";
    renderIcons();
  }
}

async function analyzeWithDeepSeek(text) {
  const today = formatDate(new Date());
  const systemPrompt = `你是一个中文个人记账助手。请把用户输入解析为严格 JSON，不能输出 markdown。
JSON 格式：
{
  "summary": "一句中文总结",
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "title": "开销名称",
      "amount": 35.5,
      "currency": "CNY|USD|IDR|SGD|MYR|THB|EUR|HKD|JPY|KRW|GBP|AUD",
      "type": "expense|income",
      "category": "餐饮|交通|购物|住房|水电网|医疗|娱乐|学习|收入|其他",
      "note": "简短备注",
      "essential": true
    }
  ]
}
今天日期是 ${today}。不确定日期时用今天。不确定分类时用其他。不确定币种时用 CNY。工资、奖金、报销、退款可识别为 income，其余默认 expense。金额必须是原币种数字，不要提前换算。只返回 JSON。`;

  const response = await fetch(state.settings.deepseekEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.settings.deepseekKey}`
    },
    body: JSON.stringify({
      model: state.settings.deepseekModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请输出 json：${text}` }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      stream: false
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`HTTP ${response.status} ${message.slice(0, 120)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("API 没有返回可解析内容");
  }
  return parseJsonContent(content);
}

function analyzeLocally(text) {
  const today = new Date();
  const chunks = text
    .replace(/\r/g, "\n")
    .split(/[，,；;\n。]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const entries = [];
  chunks.forEach((chunk) => {
    const cleanChunk = chunk.replace(/\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?/g, "");
    const matches = [...cleanChunk.matchAll(/(?:¥|￥|RMB|CNY|CN¥|Rp|IDR|USD|US\$|\$|SGD|S\$|MYR|RM|THB|฿|EUR|€|HKD|HK\$|JPY|日元|KRW|₩|GBP|£|AUD|A\$)?\s*(\d+(?:\.\d{1,2})?)\s*(?:元|人民币|美元|美金|刀|印尼盾|卢比|新币|新加坡元|马币|林吉特|泰铢|欧元|港币|日元|韩元|英镑|澳元)?/gi)];
    matches.forEach((match) => {
      const amount = Number(match[1]);
      if (!Number.isFinite(amount) || amount <= 0) return;
      const currency = inferCurrency(`${match[0]} ${chunk}`);
      const type = inferType(chunk);
      entries.push({
        id: createId(),
        date: inferDate(chunk, today),
        title: inferTitle(chunk, match[0]),
        originalAmount: amount,
        originalCurrency: currency,
        amount: convertToCny(amount, currency),
        exchangeRateToCny: getRateToCny(currency),
        type,
        category: inferCategory(chunk),
        note: chunk,
        essential: inferEssential(chunk),
        source: "local"
      });
    });
  });

  return {
    summary: entries.length
      ? `本地识别到 ${entries.length} 笔记录，折合人民币 ${formatMoney(sum(entries.filter((entry) => entry.type !== "income").map((entry) => entry.amount)))}。`
      : "没有识别到金额，请试试写成“午饭 35 元，打车 10 美元”。",
    entries
  };
}

function inferDate(text, today) {
  const dateText = text.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?/);
  if (dateText) {
    return formatDate(new Date(Number(dateText[1]), Number(dateText[2]) - 1, Number(dateText[3])));
  }
  const date = new Date(today);
  if (/前天/.test(text)) date.setDate(date.getDate() - 2);
  else if (/昨天|昨日/.test(text)) date.setDate(date.getDate() - 1);
  else if (/明天/.test(text)) date.setDate(date.getDate() + 1);
  return formatDate(date);
}

function inferTitle(text, amountText) {
  return text
    .replace(amountText, "")
    .replace(/今天|昨天|昨日|前天|明天/g, "")
    .replace(/[花了花费消费支出买支付]/g, "")
    .trim()
    .slice(0, 28) || "未命名开销";
}

function inferCategory(text) {
  const lowerText = text.toLowerCase();
  const hit = CATEGORY_KEYWORDS.find(([, keywords]) => keywords.some((keyword) => lowerText.includes(keyword.toLowerCase())));
  return hit ? hit[0] : "其他";
}

function inferCurrency(text) {
  const lower = String(text).toLowerCase();
  const rules = [
    ["IDR", /rp|idr|印尼盾|卢比|rupiah/i],
    ["SGD", /sgd|s\$|新币|新加坡元/i],
    ["MYR", /myr|rm|马币|林吉特/i],
    ["THB", /thb|฿|泰铢/i],
    ["EUR", /eur|€|欧元/i],
    ["HKD", /hkd|hk\$|港币/i],
    ["JPY", /jpy|日元/i],
    ["KRW", /krw|₩|韩元/i],
    ["GBP", /gbp|£|英镑/i],
    ["AUD", /aud|a\$|澳元/i],
    ["USD", /usd|us\$|\$|美元|美金|刀/i],
    ["CNY", /cny|rmb|人民币|￥|¥|元/i]
  ];
  return rules.find(([, pattern]) => pattern.test(lower))?.[0] || "CNY";
}

function inferType(text) {
  return /收入|工资|奖金|报销|退款|返现|收款|转入/.test(text) ? "income" : "expense";
}

function inferEssential(text) {
  return /房租|租金|水费|电费|燃气|药|医院|学费|交通|公交|地铁|菜|超市|早餐|午饭|晚饭/.test(text);
}

function normalizeEntries(entries) {
  return entries
    .map((entry) => {
      const originalCurrency = normalizeCurrency(entry.originalCurrency || entry.currency || inferCurrency(`${entry.title || ""} ${entry.note || ""}`));
      const originalAmount = Math.abs(Number(entry.originalAmount ?? entry.amount ?? 0));
      const amount = convertToCny(originalAmount, originalCurrency);
      const type = entry.type === "income" || entry.category === "收入" ? "income" : "expense";
      return {
        id: createId(),
        date: isValidDate(entry.date) ? entry.date : formatDate(new Date()),
        title: String(entry.title || "未命名开销").slice(0, 48),
        amount,
        originalAmount,
        originalCurrency,
        exchangeRateToCny: getRateToCny(originalCurrency),
        type,
        category: type === "income" ? "收入" : (CATEGORY_NAMES.includes(entry.category) ? entry.category : inferCategory(`${entry.title || ""} ${entry.note || ""}`)),
        note: String(entry.note || "").slice(0, 120),
        essential: Boolean(entry.essential),
        source: entry.source || "deepseek",
        createdAt: new Date().toISOString()
      };
    })
    .filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0);
}

function renderAnalysis(summary) {
  els.analysisPanel.hidden = false;
  els.analysisSummary.textContent = summary;
  els.analysisResults.innerHTML = "";

  if (!pendingAnalysis.length) {
    els.analysisResults.innerHTML = `<div class="empty-state">没有可保存的记录。</div>`;
    return;
  }

  pendingAnalysis.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "analysis-row";
    row.dataset.index = index;
    row.innerHTML = `
      <input type="checkbox" checked aria-label="选择记录" />
      <input type="text" value="${escapeHtml(entry.title)}" aria-label="名称" />
      <input type="number" min="0.01" step="0.01" value="${entry.originalAmount || entry.amount}" aria-label="原币金额" />
      <select aria-label="币种">${CURRENCY_OPTIONS.map(([code, label]) => `<option value="${code}" ${code === entry.originalCurrency ? "selected" : ""}>${label}</option>`).join("")}</select>
      <select aria-label="类型"><option value="expense" ${entry.type !== "income" ? "selected" : ""}>支出</option><option value="income" ${entry.type === "income" ? "selected" : ""}>收入</option></select>
      <select aria-label="分类">${CATEGORY_NAMES.map((category) => `<option value="${category}" ${category === entry.category ? "selected" : ""}>${category}</option>`).join("")}</select>
      <input type="date" value="${entry.date}" aria-label="日期" />
    `;
    els.analysisResults.appendChild(row);
  });
}

function saveSelectedAnalysis() {
  const rows = [...els.analysisResults.querySelectorAll(".analysis-row")];
  const selected = rows
    .filter((row) => row.querySelector("input[type='checkbox']").checked)
    .map((row) => {
      const index = Number(row.dataset.index);
      const controls = row.querySelectorAll("input, select");
      return {
        ...pendingAnalysis[index],
        title: controls[1].value.trim() || pendingAnalysis[index].title,
        originalAmount: Number(controls[2].value),
        originalCurrency: controls[3].value,
        amount: convertToCny(Number(controls[2].value), controls[3].value),
        exchangeRateToCny: getRateToCny(controls[3].value),
        type: controls[4].value,
        category: controls[4].value === "income" ? "收入" : controls[5].value,
        date: controls[6].value
      };
    })
    .filter((entry) => entry.amount > 0 && isValidDate(entry.date));

  if (!selected.length) {
    toast("没有选中的记录");
    return;
  }

  state.records.push(...selected);
  persist();
  saveRecordsToCloud(selected);
  pendingAnalysis = [];
  els.analysisPanel.hidden = true;
  els.expenseInput.value = "";
  renderAll();
  switchTab("dashboard");
  toast(`已保存 ${selected.length} 笔记录`);
}

function saveManualRecord(event) {
  event.preventDefault();
  const originalCurrency = els.manualCurrency.value;
  const originalAmount = Number(els.manualAmount.value);
  const type = els.manualType.value;
  const record = {
    id: createId(),
    date: els.manualDate.value,
    title: els.manualTitle.value.trim(),
    amount: convertToCny(originalAmount, originalCurrency),
    originalAmount,
    originalCurrency,
    exchangeRateToCny: getRateToCny(originalCurrency),
    type,
    category: type === "income" ? "收入" : els.manualCategory.value,
    note: els.manualNote.value.trim(),
    essential: els.manualEssential.checked,
    source: "manual",
    createdAt: new Date().toISOString()
  };

  if (!record.title || !record.amount || !isValidDate(record.date)) {
    toast("请补全日期、金额和名称");
    return;
  }

  state.records.push(record);
  persist();
  saveRecordsToCloud([record]);
  event.target.reset();
  els.manualDate.value = formatDate(new Date());
  els.manualCurrency.value = "CNY";
  els.manualType.value = "expense";
  renderAll();
  toast(`已保存，折合人民币 ${formatMoney(record.amount)}`);
}

function renderAll() {
  renderDashboard();
  renderRecords();
  els.aiStatus.textContent = state.settings.deepseekKey ? "DeepSeek 已启用" : "离线分析可用";
}

function renderDashboard() {
  const month = els.filterMonth.value || formatDate(new Date()).slice(0, 7);
  const records = recordsForMonth(month);
  const expenses = records.filter((record) => getRecordType(record) !== "income");
  const income = records.filter((record) => getRecordType(record) === "income");
  const total = sum(expenses.map((record) => record.amount));
  const incomeTotal = sum(income.map((record) => record.amount));
  const budget = Number(state.settings.monthlyBudget || 0);
  const optional = sum(expenses.filter((record) => !record.essential).map((record) => record.amount));
  const projected = projectMonthSpend(expenses, month);

  els.currentMonthLabel.textContent = month;
  els.monthSpend.textContent = formatMoney(total);
  els.monthCount.textContent = `${expenses.length} 笔支出，收入 ${formatMoney(incomeTotal)}`;
  els.budgetLeft.textContent = budget ? formatMoney(Math.max(budget - total, 0)) : formatMoney(0);
  els.budgetStatus.textContent = budget ? (total <= budget ? "预算内" : `已超 ${formatMoney(total - budget)}`) : "还没有设置月预算";
  els.projectedSpend.textContent = formatMoney(projected);
  els.projectedStatus.textContent = budget && projected > budget ? "按当前节奏可能超预算" : "按目前节奏估算";
  els.optionalSpend.textContent = formatMoney(optional);
  els.optionalStatus.textContent = optional ? "非必要支出合计" : "暂时没有明显可优化项";

  renderCategoryBars(expenses);
  renderTips();
  renderRecentRecords();
  renderInsights(records, expenses, income, projected);
  updateExchangeStatus();
}

function renderCategoryBars(records) {
  const totals = CATEGORY_NAMES
    .filter((category) => category !== "收入")
    .map((category) => ({
      category,
      total: sum(records.filter((record) => record.category === category).map((record) => record.amount))
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  els.categoryBars.innerHTML = "";
  if (!totals.length) {
    els.categoryBars.innerHTML = `<div class="empty-state">本月还没有记录。</div>`;
    return;
  }

  const max = Math.max(...totals.map((item) => item.total));
  totals.forEach((item) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${item.category}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, (item.total / max) * 100)}%"></div></div>
      <span class="bar-value">${formatMoney(item.total)}</span>
    `;
    els.categoryBars.appendChild(row);
  });
}

function renderInsights(records, expenses, income, projected) {
  const spent = sum(expenses.map((record) => record.amount));
  const earned = sum(income.map((record) => record.amount));
  const net = earned - spent;
  const biggest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  const dailyAverage = spent / Math.max(new Date().getDate(), 1);
  const foreignCount = records.filter((record) => normalizeCurrency(record.originalCurrency || "CNY") !== "CNY").length;
  const items = [
    ["本月收入", formatMoney(earned), income.length ? `${income.length} 笔收入` : "暂无收入记录"],
    ["本月结余", formatMoney(net), net >= 0 ? "收入覆盖支出" : "支出高于收入"],
    ["日均支出", formatMoney(dailyAverage), "按本月已过天数估算"],
    ["最大一笔", biggest ? formatMoney(biggest.amount) : formatMoney(0), biggest ? biggest.title : "暂无支出"],
    ["月底预计", formatMoney(projected), "只按支出节奏估算"],
    ["外币记录", `${foreignCount} 笔`, "已自动折算成人民币"]
  ];

  els.insightGrid.innerHTML = items.map(([label, value, hint]) => `
    <div class="insight-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(hint)}</small>
    </div>
  `).join("");
}

function renderTips() {
  const month = els.filterMonth.value || formatDate(new Date()).slice(0, 7);
  const records = recordsForMonth(month);
  const tips = buildTips(records);
  els.tipsList.innerHTML = "";
  tips.forEach((tip) => {
    const item = document.createElement("div");
    item.className = "tip";
    item.innerHTML = `<strong>${escapeHtml(tip.title)}</strong><p>${escapeHtml(tip.body)}</p>`;
    els.tipsList.appendChild(item);
  });
}

function buildTips(records) {
  const expenses = records.filter((record) => getRecordType(record) !== "income");
  if (!expenses.length) {
    return [
      { title: "先建立 7 天样本", body: "连续记录一周后，分类趋势会更准，省钱建议也会更具体。" },
      { title: "从高频小额开始", body: "咖啡、外卖、打车这类小额高频开销，通常最容易优化。" }
    ];
  }

  const optionalRecords = expenses.filter((record) => !record.essential);
  const categoryTotals = CATEGORY_NAMES.map((category) => ({
    category,
    total: sum(optionalRecords.filter((record) => record.category === category).map((record) => record.amount))
  })).sort((a, b) => b.total - a.total);

  const top = categoryTotals[0];
  const budget = Number(state.settings.monthlyBudget || 0);
  const total = sum(expenses.map((record) => record.amount));
  const projected = projectMonthSpend(expenses, records[0]?.date?.slice(0, 7) || formatDate(new Date()).slice(0, 7));
  const tips = [];

  if (top?.total > 0) {
    tips.push({
      title: `优先看 ${top.category}`,
      body: `${top.category} 的非必要支出是 ${formatMoney(top.total)}。先砍 15%，大约能省 ${formatMoney(top.total * 0.15)}。`
    });
  }

  if (budget && projected > budget) {
    tips.push({
      title: "预算节奏偏快",
      body: `按当前速度月底可能到 ${formatMoney(projected)}，比预算多 ${formatMoney(projected - budget)}。从今天开始每天少花 ${formatMoney((projected - budget) / daysLeftInMonth())} 就能拉回预算内。`
    });
  } else if (budget) {
    tips.push({
      title: "预算节奏健康",
      body: `本月已花 ${formatMoney(total)}，按目前节奏还在预算附近。可以把剩余额度分成每天可用金额。`
    });
  }

  const smallFrequent = optionalRecords.filter((record) => record.amount <= average(expenses.map((record) => record.amount)) || record.amount < 50);
  if (smallFrequent.length >= 3) {
    tips.push({
      title: "小额高频值得留意",
      body: `本月已有 ${smallFrequent.length} 笔小额非必要开销，合计 ${formatMoney(sum(smallFrequent.map((record) => record.amount)))}。给它们设一个周额度会更好控制。`
    });
  }

  return tips.slice(0, 3).concat(tips.length ? [] : [{ title: "记录质量不错", body: "继续区分必要和非必要支出，月底复盘会很清楚。" }]);
}

function renderRecentRecords() {
  const records = state.records.map(normalizeRecordShape).sort((a, b) => `${b.date}${b.createdAt || ""}`.localeCompare(`${a.date}${a.createdAt || ""}`)).slice(0, 5);
  renderRecordList(els.recentRecords, records, true);
}

function renderRecords() {
  const month = els.filterMonth.value;
  const keyword = els.searchRecords.value.trim().toLowerCase();
  let records = month ? recordsForMonth(month) : state.records.map(normalizeRecordShape);
  if (keyword) {
    records = records.filter((record) => [record.title, record.category, record.note, record.date, record.originalCurrency, record.type].join(" ").toLowerCase().includes(keyword));
  }
  records.sort((a, b) => `${b.date}${b.createdAt || ""}`.localeCompare(`${a.date}${a.createdAt || ""}`));
  renderRecordList(els.recordsList, records, false);
  renderDashboard();
}

function renderRecordList(container, records, compact) {
  container.innerHTML = "";
  if (!records.length) {
    container.innerHTML = `<div class="empty-state">${compact ? "最近还没有记录。" : "没有找到记录。"}</div>`;
    return;
  }

  records.forEach((record) => {
    const type = getRecordType(record);
    const originalText = formatOriginalMoney(record);
    const item = document.createElement("div");
    item.className = "record-item";
    item.innerHTML = `
      <div class="record-main">
        <strong>${escapeHtml(record.title)}</strong>
        <span>${record.date} · ${type === "income" ? "收入" : "支出"} · ${escapeHtml(record.category)}${record.essential ? " · 必要" : ""}${originalText ? ` · ${escapeHtml(originalText)}` : ""}</span>
      </div>
      <div class="record-amount ${type === "income" ? "income" : ""}">${type === "income" ? "+" : "-"}${formatMoney(record.amount)}</div>
      ${compact ? "" : `<button class="delete-record" type="button" title="删除" data-id="${record.id}">${iconHtml("trash-2")}</button>`}
    `;
    container.appendChild(item);
  });

  container.querySelectorAll(".delete-record").forEach((button) => {
    button.addEventListener("click", () => deleteRecord(button.dataset.id));
  });
  renderIcons();
}

function deleteRecord(id) {
  const index = state.records.findIndex((record) => record.id === id);
  if (index === -1) return;
  state.records.splice(index, 1);
  persist();
  deleteRecordFromCloud(id);
  renderAll();
  toast("已删除");
}

function saveSettings(event) {
  event.preventDefault();
  state.settings.monthlyBudget = Number(els.monthlyBudget.value || 0);
  state.settings.currency = "CNY";
  persist();
  saveCloudSettings();
  renderAll();
  toast("设置已保存");
}

async function saveFirebaseSettings(event) {
  event.preventDefault();
  state.settings.firebaseConfigText = els.firebaseConfig.value.trim();
  persist();
  if (!state.settings.firebaseConfigText) {
    setFirebaseStatus("未连接", "");
    toast("Firebase 配置为空");
    return;
  }
  await initFirebaseFromSaved(true);
  toast("Firebase 配置已保存");
}

async function initFirebaseFromSaved(force = false) {
  if (!state.settings.firebaseConfigText) return;
  if (firebaseState.initializing) return;
  if (firebaseState.ready && !force) return;

  firebaseState.initializing = true;
  setFirebaseStatus("连接中", "warning");
  try {
    const config = parseFirebaseConfig(state.settings.firebaseConfigText);
    firebaseState.modules = await loadFirebaseModules();
    const {
      initializeApp,
      getApps,
      getAuth,
      browserLocalPersistence,
      setPersistence,
      onAuthStateChanged,
      getFirestore
    } = firebaseState.modules;

    firebaseState.app = getApps().length ? getApps()[0] : initializeApp(config);
    firebaseState.auth = getAuth(firebaseState.app);
    firebaseState.db = getFirestore(firebaseState.app);
    await setPersistence(firebaseState.auth, browserLocalPersistence);
    firebaseState.ready = true;

    if (firebaseState.unsubAuth) {
      firebaseState.unsubAuth();
    }
    firebaseState.unsubAuth = onAuthStateChanged(firebaseState.auth, async (user) => {
      firebaseState.user = user;
      if (user) {
        setFirebaseStatus("已登录", "");
        await migrateLocalRecordsToCloud();
        await saveCloudSettings();
        listenCloudRecords();
        toast("Firebase 已连接");
      } else {
        stopCloudListener();
        setFirebaseStatus("未登录", "warning");
      }
    });
  } catch (error) {
    console.warn(error);
    firebaseState.ready = false;
    setFirebaseStatus("连接失败", "warning");
    toast(firebaseErrorMessage(error));
  } finally {
    firebaseState.initializing = false;
  }
}

async function loadFirebaseModules() {
  if (firebaseState.modules) return firebaseState.modules;
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);
  return { ...appModule, ...authModule, ...firestoreModule };
}

async function signInFirebase() {
  if (isBlockedOAuthBrowser()) {
    updateBrowserWarning();
    toast("当前内置浏览器不能 Google 登录，请复制网址到 Chrome 或 Safari 打开");
    return;
  }
  if (!firebaseState.ready) {
    await initFirebaseFromSaved(true);
  }
  if (!firebaseState.auth) {
    toast("请先保存 Firebase 配置");
    return;
  }
  try {
    const { GoogleAuthProvider, signInWithRedirect } = firebaseState.modules;
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(firebaseState.auth, provider);
  } catch (error) {
    console.warn(error);
    toast(firebaseErrorMessage(error));
  }
}

function isBlockedOAuthBrowser() {
  const ua = navigator.userAgent || "";
  return /MicroMessenger|WeChat|Line\/|FBAN|FBAV|Instagram|Twitter|TikTok|wv\)/i.test(ua);
}

function updateBrowserWarning() {
  if (!els.browserWarning) return;
  els.browserWarning.hidden = !isBlockedOAuthBrowser();
}

async function copySiteUrl() {
  const url = location.href.split("#")[0];
  try {
    await navigator.clipboard.writeText(url);
    toast("网址已复制，请到 Chrome 或 Safari 打开");
  } catch {
    prompt("复制这个网址到 Chrome 或 Safari 打开：", url);
  }
}

async function signOutFirebase() {
  if (!firebaseState.auth) return;
  await firebaseState.modules.signOut(firebaseState.auth);
  toast("已退出 Firebase");
}

function listenCloudRecords() {
  if (!firebaseState.user || !firebaseState.db) return;
  stopCloudListener();
  const { collection, onSnapshot } = firebaseState.modules;
  const recordsRef = collection(firebaseState.db, "users", firebaseState.user.uid, "records");
  firebaseState.unsubRecords = onSnapshot(recordsRef, (snapshot) => {
    state.records = snapshot.docs.map((docSnap) => normalizeCloudRecord(docSnap.id, docSnap.data()));
    persist();
    renderAll();
  }, (error) => {
    console.warn(error);
    toast(`云端读取失败：${error.message}`);
  });
}

function stopCloudListener() {
  if (firebaseState.unsubRecords) {
    firebaseState.unsubRecords();
    firebaseState.unsubRecords = null;
  }
}

async function migrateLocalRecordsToCloud() {
  if (!state.records.length) return;
  await saveRecordsToCloud(state.records, false);
}

async function saveRecordsToCloud(records, showMessage = true) {
  if (!firebaseState.user || !firebaseState.db || !records?.length) return;
  try {
    const { doc, setDoc } = firebaseState.modules;
    await Promise.all(records.map((record) => {
      record = normalizeRecordShape(record);
      const id = record.id || createId();
      record.id = id;
      return setDoc(doc(firebaseState.db, "users", firebaseState.user.uid, "records", id), {
        ...record,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }));
    if (showMessage) setFirebaseStatus("已同步", "");
  } catch (error) {
    console.warn(error);
    setFirebaseStatus("同步失败", "warning");
    toast(`云端同步失败：${error.message}`);
  }
}

async function deleteRecordFromCloud(id) {
  if (!firebaseState.user || !firebaseState.db || !id) return;
  try {
    const { doc, deleteDoc } = firebaseState.modules;
    await deleteDoc(doc(firebaseState.db, "users", firebaseState.user.uid, "records", id));
    setFirebaseStatus("已同步", "");
  } catch (error) {
    console.warn(error);
    toast(`云端删除失败：${error.message}`);
  }
}

async function syncAllRecordsToCloud() {
  if (!firebaseState.user) {
    toast("请先登录 Firebase");
    return;
  }
  await saveRecordsToCloud(state.records);
  await saveCloudSettings();
  toast("全部记录已同步到 Firebase");
}

async function saveCloudSettings() {
  if (!firebaseState.user || !firebaseState.db) return;
  try {
    const { doc, setDoc } = firebaseState.modules;
    await setDoc(doc(firebaseState.db, "users", firebaseState.user.uid, "meta", "settings"), {
      monthlyBudget: Number(state.settings.monthlyBudget || 0),
      currency: state.settings.currency,
      exchangeRates: state.settings.exchangeRates,
      exchangeUpdatedAt: state.settings.exchangeUpdatedAt,
      deepseekModel: state.settings.deepseekModel,
      deepseekEndpoint: state.settings.deepseekEndpoint,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn(error);
  }
}

function parseFirebaseConfig(input) {
  const trimmed = input.trim();
  const match = trimmed.match(/firebaseConfig\s*=\s*({[\s\S]*?});?/) || trimmed.match(/({[\s\S]*})/);
  if (!match) {
    throw new Error("没有找到 firebaseConfig 对象");
  }
  const config = Function(`"use strict"; return (${match[1]});`)();
  if (!config.apiKey || !config.projectId || !config.authDomain) {
    throw new Error("配置里需要 apiKey、authDomain、projectId");
  }
  return config;
}

function normalizeCloudRecord(id, data) {
  return normalizeRecordShape({
    id,
    date: isValidDate(data.date) ? data.date : formatDate(new Date()),
    title: String(data.title || "未命名开销"),
    amount: Number(data.amount || 0),
    originalAmount: Number(data.originalAmount || data.amount || 0),
    originalCurrency: normalizeCurrency(data.originalCurrency || "CNY"),
    exchangeRateToCny: Number(data.exchangeRateToCny || getRateToCny(data.originalCurrency || "CNY")),
    type: data.type === "income" || data.category === "收入" ? "income" : "expense",
    category: CATEGORY_NAMES.includes(data.category) ? data.category : "其他",
    note: String(data.note || ""),
    essential: Boolean(data.essential),
    source: data.source || "cloud",
    createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
    updatedAt: data.updatedAt || ""
  });
}

function setFirebaseStatus(text, variant) {
  els.firebaseStatus.textContent = text;
  els.firebaseStatus.classList.toggle("warning", variant === "warning");
}

function firebaseErrorMessage(error) {
  const message = error?.message || String(error);
  if (message.includes("auth/api-key-not-valid")) {
    return "Firebase apiKey 不正确。请从 Firebase 控制台复制完整 Web SDK 配置，粘贴后点保存 Firebase。";
  }
  if (message.includes("auth/unauthorized-domain")) {
    return "当前网站域名未授权。请在 Firebase Authentication 的授权网域加入 zhaop531-arch.github.io。";
  }
  if (message.includes("auth/popup-blocked")) {
    return "浏览器拦截了登录弹窗，请允许弹窗后再点 Google 登录。";
  }
  if (message.includes("disallowed_useragent") || message.includes("403")) {
    return "Google 不允许在微信等内置浏览器登录。请复制网址到 Chrome 或 Safari 打开。";
  }
  return `Firebase 错误：${message}`;
}

function saveApiSettings(event) {
  event.preventDefault();
  const fromQuickForm = event.target.id === "quick-api-form";
  state.settings.deepseekKey = (fromQuickForm ? els.quickDeepseekKey : els.deepseekKey).value.trim();
  state.settings.deepseekModel = (fromQuickForm ? els.quickDeepseekModel : els.deepseekModel).value;
  state.settings.deepseekEndpoint = (fromQuickForm ? els.quickDeepseekEndpoint : els.deepseekEndpoint).value.trim() || DEFAULT_STATE.settings.deepseekEndpoint;
  persist();
  syncApiControls();
  saveCloudSettings();
  renderAll();
  toast(state.settings.deepseekKey ? "DeepSeek API 已保存" : "未填写 key，将使用离线分析");
}

function forgetApiKey() {
  state.settings.deepseekKey = "";
  persist();
  syncApiControls();
  renderAll();
  toast("API key 已清除");
}

function syncApiControls() {
  els.deepseekKey.value = state.settings.deepseekKey || "";
  els.deepseekModel.value = state.settings.deepseekModel;
  els.deepseekEndpoint.value = state.settings.deepseekEndpoint;
  els.quickDeepseekKey.value = state.settings.deepseekKey || "";
  els.quickDeepseekModel.value = state.settings.deepseekModel;
  els.quickDeepseekEndpoint.value = state.settings.deepseekEndpoint;
}

function exportCsv() {
  const headers = ["date", "title", "type", "originalAmount", "originalCurrency", "amountCny", "exchangeRateToCny", "category", "essential", "note", "source"];
  const rows = state.records.map((record) => {
    const normalized = normalizeRecordShape(record);
    const row = { ...normalized, amountCny: normalized.amount };
    return headers.map((key) => csvCell(row[key])).join(",");
  });
  downloadFile(`spend-save-${formatDate(new Date())}.csv`, [headers.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
}

function importCsv(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const imported = parseCsv(String(reader.result || ""));
    state.records.push(...imported);
    persist();
    saveRecordsToCloud(imported);
    renderAll();
    toast(`已导入 ${imported.length} 笔记录`);
    event.target.value = "";
  };
  reader.readAsText(file, "utf-8");
}

function exportJson() {
  const exportData = {
    exportedAt: new Date().toISOString(),
    source: firebaseState.user ? "firebase" : "localStorage",
    user: firebaseState.user ? {
      uid: firebaseState.user.uid,
      email: firebaseState.user.email || ""
    } : null,
    records: state.records.map(normalizeRecordShape),
    settings: {
      monthlyBudget: state.settings.monthlyBudget,
      currency: state.settings.currency,
      exchangeRates: state.settings.exchangeRates,
      exchangeUpdatedAt: state.settings.exchangeUpdatedAt,
      deepseekModel: state.settings.deepseekModel,
      deepseekEndpoint: state.settings.deepseekEndpoint
    }
  };
  downloadFile(`spend-save-all-history-${formatDate(new Date())}.json`, JSON.stringify(exportData, null, 2), "application/json;charset=utf-8");
}

function addSampleData() {
  if (state.records.length && !confirm("添加示例数据会混在当前记录里，继续吗？")) return;
  const today = new Date();
  const newSamples = [];
  const samples = [
    ["午饭", 36, "CNY", "餐饮", true, 0],
    ["打车去客户那里", 42, "CNY", "交通", true, 0],
    ["咖啡", 4.5, "USD", "餐饮", false, -1],
    ["超市买菜", 50000, "IDR", "餐饮", true, -2],
    ["电影票", 88, "CNY", "娱乐", false, -3],
    ["网费", 120, "CNY", "水电网", true, -4],
    ["衬衫", 38, "SGD", "购物", false, -5],
    ["工资", 8000, "CNY", "收入", true, -6]
  ];

  samples.forEach(([title, originalAmount, originalCurrency, category, essential, offset]) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    newSamples.push({
      id: createId(),
      date: formatDate(date),
      title,
      amount: convertToCny(originalAmount, originalCurrency),
      originalAmount,
      originalCurrency,
      exchangeRateToCny: getRateToCny(originalCurrency),
      type: category === "收入" ? "income" : "expense",
      category,
      essential,
      note: "示例数据",
      source: "sample",
      createdAt: new Date().toISOString()
    });
  });
  state.records.push(...newSamples);
  persist();
  saveRecordsToCloud(newSamples);
  renderAll();
  toast("示例数据已添加");
}

function recordsForMonth(month) {
  return state.records.map(normalizeRecordShape).filter((record) => record.date?.startsWith(month));
}

async function refreshExchangeRates(force) {
  if (!force && !shouldRefreshRates()) {
    updateExchangeStatus();
    renderRatesGrid();
    return;
  }
  setExchangeStatus("汇率更新中", "warning");
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/CNY");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.result !== "success" || !data.rates?.USD) throw new Error("汇率接口返回异常");
    state.settings.exchangeRates = { ...FALLBACK_RATES_CNY, ...pickRates(data.rates) };
    state.settings.exchangeUpdatedAt = data.time_last_update_utc || new Date().toISOString();
    persist();
    saveCloudSettings();
    renderAll();
    renderRatesGrid();
    setExchangeStatus("汇率已更新", "");
    if (force) toast("汇率已更新，之后会自动折算成人民币");
  } catch (error) {
    console.warn(error);
    state.settings.exchangeRates = { ...FALLBACK_RATES_CNY, ...(state.settings.exchangeRates || {}) };
    persist();
    renderRatesGrid();
    setExchangeStatus("使用备用汇率", "warning");
    if (force) toast("汇率更新失败，已使用备用汇率");
  }
}

function shouldRefreshRates() {
  if (!state.settings.exchangeUpdatedAt) return true;
  const updated = new Date(state.settings.exchangeUpdatedAt).getTime();
  if (Number.isNaN(updated)) return true;
  return Date.now() - updated > 12 * 60 * 60 * 1000;
}

function pickRates(rates) {
  return Object.fromEntries(CURRENCY_OPTIONS.map(([code]) => [code, Number(rates[code] || FALLBACK_RATES_CNY[code] || 1)]));
}

function renderRatesGrid() {
  if (!els.ratesGrid) return;
  const rates = currentRates();
  els.ratesGrid.innerHTML = CURRENCY_OPTIONS
    .filter(([code]) => code !== "CNY")
    .map(([code, label]) => {
      const toCny = getRateToCny(code);
      return `<div class="rate-item"><span>${escapeHtml(label)}</span><strong>1 ${code} = ${formatMoney(toCny)}</strong></div>`;
    })
    .join("");
  updateExchangeStatus();
}

function updateExchangeStatus() {
  const text = state.settings.exchangeUpdatedAt
    ? `汇率：${formatRateTime(state.settings.exchangeUpdatedAt)}`
    : "备用汇率";
  setExchangeStatus(text, state.settings.exchangeUpdatedAt ? "" : "warning");
  if (els.ratesStatus) {
    els.ratesStatus.textContent = text;
    els.ratesStatus.classList.toggle("warning", !state.settings.exchangeUpdatedAt);
  }
}

function setExchangeStatus(text, variant) {
  if (!els.exchangeStatus) return;
  els.exchangeStatus.textContent = text;
  els.exchangeStatus.classList.toggle("warning", variant === "warning");
}

function currentRates() {
  return { ...FALLBACK_RATES_CNY, ...(state.settings.exchangeRates || {}) };
}

function normalizeCurrency(currency) {
  const code = String(currency || "CNY").toUpperCase();
  return CURRENCY_OPTIONS.some(([item]) => item === code) ? code : "CNY";
}

function getRateToCny(currency) {
  const code = normalizeCurrency(currency);
  const rates = currentRates();
  const ratePerCny = Number(rates[code] || 1);
  return code === "CNY" ? 1 : 1 / ratePerCny;
}

function convertToCny(amount, currency) {
  return roundMoney(Number(amount || 0) * getRateToCny(currency));
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function getRecordType(record) {
  return record.type === "income" || record.category === "收入" ? "income" : "expense";
}

function normalizeRecordShape(record) {
  const originalCurrency = normalizeCurrency(record.originalCurrency || record.currency || "CNY");
  const originalAmount = Number(record.originalAmount ?? record.amount ?? 0);
  const amount = Number(record.amount || 0) || convertToCny(originalAmount, originalCurrency);
  return {
    ...record,
    originalCurrency,
    originalAmount,
    amount: roundMoney(amount),
    exchangeRateToCny: Number(record.exchangeRateToCny || getRateToCny(originalCurrency)),
    type: getRecordType(record)
  };
}

function formatOriginalMoney(record) {
  const normalized = normalizeRecordShape(record);
  if (normalized.originalCurrency === "CNY") return "";
  return `${formatCurrencyAmount(normalized.originalAmount, normalized.originalCurrency)} -> ${formatMoney(normalized.amount)}`;
}

function formatCurrencyAmount(value, currency) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: normalizeCurrency(currency),
    maximumFractionDigits: currency === "IDR" || currency === "JPY" || currency === "KRW" ? 0 : 2
  }).format(Number(value || 0));
}

function formatRateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已缓存";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function projectMonthSpend(records, month) {
  if (!records.length) return 0;
  const total = sum(records.map((record) => record.amount));
  const [year, monthIndex] = month.split("-").map(Number);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === monthIndex;
  const daysElapsed = isCurrentMonth ? now.getDate() : new Date(year, monthIndex, 0).getDate();
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  return (total / Math.max(daysElapsed, 1)) * daysInMonth;
}

function daysLeftInMonth() {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(daysInMonth - now.getDate() + 1, 1);
}

function parseJsonContent(content) {
  const stripped = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(stripped);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines.shift() || "");
  return lines.map((line) => {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
    return {
      id: createId(),
      date: isValidDate(row.date) ? row.date : formatDate(new Date()),
      title: row.title || "导入记录",
      originalAmount: Number(row.originalAmount || row.amount || row.amountCny || 0),
      originalCurrency: normalizeCurrency(row.originalCurrency || "CNY"),
      amount: Number(row.amountCny || row.amount || 0) || convertToCny(Number(row.originalAmount || 0), row.originalCurrency || "CNY"),
      exchangeRateToCny: Number(row.exchangeRateToCny || getRateToCny(row.originalCurrency || "CNY")),
      type: row.type === "income" || row.category === "收入" ? "income" : "expense",
      category: row.type === "income" || row.category === "收入" ? "收入" : (CATEGORY_NAMES.includes(row.category) ? row.category : "其他"),
      essential: String(row.essential).toLowerCase() === "true",
      note: row.note || "",
      source: row.source || "import",
      createdAt: new Date().toISOString()
    };
  }).filter((record) => record.amount > 0);
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      i += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function loadState() {
  try {
    return mergeState(DEFAULT_STATE, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function mergeState(base, saved) {
  const merged = {
    records: Array.isArray(saved.records) ? saved.records : [],
    settings: { ...base.settings, ...(saved.settings || {}) }
  };
  if (!merged.settings.firebaseConfigText) {
    merged.settings.firebaseConfigText = DEFAULT_FIREBASE_CONFIG_TEXT;
  }
  merged.settings.exchangeRates = { ...FALLBACK_RATES_CNY, ...(merged.settings.exchangeRates || {}) };
  merged.settings.currency = "CNY";
  return merged;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatMoney(value) {
  const currency = state.settings.currency || "CNY";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2
  }).format(Number(value || 0));
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function average(values) {
  return values.length ? sum(values) / values.length : 0;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function iconHtml(name) {
  return `<span data-icon="${name}"></span>`;
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "aria-hidden": "true"
      }
    });
  }
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}
