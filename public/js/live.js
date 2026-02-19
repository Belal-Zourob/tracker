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
