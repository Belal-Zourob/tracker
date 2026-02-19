function applyStaticTexts() {
  document.documentElement.lang = currentLang;

  appTitleEl.textContent = t("appTitle");
  loginTitleEl.textContent = t("loginTitle");
  loginHintEl.textContent = t("loginHint");
  loginUserLabelEl.textContent = t("username");
  loginPassLabelEl.textContent = t("password");
  loginBtn.textContent = t("login");
  forgotPassBtn.textContent = t("forgotPassword");
  forgotPassBtn.dataset.tip = t("forgotPasswordHint");
  forgotPassBtn.setAttribute("aria-label", t("forgotPassword"));
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
  daysNavPrevBtn.title = t("daysNavPrev");
  daysNavPrevBtn.setAttribute("aria-label", t("daysNavPrev"));
  daysNavNextBtn.title = t("daysNavNext");
  daysNavNextBtn.setAttribute("aria-label", t("daysNavNext"));
  daysSwipeHintEl.textContent = t("daysSwipeHint");
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

function clampDayWindowStart(value, totalDays = 7) {
  const maxStart = Math.max(0, totalDays - DAY_WINDOW_SIZE);
  return Math.min(Math.max(value, 0), maxStart);
}

function ensureDayVisible(iso, dates) {
  if (!iso) return;
  const idx = dates.findIndex((d) => toISODate(d) === iso);
  if (idx < 0) return;

  if (idx < dayWindowStart) {
    dayWindowStart = idx;
  } else if (idx >= dayWindowStart + DAY_WINDOW_SIZE) {
    dayWindowStart = idx - DAY_WINDOW_SIZE + 1;
  }

  dayWindowStart = clampDayWindowStart(dayWindowStart, dates.length);
}

function renderDayWindowNav(totalDays) {
  const maxStart = Math.max(0, totalDays - DAY_WINDOW_SIZE);
  daysNavPrevBtn.disabled = dayWindowStart <= 0;
  daysNavNextBtn.disabled = dayWindowStart >= maxStart;
}

function shiftDayWindow(delta) {
  const dates = getWeekDates(currentWeekStart);
  const next = clampDayWindowStart(dayWindowStart + delta, dates.length);
  if (next === dayWindowStart) return false;
  dayWindowStart = next;
  renderWeek();
  return true;
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
  const selectedISO = daySelect.value;
  ensureDayVisible(expandedDayISO || selectedISO, dates);
  dayWindowStart = clampDayWindowStart(dayWindowStart, dates.length);

  const startIdx = dayWindowStart;
  const endIdx = Math.min(startIdx + DAY_WINDOW_SIZE, dates.length);
  const visibleISO = new Set(dates.slice(startIdx, endIdx).map((d) => toISODate(d)));

  if (expandedDayISO && !visibleISO.has(expandedDayISO)) {
    expandedDayISO = null;
  }

  daysEl.classList.toggle("hasExpanded", !!expandedDayISO);
  renderDayWindowNav(dates.length);
  const dayNames = t("dayNames");

  for (let i = startIdx; i < endIdx; i++) {
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
