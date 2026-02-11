// ---- DOM ----
const loginCard = document.getElementById("loginCard");
const appCard = document.getElementById("appCard");

const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginBtn = document.getElementById("loginBtn");
const loginErr = document.getElementById("loginErr");

const meEl = document.getElementById("me");
const logoutBtn = document.getElementById("logoutBtn");

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
  const short = ["ma", "di", "wo", "do", "vr", "za", "zo"][idx];
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

// ---- State ----
let currentWeekStart = startOfISOWeek(new Date());
let subjects = [];
let weekEntries = []; // entries in current week

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
    loginCard.classList.remove("hidden");
    appCard.classList.add("hidden");
    meEl.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    return;
  }
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
    del.textContent = "Verwijder";
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

function renderDaySelect() {
  daySelect.innerHTML = "";
  const dates = getWeekDates(currentWeekStart);
  for (let i = 0; i < 7; i++) {
    const d = dates[i];
    const opt = document.createElement("option");
    opt.value = toISODate(d);
    opt.textContent = formatDayLabel(d, i);
    daySelect.appendChild(opt);
  }
}

function renderWeek() {
  weekLabelEl.textContent = formatWeekLabel(currentWeekStart);
  daysEl.innerHTML = "";

  const map = entriesByDay();
  const dates = getWeekDates(currentWeekStart);
  const dayNames = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

  for (let i = 0; i < 7; i++) {
    const d = dates[i];
    const iso = toISODate(d);
    const list = (map.get(iso) || []).slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    const day = document.createElement("div");
    day.className = "day";

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
    total.textContent = `${sumHours(list)} u`;

    head.appendChild(left);
    head.appendChild(total);
    day.appendChild(head);

    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "Geen entries";
      day.appendChild(empty);
    } else {
      for (const e of list) {
        const it = document.createElement("div");
        it.className = "item";

        const l = document.createElement("div");
        l.style.minWidth = "0";

        const tag = document.createElement("div");
        tag.className = `tag ${e.type}`;
        tag.textContent = `${e.subject} • ${e.type}`;

        l.appendChild(tag);

        if (e.note) {
          const note = document.createElement("div");
          note.className = "note";
          note.textContent = e.note;
          l.appendChild(note);
        }

        const r = document.createElement("div");
        r.style.display = "flex";
        r.style.flexDirection = "column";
        r.style.gap = "8px";
        r.style.alignItems = "flex-end";

        const hrs = document.createElement("div");
        hrs.className = "hours";
        hrs.textContent = `${e.hours} u`;

        const del = document.createElement("button");
        del.className = "btn danger";
        del.textContent = "X";
        del.onclick = async () => {
          await api(`/api/entries/${e.id}`, { method: "DELETE" });
          await loadWeek();
          renderAll();
        };

        r.appendChild(hrs);
        r.appendChild(del);

        it.appendChild(l);
        it.appendChild(r);
        day.appendChild(it);
      }
    }

    const quick = document.createElement("button");
    quick.className = "btn ghost";
    quick.textContent = "Edit";
    quick.onclick = () => {
      daySelect.value = iso;
      renderTotals();
      hoursInput.focus();
    };

    day.appendChild(quick);
    daysEl.appendChild(day);
  }
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
  renderDaySelect();
  renderWeek();
  renderTotals();
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
};
daySelect.onchange = () => renderTotals();

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
  const me = await loadMe();
  if (me.authed) {
    await loadSubjects();
    await loadWeek();
    renderAll();
  }
})();
