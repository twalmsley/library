/**
 * Library Opening Times – opening hours data, open/close logic, countdown, theme.
 * All times are local; no timezone conversion.
 * Supports multiple libraries (North, Central) with tab selection.
 */

(function () {
  'use strict';

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Each library: name (tab label), hours array (index = day 0–6). open/close in hours (e.g. 14 = 2pm, 17.5 = 5:30pm).
  const LIBRARIES = {
    north: {
      name: 'North',
      hours: [
        { open: 11, close: 15 },   // Sunday 11am–3pm
        { open: 14, close: 18 },   // Monday 2pm–6pm
        { open: null, close: null },
        { open: 10, close: 14 },   // Wednesday 10am–2pm
        { open: null, close: null },
        { open: 13, close: 17 },   // Friday 1pm–5pm
        { open: 10, close: 14 },   // Saturday 10am–2pm
      ],
    },
    central: {
      name: 'Central',
      hours: [
        { open: null, close: null },                    // Sunday closed
        { open: 10, close: 17.5 },                      // Monday–Friday 10am–5:30pm
        { open: 10, close: 17.5 },
        { open: 10, close: 17.5 },
        { open: 10, close: 17.5 },
        { open: 10, close: 17.5 },
        { open: 10, close: 16 },                        // Saturday 10am–4pm
      ],
    },
  };

  const STORAGE_KEY = 'library-selection';
  let selectedLibraryId = 'north';

  function minutesSinceMidnight(d) {
    return d.getHours() * 60 + d.getMinutes();
  }

  function hourToHMS(h) {
    const hour = Math.floor(h);
    const min = Math.round((h - hour) * 60);
    return [hour, min, 0, 0];
  }

  function isOpenAt(date, hours) {
    const day = date.getDay();
    const slot = hours[day];
    if (slot.open === null) return false;
    const mins = minutesSinceMidnight(date);
    return mins >= slot.open * 60 && mins < slot.close * 60;
  }

  function nextCloseTime(fromDate, hours) {
    const from = new Date(fromDate);
    const day = from.getDay();
    const mins = minutesSinceMidnight(from);
    const slot = hours[day];

    if (slot.open !== null && mins >= slot.open * 60 && mins < slot.close * 60) {
      const close = new Date(from);
      close.setHours.apply(close, hourToHMS(slot.close));
      return close;
    }

    for (let i = 1; i <= 7; i++) {
      const nextDay = (day + i) % 7;
      const nextSlot = hours[nextDay];
      if (nextSlot.open !== null) {
        const close = new Date(from);
        close.setDate(close.getDate() + i);
        close.setHours.apply(close, hourToHMS(nextSlot.close));
        return close;
      }
    }
    return null;
  }

  function nextOpenTime(fromDate, hours) {
    const from = new Date(fromDate);
    const day = from.getDay();
    const mins = minutesSinceMidnight(from);
    const slot = hours[day];

    if (slot.open !== null && mins < slot.open * 60) {
      const open = new Date(from);
      open.setHours.apply(open, hourToHMS(slot.open));
      return open;
    }

    for (let i = 1; i <= 7; i++) {
      const nextDay = (day + i) % 7;
      const nextSlot = hours[nextDay];
      if (nextSlot.open !== null) {
        const open = new Date(from);
        open.setDate(open.getDate() + i);
        open.setHours.apply(open, hourToHMS(nextSlot.open));
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
      const hour = Math.floor(h);
      const min = Math.round((h - hour) * 60);
      if (hour === 0 && min === 0) return '12:00am';
      if (hour === 12 && min === 0) return '12:00pm';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const suffix = hour >= 12 ? 'pm' : 'am';
      if (min === 0) return displayHour + ':00' + suffix;
      const minStr = min < 10 ? '0' + min : String(min);
      return displayHour + ':' + minStr + suffix;
    };
    return fmt(slot.open) + ' – ' + fmt(slot.close);
  }

  function getSelectedHours() {
    return LIBRARIES[selectedLibraryId].hours;
  }

  function renderTabs() {
    const tablist = document.getElementById('library-tabs');
    if (!tablist) return;
    tablist.innerHTML = '';
    Object.keys(LIBRARIES).forEach(function (id) {
      const lib = LIBRARIES[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab' + (id === selectedLibraryId ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', id === selectedLibraryId ? 'true' : 'false');
      btn.id = 'tab-' + id;
      btn.setAttribute('aria-controls', 'tabpanel-library');
      btn.textContent = lib.name;
      btn.addEventListener('click', function () {
        if (selectedLibraryId === id) return;
        selectedLibraryId = id;
        try {
          localStorage.setItem(STORAGE_KEY, id);
        } catch (e) {}
        renderTabs();
        const hours = getSelectedHours();
        renderSchedule(hours);
        updateStatusAndCountdown(hours);
      });
      tablist.appendChild(btn);
    });
    const panel = document.getElementById('tabpanel-library');
    if (panel) panel.setAttribute('aria-labelledby', 'tab-' + selectedLibraryId);
  }

  function renderSchedule(hours) {
    const now = new Date();
    const today = now.getDay();
    const container = document.getElementById('schedule');
    if (!container) return;

    container.innerHTML = '';
    container.setAttribute('role', 'table');
    for (let i = 0; i < 7; i++) {
      const slot = hours[i];
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

  function updateStatusAndCountdown(hours) {
    const now = new Date();
    const statusEl = document.getElementById('status-value');
    const countdownEl = document.getElementById('countdown');

    if (!statusEl || !countdownEl) return;

    const open = isOpenAt(now, hours);
    statusEl.textContent = open ? 'Open' : 'Closed';
    statusEl.classList.toggle('is-open', open);
    statusEl.classList.toggle('is-closed', !open);

    if (open) {
      const nextClose = nextCloseTime(now, hours);
      countdownEl.textContent = nextClose ? formatCountdown('Closes in', nextClose) : '—';
    } else {
      const nextOpen = nextOpenTime(now, hours);
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
    updateStatusAndCountdown(getSelectedHours());
  }

  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LIBRARIES[stored]) selectedLibraryId = stored;
    } catch (e) {}
    initTheme();
    setupThemeToggle();
    renderTabs();
    const hours = getSelectedHours();
    renderSchedule(hours);
    updateStatusAndCountdown(hours);
    setInterval(tick, 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
