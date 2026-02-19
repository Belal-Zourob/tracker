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

forgotPassBtn.onclick = () => {
  forgotPassBtn.dataset.show = "1";
  setTimeout(() => {
    delete forgotPassBtn.dataset.show;
  }, 1400);
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
daysNavPrevBtn.onclick = () => {
  shiftDayWindow(-1);
};
daysNavNextBtn.onclick = () => {
  shiftDayWindow(1);
};

async function doLogin() {
  if (loginCard.classList.contains("hidden")) return;
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
}

loginBtn.onclick = async () => {
  await doLogin();
};

function onLoginEnter(ev) {
  if (ev.key !== "Enter") return;
  ev.preventDefault();
  void doLogin();
}

loginUser.addEventListener("keydown", onLoginEnter);
loginPass.addEventListener("keydown", onLoginEnter);

logoutBtn.onclick = async () => {
  await api("/api/logout", { method: "POST" });
  renderAuthUI(false);
};

prevWeekBtn.onclick = async () => {
  currentWeekStart = addDays(currentWeekStart, -7);
  dayWindowStart = 0;
  await loadWeek();
  renderAll();
};
nextWeekBtn.onclick = async () => {
  currentWeekStart = addDays(currentWeekStart, 7);
  dayWindowStart = 0;
  await loadWeek();
  renderAll();
};
todayBtn.onclick = async () => {
  currentWeekStart = startOfISOWeek(new Date());
  dayWindowStart = 0;
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

let daySwipeStartX = 0;
let daySwipeStartY = 0;
let daySwipeTracking = false;

daysEl.addEventListener(
  "touchstart",
  (ev) => {
    if (ev.touches.length !== 1) {
      daySwipeTracking = false;
      return;
    }
    daySwipeStartX = ev.touches[0].clientX;
    daySwipeStartY = ev.touches[0].clientY;
    daySwipeTracking = true;
  },
  { passive: true }
);

daysEl.addEventListener(
  "touchend",
  (ev) => {
    if (!daySwipeTracking || ev.changedTouches.length !== 1) return;
    daySwipeTracking = false;

    const touch = ev.changedTouches[0];
    const dx = touch.clientX - daySwipeStartX;
    const dy = touch.clientY - daySwipeStartY;

    if (Math.abs(dx) < DAY_SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) <= Math.abs(dy)) return;

    if (dx < 0) {
      shiftDayWindow(1);
      return;
    }

    shiftDayWindow(-1);
  },
  { passive: true }
);

daysEl.addEventListener(
  "touchcancel",
  () => {
    daySwipeTracking = false;
  },
  { passive: true }
);

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
