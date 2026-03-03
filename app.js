/**
 * Library Opening Times – opening hours data, open/close logic, countdown, theme.
 * All times are local; no timezone conversion.
 */

(function () {
  'use strict';

  // Opening hours: index = day (0 Sunday … 6 Saturday). open/close in hours (e.g. 14 = 2pm).
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const HOURS = [
    { open: 11, close: 15 },   // Sunday 11am–3pm
    { open: 14, close: 18 },   // Monday 2pm–6pm
    { open: null, close: null },
    { open: 10, close: 14 },   // Wednesday 10am–2pm
    { open: null, close: null },
    { open: 13, close: 17 },   // Friday 1pm–5pm
    { open: 10, close: 14 },   // Saturday 10am–2pm
  ];

  function minutesSinceMidnight(d) {
    return d.getHours() * 60 + d.getMinutes();
  }

  function isOpenAt(date) {
    const day = date.getDay();
    const slot = HOURS[day];
    if (slot.open === null) return false;
    const mins = minutesSinceMidnight(date);
    return mins >= slot.open * 60 && mins < slot.close * 60;
  }

  function nextCloseTime(fromDate) {
    const from = new Date(fromDate);
    const day = from.getDay();
    const mins = minutesSinceMidnight(from);
    const slot = HOURS[day];

    if (slot.open !== null && mins >= slot.open * 60 && mins < slot.close * 60) {
      const close = new Date(from);
      close.setHours(slot.close, 0, 0, 0);
      return close;
    }

    for (let i = 1; i <= 7; i++) {
      const nextDay = (day + i) % 7;
      const nextSlot = HOURS[nextDay];
      if (nextSlot.open !== null) {
        const close = new Date(from);
        close.setDate(close.getDate() + i);
        close.setHours(nextSlot.close, 0, 0, 0);
        return close;
      }
    }
    return null;
  }

  function nextOpenTime(fromDate) {
    const from = new Date(fromDate);
    const day = from.getDay();
    const mins = minutesSinceMidnight(from);
    const slot = HOURS[day];

    if (slot.open !== null && mins < slot.open * 60) {
      const open = new Date(from);
      open.setHours(slot.open, 0, 0, 0);
      return open;
    }

    for (let i = 1; i <= 7; i++) {
      const nextDay = (day + i) % 7;
      const nextSlot = HOURS[nextDay];
      if (nextSlot.open !== null) {
        const open = new Date(from);
        open.setDate(open.getDate() + i);
        open.setHours(nextSlot.open, 0, 0, 0);
        return open;
      }
    }
    return null;
  }

  function formatCountdown(prefix, target) {
    const now = new Date();
    const diff = Math.max(0, target.getTime() - now.getTime());
    const totalMins = Math.floor(diff / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0) return prefix + ' ' + h + 'h ' + m + 'm';
    return prefix + ' ' + m + 'm';
  }

  function formatHours(slot) {
    if (slot.open === null) return 'Closed';
    const fmt = function (h) {
      if (h === 0) return '12:00am';
      if (h === 12) return '12:00pm';
      const hour = h > 12 ? h - 12 : h;
      return hour + ':00' + (h >= 12 ? 'pm' : 'am');
    };
    return fmt(slot.open) + ' – ' + fmt(slot.close);
  }

  function renderSchedule() {
    const now = new Date();
    const today = now.getDay();
    const container = document.getElementById('schedule');
    if (!container) return;

    container.innerHTML = '';
    container.setAttribute('role', 'table');
    for (let i = 0; i < 7; i++) {
      const slot = HOURS[i];
      const row = document.createElement('div');
      row.className = 'schedule-row' + (i === today ? ' today' : '') + (slot.open === null ? ' closed' : '');
      row.setAttribute('role', 'row');
      const dayCell = document.createElement('span');
      dayCell.className = 'day';
      dayCell.setAttribute('role', 'cell');
      dayCell.textContent = DAYS[i];
      const hoursCell = document.createElement('span');
      hoursCell.className = 'hours';
      hoursCell.setAttribute('role', 'cell');
      hoursCell.textContent = formatHours(slot);
      row.appendChild(dayCell);
      row.appendChild(hoursCell);
      container.appendChild(row);
    }
  }

  function updateStatusAndCountdown() {
    const now = new Date();
    const statusEl = document.getElementById('status-value');
    const countdownEl = document.getElementById('countdown');

    if (!statusEl || !countdownEl) return;

    const open = isOpenAt(now);
    statusEl.textContent = open ? 'Open' : 'Closed';
    statusEl.classList.toggle('is-open', open);
    statusEl.classList.toggle('is-closed', !open);

    if (open) {
      const nextClose = nextCloseTime(now);
      countdownEl.textContent = nextClose ? formatCountdown('Closes in', nextClose) : '—';
    } else {
      const nextOpen = nextOpenTime(now);
      countdownEl.textContent = nextOpen ? formatCountdown('Opens in', nextOpen) : '—';
    }
  }

  function initTheme() {
    const stored = localStorage.getItem('library-theme');
    const root = document.documentElement;
    if (stored === 'light' || stored === 'dark') {
      root.setAttribute('data-theme', stored);
    } else {
      root.removeAttribute('data-theme');
    }
  }

  function setupThemeToggle() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let next;
      if (current === 'light') next = 'dark';
      else if (current === 'dark') next = 'light';
      else next = prefersDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('library-theme', next);
    });
  }

  function tick() {
    updateStatusAndCountdown();
  }

  function init() {
    initTheme();
    setupThemeToggle();
    renderSchedule();
    tick();
    setInterval(tick, 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
