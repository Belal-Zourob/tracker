// ---- DOM ----
const loginCard = document.getElementById("loginCard");
const appCard = document.getElementById("appCard");

const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginBtn = document.getElementById("loginBtn");
const loginErr = document.getElementById("loginErr");
const forgotPassBtn = document.getElementById("forgotPassBtn");

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
    forgotPassword: "Wachtwoord vergeten?",
    forgotPasswordHint: "Nog niet beschikbaar",
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
    forgotPassword: "Forgot password?",
    forgotPasswordHint: "Not available yet",
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
