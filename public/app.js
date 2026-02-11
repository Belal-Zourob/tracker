// ---- DOM ----
const loginCard = document.getElementById("loginCard");
const appCard = document.getElementById("appCard");

const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginBtn = document.getElementById("loginBtn");
const loginErr = document.getElementById("loginErr");

const meEl = document.getElementById("me");
const logoutBtn = document.getElementById("logoutBtn");
const langNlBtn = document.getElementById("langNl");
const langEnBtn = document.getElementById("langEn");

const prevWeekBtn = document.getElementById("prevWeek");
const nextWeekBtn = document.getElementById("nextWeek");
const todayBtn = document.getElementById("today");
const weekLabelEl = document.getElementById("weekLabel");

const daySelect = document.getElementById("daySelect");
const subjectSelect = document.getElementById("subjectSelect");
const typeSelect = document.getElementById("typeSelect");
const hoursInput = document.getElementById("hoursInput");
const noteInput = document.getElementById("noteInput");
const addEntryBtn = document.getElementById("addEntry");
const clearWeekBtn = document.getElementById("clearWeek");

const newSubject = document.getElementById("newSubject");
const addSubjectBtn = document.getElementById("addSubject");
const subjectList = document.getElementById("subjectList");

const daysEl = document.getElementById("days");
const weekTotalEl = document.getElementById("weekTotal");
const dayTotalEl = document.getElementById("dayTotal");

const appTitleEl = document.getElementById("appTitle");
const loginTitleEl = document.getElementById("loginTitle");
const loginHintEl = document.getElementById("loginHint");
const loginUserLabelEl = document.getElementById("loginUserLabel");
const loginPassLabelEl = document.getElementById("loginPassLabel");
const entryTitleEl = document.getElementById("entryTitle");
const dayLabelEl = document.getElementById("dayLabel");
const subjectLabelEl = document.getElementById("subjectLabel");
const typeLabelEl = document.getElementById("typeLabel");
const hoursLabelEl = document.getElementById("hoursLabel");
const noteLabelEl = document.getElementById("noteLabel");
const subjectsTitleEl = document.getElementById("subjectsTitle");
const newSubjectLabelEl = document.getElementById("newSubjectLabel");
const weekTotalLabelEl = document.getElementById("weekTotalLabel");
const dayTotalLabelEl = document.getElementById("dayTotalLabel");
const weekTitleEl = document.getElementById("weekTitle");
const liveTitleEl = document.getElementById("liveTitle");
const liveHintEl = document.getElementById("liveHint");
const liveSubjectLabelEl = document.getElementById("liveSubjectLabel");
const liveTypeLabelEl = document.getElementById("liveTypeLabel");
const liveModeLabelEl = document.getElementById("liveModeLabel");
const liveDurationLabelEl = document.getElementById("liveDurationLabel");
const liveSubjectSelect = document.getElementById("liveSubjectSelect");
const liveTypeSelect = document.getElementById("liveTypeSelect");
const liveModeSelect = document.getElementById("liveModeSelect");
const liveMinutesInput = document.getElementById("liveMinutesInput");
const liveDurationField = document.getElementById("liveDurationField");
const liveClockEl = document.getElementById("liveClock");
const liveStatusEl = document.getElementById("liveStatus");
const liveStartBtn = document.getElementById("liveStartBtn");
const livePauseBtn = document.getElementById("livePauseBtn");
const liveStopBtn = document.getElementById("liveStopBtn");

// ---- Date helpers (ISO week monday start) ----
const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function startOfISOWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}
function formatWeekLabel(ws) {
  const we = addDays(ws, 6);
  return `${pad2(ws.getDate())}/${pad2(ws.getMonth() + 1)}/${ws.getFullYear()} – ${pad2(we.getDate())}/${pad2(we.getMonth() + 1)}/${we.getFullYear()}`;
}
function formatDayLabel(d, idx) {
  const short = t("dayShort")[idx] || "";
  return `${short} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

// ---- API ----
async function api(path, opts) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

const I18N = {
  nl: {
    appTitle: "Working Hours",
    loginTitle: "Login",
    loginHint: "Bestaat username niet, dan wordt die aangemaakt.",
    username: "Username",
    password: "Password",
    login: "Login",
    logout: "Logout",
    prevWeek: "← Vorige",
    nextWeek: "Volgende →",
    today: "Vandaag",
    entryTitle: "Invoer",
    day: "Dag",
    subject: "Vak",
    type: "Type",
    hours: "Uren",
    note: "Notitie",
    hoursPlaceholder: "bv. 1.5",
    notePlaceholder: "optioneel",
    addEntry: "Toevoegen",
    clearWeek: "Week leegmaken",
    subjectsTitle: "Vakken",
    newSubject: "Nieuw vak",
    newSubjectPlaceholder: "bv. Wiskunde",
    addSubject: "Toevoegen",
    weekTotal: "Week totaal",
    dayTotal: "Dagtotaal",
    weekTitle: "Week",
    choose: "Kies...",
    noEntries: "Geen entries",
    deleteSubject: "Verwijder",
    editDay: "Bewerk dag",
    closeDay: "Sluit dag",
    deleteRecord: "Verwijder record",
    liveTitle: "Live sessie",
    liveHint: "Gebruikt de dag die hierboven geselecteerd is.",
    liveSubject: "Vak",
    liveType: "Type",
    liveMode: "Modus",
    liveDuration: "Timer (min)",
    liveModeStopwatch: "Stopwatch",
    liveModeTimer: "Timer",
    liveStart: "Start",
    livePause: "Pauze",
    liveResume: "Hervat",
    liveStopSave: "Stop & opslaan",
    liveStatusIdle: "Klaar om te starten",
    liveStatusRunningStopwatch: "Stopwatch loopt...",
    liveStatusRunningTimer: "Timer loopt...",
    liveStatusPaused: "Gepauzeerd",
    liveStatusSaved: "Sessie opgeslagen: {hours} {unit}",
    liveStatusTooShort: "Sessie te kort om op te slaan",
    liveStatusSaveError: "Kon sessie niet opslaan",
    liveStatusNeedDuration: "Vul een geldige timerduur in",
    liveStatusNotifDenied: "Notificaties staan uit in je browser voor deze site",
    liveStatusNotifUnsupported: "Notificaties worden hier niet ondersteund",
    notifTimerDoneTitle: "Timer klaar",
    notifTimerDoneBody: "{subject} • {type} op {day}",
    unitShort: "u",
    unitLong: "uur",
    dayShort: ["ma", "di", "wo", "do", "vr", "za", "zo"],
    dayNames: ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"],
    typeLabels: {
      taak: "taak",
      study: "study",
      lecture: "lecture",
    },
  },
  en: {
    appTitle: "Working Hours",
    loginTitle: "Login",
    loginHint: "If the username does not exist, it will be created.",
    username: "Username",
    password: "Password",
    login: "Login",
    logout: "Logout",
    prevWeek: "← Previous",
    nextWeek: "Next →",
    today: "Today",
    entryTitle: "Entry",
    day: "Day",
    subject: "Subject",
    type: "Type",
    hours: "Hours",
    note: "Note",
    hoursPlaceholder: "e.g. 1.5",
    notePlaceholder: "optional",
    addEntry: "Add",
    clearWeek: "Clear week",
    subjectsTitle: "Subjects",
    newSubject: "New subject",
    newSubjectPlaceholder: "e.g. Math",
    addSubject: "Add",
    weekTotal: "Week total",
    dayTotal: "Day total",
    weekTitle: "Week",
    choose: "Choose...",
    noEntries: "No entries",
    deleteSubject: "Delete",
    editDay: "Edit day",
    closeDay: "Close day",
    deleteRecord: "Delete record",
    liveTitle: "Live session",
    liveHint: "Uses the day selected above.",
    liveSubject: "Subject",
    liveType: "Type",
    liveMode: "Mode",
    liveDuration: "Timer (min)",
    liveModeStopwatch: "Stopwatch",
    liveModeTimer: "Timer",
    liveStart: "Start",
    livePause: "Pause",
    liveResume: "Resume",
    liveStopSave: "Stop & save",
    liveStatusIdle: "Ready to start",
    liveStatusRunningStopwatch: "Stopwatch running...",
    liveStatusRunningTimer: "Timer running...",
    liveStatusPaused: "Paused",
    liveStatusSaved: "Session saved: {hours} {unit}",
    liveStatusTooShort: "Session is too short to save",
    liveStatusSaveError: "Could not save session",
    liveStatusNeedDuration: "Enter a valid timer duration",
    liveStatusNotifDenied: "Notifications are blocked for this site",
    liveStatusNotifUnsupported: "Notifications are not supported here",
    notifTimerDoneTitle: "Timer done",
    notifTimerDoneBody: "{subject} • {type} on {day}",
    unitShort: "h",
    unitLong: "hours",
    dayShort: ["mo", "tu", "we", "th", "fr", "sa", "su"],
    dayNames: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    typeLabels: {
      taak: "task",
      study: "study",
      lecture: "lecture",
    },
  },
};

// ---- State ----
let currentWeekStart = startOfISOWeek(new Date());
let subjects = [];
let weekEntries = []; // entries in current week
let expandedDayISO = null;
let prevExpandedDayISO = null;
const LANG_KEY = "tracker_lang";
let currentLang = (localStorage.getItem(LANG_KEY) || "nl").toLowerCase() === "en" ? "en" : "nl";
const managedSelects = [daySelect, subjectSelect, typeSelect, liveSubjectSelect, liveTypeSelect, liveModeSelect];

const LIVE_MODE_STOPWATCH = "stopwatch";
const LIVE_MODE_TIMER = "timer";
const liveSession = {
  mode: LIVE_MODE_STOPWATCH,
  running: false,
  startedAt: 0,
  elapsedBeforePauseMs: 0,
  timerTotalMs: 0,
  tickId: null,
  saving: false,
  statusKey: "liveStatusIdle",
  statusMeta: {},
};

function t(key) {
  return I18N[currentLang][key];
}

function tf(key, vars = {}) {
  let out = String(t(key) || "");
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
}

function getTypeLabel(type) {
  return t("typeLabels")[type] || type;
}

function setLiveStatus(key, meta = {}) {
  liveSession.statusKey = key;
  liveSession.statusMeta = meta;
  liveStatusEl.textContent = tf(key, meta);
}

function getLiveElapsedMs() {
  if (!liveSession.running) return liveSession.elapsedBeforePauseMs;
  return liveSession.elapsedBeforePauseMs + (Date.now() - liveSession.startedAt);
}

function formatClock(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

function stopLiveTicker() {
  if (liveSession.tickId) {
    clearInterval(liveSession.tickId);
    liveSession.tickId = null;
  }
}

function playTimerDoneSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const startAt = ctx.currentTime + 0.02;

    const tones = [880, 1174.66, 1567.98];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startAt + idx * 0.11);

      gain.gain.setValueAtTime(0.0001, startAt + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.12, startAt + idx * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + idx * 0.11 + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt + idx * 0.11);
      osc.stop(startAt + idx * 0.11 + 0.11);
    });

    setTimeout(() => {
      if (typeof ctx.close === "function") ctx.close();
    }, 700);
  } catch (err) {
    // no-op: some browsers may block audio creation
  }
}

function notificationsSupported() {
  return typeof window !== "undefined" && window.isSecureContext && "Notification" in window;
}

async function ensureNotificationServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    return null;
  }
}

async function requestNotificationPermissionIfNeeded() {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "default") return;
  try {
    await Notification.requestPermission();
  } catch (err) {
    // no-op
  }
}

async function sendTimerDoneNotification() {
  if (!notificationsSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const selectedDayText = daySelect.options[daySelect.selectedIndex]?.textContent || daySelect.value;
  const subject = liveSubjectSelect.value || "";
  const typeLabel = getTypeLabel(liveTypeSelect.value);
  const body = tf("notifTimerDoneBody", {
    subject,
    type: typeLabel,
    day: selectedDayText,
  });

  const options = {
    body,
    tag: "tracker-live-timer-done",
    renotify: false,
    requireInteraction: true,
  };

  try {
    const reg = await ensureNotificationServiceWorker();
    if (reg && typeof reg.showNotification === "function") {
      await reg.showNotification(t("notifTimerDoneTitle"), options);
      return true;
    }
  } catch (err) {
    // fallback below
  }

  try {
    const notif = new Notification(t("notifTimerDoneTitle"), options);
    notif.onclick = () => {
      try {
        window.focus();
      } catch (err) {
        // no-op
      }
      notif.close();
    };
    setTimeout(() => notif.close(), 15000);
    return true;
  } catch (err) {
    return false;
  }
}

async function completeLiveSession(auto = false) {
  if (liveSession.saving) return;
  liveSession.saving = true;
  stopLiveTicker();

  const elapsedMsRaw = getLiveElapsedMs();
  const elapsedMs = liveSession.mode === LIVE_MODE_TIMER
    ? Math.min(elapsedMsRaw, liveSession.timerTotalMs)
    : elapsedMsRaw;

  liveSession.running = false;
  liveSession.startedAt = 0;
  liveSession.elapsedBeforePauseMs = elapsedMs;

  if (elapsedMs < 1000) {
    liveSession.elapsedBeforePauseMs = 0;
    liveSession.timerTotalMs = 0;
    setLiveStatus("liveStatusTooShort");
    updateLiveSessionUI();
    liveSession.saving = false;
    return;
  }

  const hours = Math.round((elapsedMs / 3600000) * 100) / 100;
  try {
    await api("/api/entries", {
      method: "POST",
      body: JSON.stringify({
        day: daySelect.value,
        subject: liveSubjectSelect.value,
        type: liveTypeSelect.value,
        hours,
        note: null,
      }),
    });

    setLiveStatus("liveStatusSaved", { hours, unit: t("unitShort") });
    liveSession.elapsedBeforePauseMs = 0;
    liveSession.timerTotalMs = 0;
    await loadWeek();
    renderAll();
  } catch (e) {
    setLiveStatus("liveStatusSaveError");
    if (!auto) updateLiveSessionUI();
  } finally {
    liveSession.saving = false;
    updateLiveSessionUI();
  }
}

function startLiveTicker() {
  stopLiveTicker();
  liveSession.tickId = setInterval(() => {
    const elapsed = getLiveElapsedMs();
    if (liveSession.mode === LIVE_MODE_TIMER) {
      const remaining = Math.max(0, liveSession.timerTotalMs - elapsed);
      liveClockEl.textContent = formatClock(remaining);
      if (remaining <= 0) {
        playTimerDoneSound();
        void sendTimerDoneNotification();
        completeLiveSession(true);
      }
      return;
    }
    liveClockEl.textContent = formatClock(elapsed);
  }, 250);
}

function updateLiveModeField() {
  const timerMode = liveModeSelect.value === LIVE_MODE_TIMER;
  liveDurationField.classList.toggle("hidden", !timerMode);
}

function updateLiveSessionUI() {
  const started = liveSession.running || liveSession.elapsedBeforePauseMs > 0;
  const paused = !liveSession.running && liveSession.elapsedBeforePauseMs > 0;

  let displayMs = getLiveElapsedMs();
  if (liveSession.mode === LIVE_MODE_TIMER) {
    displayMs = Math.max(0, liveSession.timerTotalMs - displayMs);
  }
  liveClockEl.textContent = formatClock(displayMs);

  liveStartBtn.disabled = started || liveSession.saving;
  livePauseBtn.disabled = !started || liveSession.saving;
  liveStopBtn.disabled = !started || liveSession.saving;
  liveSubjectSelect.disabled = started || liveSession.saving;
  liveTypeSelect.disabled = started || liveSession.saving;
  liveModeSelect.disabled = started || liveSession.saving;
  liveMinutesInput.disabled = liveSession.saving || started || liveModeSelect.value !== LIVE_MODE_TIMER;
  syncCustomSelect(liveSubjectSelect);
  syncCustomSelect(liveTypeSelect);
  syncCustomSelect(liveModeSelect);

  livePauseBtn.textContent = paused ? t("liveResume") : t("livePause");
  liveStopBtn.textContent = t("liveStopSave");
  liveStatusEl.textContent = tf(liveSession.statusKey, liveSession.statusMeta);

  if (!started && liveSession.statusKey === "liveStatusIdle") {
    setLiveStatus("liveStatusIdle");
  } else if (liveSession.running) {
    setLiveStatus(liveSession.mode === LIVE_MODE_TIMER ? "liveStatusRunningTimer" : "liveStatusRunningStopwatch");
  } else if (paused) {
    setLiveStatus("liveStatusPaused");
  }
}

function applyStaticTexts() {
  document.documentElement.lang = currentLang;

  appTitleEl.textContent = t("appTitle");
  loginTitleEl.textContent = t("loginTitle");
  loginHintEl.textContent = t("loginHint");
  loginUserLabelEl.textContent = t("username");
  loginPassLabelEl.textContent = t("password");
  loginBtn.textContent = t("login");
  logoutBtn.textContent = t("logout");

  prevWeekBtn.textContent = t("prevWeek");
  nextWeekBtn.textContent = t("nextWeek");
  todayBtn.textContent = t("today");

  entryTitleEl.textContent = t("entryTitle");
  dayLabelEl.textContent = t("day");
  subjectLabelEl.textContent = t("subject");
  typeLabelEl.textContent = t("type");
  hoursLabelEl.textContent = t("hours");
  noteLabelEl.textContent = t("note");
  hoursInput.placeholder = t("hoursPlaceholder");
  noteInput.placeholder = t("notePlaceholder");
  addEntryBtn.textContent = t("addEntry");
  clearWeekBtn.textContent = t("clearWeek");

  subjectsTitleEl.textContent = t("subjectsTitle");
  newSubjectLabelEl.textContent = t("newSubject");
  newSubject.placeholder = t("newSubjectPlaceholder");
  addSubjectBtn.textContent = t("addSubject");

  weekTotalLabelEl.textContent = t("weekTotal");
  dayTotalLabelEl.textContent = t("dayTotal");
  weekTitleEl.textContent = t("weekTitle");
  liveTitleEl.textContent = t("liveTitle");
  liveHintEl.textContent = t("liveHint");
  liveSubjectLabelEl.textContent = t("liveSubject");
  liveTypeLabelEl.textContent = t("liveType");
  liveModeLabelEl.textContent = t("liveMode");
  liveDurationLabelEl.textContent = t("liveDuration");
  liveStartBtn.textContent = t("liveStart");
  livePauseBtn.textContent = t("livePause");
  liveStopBtn.textContent = t("liveStopSave");

  Array.from(typeSelect.options).forEach((opt) => {
    opt.textContent = getTypeLabel(opt.value);
  });
  Array.from(liveTypeSelect.options).forEach((opt) => {
    opt.textContent = getTypeLabel(opt.value);
  });
  Array.from(liveModeSelect.options).forEach((opt) => {
    opt.textContent = opt.value === LIVE_MODE_TIMER ? t("liveModeTimer") : t("liveModeStopwatch");
  });

  const nlActive = currentLang === "nl";
  langNlBtn.classList.toggle("active", nlActive);
  langEnBtn.classList.toggle("active", !nlActive);
  langNlBtn.setAttribute("aria-pressed", String(nlActive));
  langEnBtn.setAttribute("aria-pressed", String(!nlActive));

  updateLiveModeField();
  updateLiveSessionUI();
}

function setLanguage(lang, rerender = true) {
  const normalized = String(lang).toLowerCase() === "en" ? "en" : "nl";
  if (currentLang === normalized && rerender) {
    applyStaticTexts();
    return;
  }
  currentLang = normalized;
  localStorage.setItem(LANG_KEY, currentLang);
  applyStaticTexts();
  if (rerender && !appCard.classList.contains("hidden")) renderAll();
}

// ---- Glass dropdowns ----
function customHostFor(select) {
  if (!select || !select.parentElement) return null;
  return select.parentElement.querySelector(`.glassSelect[data-for="${select.id}"]`);
}

function closeCustomSelects(except = null) {
  document.querySelectorAll(".glassSelect.open").forEach((host) => {
    if (host !== except) host.classList.remove("open");
  });
}

function syncCustomSelect(select) {
  const host = customHostFor(select);
  if (!host) return;

  const valueEl = host.querySelector(".glassSelectValue");
  const trigger = host.querySelector(".glassSelectTrigger");
  const selected = select.selectedOptions?.[0] || select.options[0];

  valueEl.textContent = selected ? selected.textContent : t("choose");
  trigger.disabled = select.disabled || select.options.length === 0;

  host.querySelectorAll(".glassSelectItem").forEach((item) => {
    item.classList.toggle("selected", item.dataset.value === select.value);
  });
}

function renderCustomSelect(select) {
  if (!select || !select.id) return;
  select.classList.add("nativeSelect");

  let host = customHostFor(select);
  if (!host) {
    host = document.createElement("div");
    host.className = "glassSelect";
    host.dataset.for = select.id;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "glassSelectTrigger";

    const value = document.createElement("span");
    value.className = "glassSelectValue";

    const arrow = document.createElement("span");
    arrow.className = "glassSelectArrow";
    arrow.setAttribute("aria-hidden", "true");

    trigger.appendChild(value);
    trigger.appendChild(arrow);

    const menu = document.createElement("div");
    menu.className = "glassSelectMenu";

    host.appendChild(trigger);
    host.appendChild(menu);
    select.insertAdjacentElement("afterend", host);
  }

  const menu = host.querySelector(".glassSelectMenu");
  menu.innerHTML = "";

  for (const option of Array.from(select.options)) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "glassSelectItem";
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    item.disabled = !!option.disabled;

    if (option.disabled) item.classList.add("disabled");
    if (option.value === select.value) item.classList.add("selected");

    item.onclick = () => {
      if (option.disabled) return;
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncCustomSelect(select);
      closeCustomSelects();
    };

    menu.appendChild(item);
  }

  if (!host.dataset.bound) {
    const trigger = host.querySelector(".glassSelectTrigger");

    trigger.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const opening = !host.classList.contains("open");
      closeCustomSelects(host);
      host.classList.toggle("open", opening);
    });

    trigger.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " " || ev.key === "ArrowDown") {
        ev.preventDefault();
        closeCustomSelects(host);
        host.classList.add("open");
      } else if (ev.key === "Escape") {
        host.classList.remove("open");
      }
    });

    host.dataset.bound = "1";
  }

  if (!select.dataset.customBound) {
    select.addEventListener("change", () => syncCustomSelect(select));
    select.dataset.customBound = "1";
  }

  syncCustomSelect(select);
}

function renderCustomSelects() {
  managedSelects.forEach((select) => renderCustomSelect(select));
}

document.addEventListener("click", (ev) => {
  if (ev.target.closest(".glassSelect")) return;
  closeCustomSelects();
});

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") closeCustomSelects();
});

function compactSubjectLabel(subject) {
  const words = String(subject || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0].toUpperCase()).join("");
}

function entriesByDay() {
  const map = new Map();
  for (const e of weekEntries) {
    if (!map.has(e.day)) map.set(e.day, []);
    map.get(e.day).push(e);
  }
  return map;
}
function sumHours(list) {
  return list.reduce((a, e) => a + (Number(e.hours) || 0), 0);
}

// ---- Render ----
function renderAuthUI(authed, username) {
  if (!authed) {
    document.body.classList.add("auth-view");
    closeCustomSelects();
    stopLiveTicker();
    liveSession.running = false;
    liveSession.startedAt = 0;
    liveSession.elapsedBeforePauseMs = 0;
    liveSession.timerTotalMs = 0;
    liveSession.saving = false;
    setLiveStatus("liveStatusIdle");
    updateLiveSessionUI();
    loginCard.classList.remove("hidden");
    appCard.classList.add("hidden");
    meEl.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    return;
  }
  document.body.classList.remove("auth-view");
  loginCard.classList.add("hidden");
  appCard.classList.remove("hidden");
  meEl.textContent = username;
  meEl.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
}

function renderSubjects() {
  subjectSelect.innerHTML = "";
  for (const s of subjects) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    subjectSelect.appendChild(opt);
  }

  subjectList.innerHTML = "";
  for (const s of subjects) {
    const row = document.createElement("div");
    row.className = "listRow";

    const left = document.createElement("b");
    left.textContent = s;

    const del = document.createElement("button");
    del.className = "btn danger";
    del.textContent = t("deleteSubject");
    del.disabled = subjects.length === 1;
    del.onclick = async () => {
      await api(`/api/subjects/${encodeURIComponent(s)}`, { method: "DELETE" });
      await loadSubjects();
      renderAll();
    };

    row.appendChild(left);
    row.appendChild(del);
    subjectList.appendChild(row);
  }
}

function renderLiveSessionSelectors() {
  const prevSubject = liveSubjectSelect.value;
  liveSubjectSelect.innerHTML = "";
  for (const s of subjects) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    liveSubjectSelect.appendChild(opt);
  }
  if (Array.from(liveSubjectSelect.options).some((opt) => opt.value === prevSubject)) {
    liveSubjectSelect.value = prevSubject;
  }

  const validLiveType = ["taak", "study", "lecture"];
  if (!validLiveType.includes(liveTypeSelect.value)) {
    liveTypeSelect.value = "taak";
  }
  if (![LIVE_MODE_STOPWATCH, LIVE_MODE_TIMER].includes(liveModeSelect.value)) {
    liveModeSelect.value = LIVE_MODE_STOPWATCH;
  }
}

function renderDaySelect() {
  const previousValue = daySelect.value;
  daySelect.innerHTML = "";
  const dates = getWeekDates(currentWeekStart);
  for (let i = 0; i < 7; i++) {
    const d = dates[i];
    const opt = document.createElement("option");
    opt.value = toISODate(d);
    opt.textContent = formatDayLabel(d, i);
    daySelect.appendChild(opt);
  }

  const hasPrevious = Array.from(daySelect.options).some((opt) => opt.value === previousValue);
  if (hasPrevious) {
    daySelect.value = previousValue;
    return;
  }

  const todayISO = toISODate(new Date());
  const hasToday = Array.from(daySelect.options).some((opt) => opt.value === todayISO);
  if (hasToday) {
    daySelect.value = todayISO;
    return;
  }

  if (daySelect.options.length > 0) {
    daySelect.selectedIndex = 0;
  }
}

function renderWeek() {
  weekLabelEl.textContent = formatWeekLabel(currentWeekStart);
  daysEl.innerHTML = "";

  const map = entriesByDay();
  const dates = getWeekDates(currentWeekStart);
  const weekISO = dates.map((d) => toISODate(d));
  if (expandedDayISO && !weekISO.includes(expandedDayISO)) expandedDayISO = null;
  daysEl.classList.toggle("hasExpanded", !!expandedDayISO);
  const selectedISO = daySelect.value;
  const dayNames = t("dayNames");

  for (let i = 0; i < 7; i++) {
    const d = dates[i];
    const iso = toISODate(d);
    const expanded = expandedDayISO === iso;
    const list = (map.get(iso) || []).slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    const day = document.createElement("div");
    day.className = expanded ? "day expanded" : "day";
    if (iso === selectedISO) day.classList.add("selected");
    if (expanded && prevExpandedDayISO !== expandedDayISO) day.classList.add("expandAnim");
    if (!expanded && iso === prevExpandedDayISO && prevExpandedDayISO !== expandedDayISO) day.classList.add("collapseAnim");

    const head = document.createElement("div");
    head.className = "dayHead";

    const left = document.createElement("div");
    const dow = document.createElement("div");
    dow.className = "dow";
    dow.textContent = dayNames[i];
    const date = document.createElement("div");
    date.className = "date";
    date.textContent = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    left.appendChild(dow);
    left.appendChild(date);

    const total = document.createElement("div");
    total.className = "total";
    total.textContent = `${sumHours(list)} ${t("unitShort")}`;

    const actions = document.createElement("div");
    actions.className = "dayActions";
    actions.appendChild(total);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "dayToggle iconBtn";
    toggle.title = expanded ? t("closeDay") : t("editDay");
    toggle.setAttribute("aria-label", expanded ? t("closeDay") : t("editDay"));
    toggle.innerHTML = expanded
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM14.5 6.5l3 3"/></svg>';
    toggle.onclick = () => {
      expandedDayISO = expanded ? null : iso;
      daySelect.value = iso;
      daySelect.dispatchEvent(new Event("change", { bubbles: true }));
    };
    actions.appendChild(toggle);

    head.appendChild(left);
    head.appendChild(actions);
    day.appendChild(head);

    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = t("noEntries");
      day.appendChild(empty);
    } else {
      for (const e of list) {
        const it = document.createElement("div");
        it.className = expanded ? "item expanded" : "item compact";

        const l = document.createElement("div");
        l.className = "itemLeft";

        const tag = document.createElement("div");
        tag.className = `tag ${e.type}`;
        tag.textContent = expanded ? `${e.subject} • ${getTypeLabel(e.type)}` : compactSubjectLabel(e.subject);
        tag.title = `${e.subject} • ${getTypeLabel(e.type)}`;

        l.appendChild(tag);

        if (expanded && e.note) {
          const note = document.createElement("div");
          note.className = "note";
          note.textContent = e.note;
          l.appendChild(note);
        }

        const r = document.createElement("div");
        r.className = expanded ? "itemRight expanded" : "itemRight";

        const hrs = document.createElement("div");
        hrs.className = "hours";
        hrs.textContent = `${e.hours} ${t("unitShort")}`;
        hrs.title = `${e.hours} ${t("unitLong")}`;
        r.appendChild(hrs);

        if (expanded) {
          const del = document.createElement("button");
          del.className = "btn danger iconBtn";
          del.title = t("deleteRecord");
          del.setAttribute("aria-label", t("deleteRecord"));
          del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6m4 4v7m6-7v7"/></svg>';
          del.onclick = async () => {
            await api(`/api/entries/${e.id}`, { method: "DELETE" });
            await loadWeek();
            renderAll();
          };
          r.appendChild(del);
        }

        it.appendChild(l);
        it.appendChild(r);
        day.appendChild(it);
      }
    }
    day.onclick = (ev) => {
      if (ev.target.closest("button")) return;
      daySelect.value = iso;
      daySelect.dispatchEvent(new Event("change", { bubbles: true }));
    };
    daysEl.appendChild(day);
  }

  prevExpandedDayISO = expandedDayISO;
}

function renderTotals() {
  const wt = sumHours(weekEntries);
  weekTotalEl.textContent = String(Math.round(wt * 100) / 100);

  const selected = daySelect.value;
  const map = entriesByDay();
  const dt = sumHours(map.get(selected) || []);
  dayTotalEl.textContent = String(Math.round(dt * 100) / 100);
}

function renderAll() {
  renderSubjects();
  renderLiveSessionSelectors();
  renderDaySelect();
  renderCustomSelects();
  renderWeek();
  renderTotals();
  updateLiveModeField();
  updateLiveSessionUI();
}

// ---- Loaders ----
async function loadMe() {
  const me = await api("/api/me", { method: "GET" });
  renderAuthUI(me.authed, me.username);
  return me;
}

async function loadSubjects() {
  const data = await api("/api/subjects", { method: "GET" });
  subjects = data.subjects || ["Algemeen"];
}

async function loadWeek() {
  const start = toISODate(currentWeekStart);
  const data = await api(`/api/week?start=${encodeURIComponent(start)}`, { method: "GET" });
  weekEntries = data.entries || [];
}

// ---- Handlers ----
liveModeSelect.onchange = () => {
  updateLiveModeField();
  updateLiveSessionUI();
};

liveStartBtn.onclick = async () => {
  if (liveSession.running || liveSession.elapsedBeforePauseMs > 0) return;
  if (liveModeSelect.value === LIVE_MODE_TIMER) {
    if (!notificationsSupported()) {
      setLiveStatus("liveStatusNotifUnsupported");
    } else {
      await requestNotificationPermissionIfNeeded();
      if (Notification.permission === "denied") {
        setLiveStatus("liveStatusNotifDenied");
      }
    }
  }

  liveSession.mode = liveModeSelect.value === LIVE_MODE_TIMER ? LIVE_MODE_TIMER : LIVE_MODE_STOPWATCH;
  liveSession.elapsedBeforePauseMs = 0;
  liveSession.startedAt = Date.now();
  liveSession.running = true;

  if (liveSession.mode === LIVE_MODE_TIMER) {
    const minutes = Number(liveMinutesInput.value);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      liveSession.running = false;
      liveSession.startedAt = 0;
      setLiveStatus("liveStatusNeedDuration");
      updateLiveSessionUI();
      return;
    }
    liveSession.timerTotalMs = Math.round(minutes * 60 * 1000);
  } else {
    liveSession.timerTotalMs = 0;
  }

  startLiveTicker();
  updateLiveSessionUI();
};

livePauseBtn.onclick = () => {
  const started = liveSession.running || liveSession.elapsedBeforePauseMs > 0;
  if (!started) return;

  if (liveSession.running) {
    liveSession.elapsedBeforePauseMs = getLiveElapsedMs();
    liveSession.running = false;
    liveSession.startedAt = 0;
    stopLiveTicker();
  } else {
    liveSession.startedAt = Date.now();
    liveSession.running = true;
    startLiveTicker();
  }

  updateLiveSessionUI();
};

liveStopBtn.onclick = async () => {
  const started = liveSession.running || liveSession.elapsedBeforePauseMs > 0;
  if (!started) return;
  await completeLiveSession(false);
  updateLiveSessionUI();
};

langNlBtn.onclick = () => setLanguage("nl");
langEnBtn.onclick = () => setLanguage("en");

loginBtn.onclick = async () => {
  loginErr.textContent = "";
  try {
    const username = loginUser.value;
    const password = loginPass.value;
    await api("/api/login", { method: "POST", body: JSON.stringify({ username, password }) });

    const me = await loadMe();
    if (me.authed) {
      await loadSubjects();
      await loadWeek();
      renderAll();
    }
  } catch (e) {
    loginErr.textContent = e?.error || "login_failed";
  }
};

logoutBtn.onclick = async () => {
  await api("/api/logout", { method: "POST" });
  renderAuthUI(false);
};

prevWeekBtn.onclick = async () => {
  currentWeekStart = addDays(currentWeekStart, -7);
  await loadWeek();
  renderAll();
};
nextWeekBtn.onclick = async () => {
  currentWeekStart = addDays(currentWeekStart, 7);
  await loadWeek();
  renderAll();
};
todayBtn.onclick = async () => {
  currentWeekStart = startOfISOWeek(new Date());
  await loadWeek();
  renderAll();
  const todayISO = toISODate(new Date());
  if (Array.from(daySelect.options).some((opt) => opt.value === todayISO)) {
    daySelect.value = todayISO;
    daySelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
};
daySelect.onchange = () => {
  renderTotals();
  renderWeek();
};

addSubjectBtn.onclick = async () => {
  const name = String(newSubject.value || "").trim();
  if (!name) return;
  await api("/api/subjects", { method: "POST", body: JSON.stringify({ name }) });
  newSubject.value = "";
  await loadSubjects();
  renderAll();
};

addEntryBtn.onclick = async () => {
  const day = daySelect.value;
  const subject = subjectSelect.value;
  const type = typeSelect.value;
  const hours = Number(hoursInput.value);
  const note = String(noteInput.value || "").trim() || null;

  if (!Number.isFinite(hours) || hours < 0) return;

  await api("/api/entries", {
    method: "POST",
    body: JSON.stringify({ day, subject, type, hours, note }),
  });

  hoursInput.value = "";
  noteInput.value = "";
  await loadWeek();
  renderAll();
};

clearWeekBtn.onclick = async () => {
  const start = toISODate(currentWeekStart);
  await api(`/api/week?start=${encodeURIComponent(start)}`, { method: "DELETE" });
  await loadWeek();
  renderAll();
};

// ---- Init ----
(async function init() {
  setLanguage(currentLang, false);
  const me = await loadMe();
  if (me.authed) {
    await loadSubjects();
    await loadWeek();
    renderAll();
  }
})();
