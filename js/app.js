/* Holidays — trip planner.
   Everything is stored in this browser (localStorage). Use Settings → Backup
   to move data between devices. */
(() => {
  'use strict';

  const APP_VERSION = '1.0.0';
  const STORE_KEY = 'holidays.data.v1';

  const THEMES = ['ocean', 'sunset', 'lagoon', 'forest', 'berry', 'dusk'];
  const EMOJIS = ['🏝️', '🏖️', '🏔️', '🏙️', '🏕️', '🎿', '🚢', '🏰', '🗼', '🌋', '🎡', '🌴'];
  const CURRENCIES = ['EUR', 'GBP', 'USD', 'RON', 'MDL', 'CHF', 'PLN', 'CZK', 'HUF', 'BGN', 'TRY', 'SEK', 'NOK', 'DKK', 'AED', 'CAD', 'AUD', 'JPY', 'THB'];

  const STAY_TYPES = [
    { id: 'hotel', label: 'Hotel', icon: '🏨' },
    { id: 'apartment', label: 'Apartment / house', icon: '🏠' },
    { id: 'villa', label: 'Villa / resort', icon: '🏡' },
    { id: 'bnb', label: 'B&B / hostel', icon: '🛏️' },
    { id: 'camping', label: 'Camping', icon: '🏕️' },
    { id: 'other', label: 'Other', icon: '🔑' },
  ];
  const TICKET_TYPES = [
    { id: 'flight', label: 'Flight', icon: '✈️' },
    { id: 'train', label: 'Train', icon: '🚆' },
    { id: 'bus', label: 'Bus / coach', icon: '🚌' },
    { id: 'ferry', label: 'Ferry / cruise', icon: '⛴️' },
    { id: 'car', label: 'Car hire', icon: '🚗' },
    { id: 'transfer', label: 'Taxi / transfer', icon: '🚕' },
    { id: 'event', label: 'Event / show', icon: '🎟️' },
    { id: 'attraction', label: 'Attraction / tour', icon: '🎡' },
    { id: 'other', label: 'Other', icon: '🎫' },
  ];
  const EXPENSE_CATS = [
    { id: 'food', label: 'Food & drink', icon: '🍽️' },
    { id: 'activities', label: 'Activities', icon: '🤿' },
    { id: 'transport', label: 'Local transport', icon: '🚇' },
    { id: 'parking', label: 'Parking & fuel', icon: '⛽' },
    { id: 'insurance', label: 'Insurance', icon: '🛡️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'fees', label: 'Fees & visas', icon: '🧾' },
    { id: 'other', label: 'Other', icon: '💳' },
  ];
  const KINDS = {
    stay: { label: 'Stay', plural: 'Stays', add: 'Add stay', icon: '🏨', hint: 'Hotel, apartment, villa — where you sleep' },
    ticket: { label: 'Ticket', plural: 'Tickets', add: 'Add ticket', icon: '✈️', hint: 'Flights, trains, events, attractions' },
    expense: { label: 'Extra cost', plural: 'Extras', add: 'Add cost', icon: '💳', hint: 'Food, insurance, parking, anything else' },
  };
  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'calendar' },
    { id: 'stays', label: 'Stays', icon: 'bed', kind: 'stay' },
    { id: 'tickets', label: 'Tickets', icon: 'ticket', kind: 'ticket' },
    { id: 'extras', label: 'Extras', icon: 'wallet', kind: 'expense' },
  ];

  const ICONS = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    sliders: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    bed: '<path d="M3 19V7M3 15h18v4M21 15v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11.5" r="1.7"/>',
    ticket: '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"/><path d="M14 7v10" stroke-dasharray="2 2.6"/>',
    wallet: '<path d="M4 7a2 2 0 0 1 2-2h11v4"/><path d="M4 7v10a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2z"/><circle cx="16" cy="14" r="1"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

  const $ = (sel, root = document) => root.querySelector(sel);
  const sidebar = $('#sidebar');
  const main = $('#main');
  const sheet = $('#sheet');
  const toastEl = $('#toast');

  /* ---------- helpers ---------- */

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const byId = (list, id) => list.find((x) => x.id === id) || list[list.length - 1];
  const round2 = (n) => Math.round(n * 100) / 100;

  function uid() {
    const bytes = new Uint8Array(9);
    crypto.getRandomValues(bytes);
    return Date.now().toString(36) + Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10);
  }

  const pad = (n) => String(n).padStart(2, '0');
  const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = () => toDateStr(new Date());
  function parseDate(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const dayDiff = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);

  function fmtDate(s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
    return s ? new Intl.DateTimeFormat(undefined, opts).format(parseDate(s)) : '';
  }
  function fmtRange(a, b) {
    const full = { day: 'numeric', month: 'short', year: 'numeric' };
    if (!a && !b) return 'Dates not set';
    if (!a || !b || a === b) return fmtDate(a || b, full);
    const f = new Intl.DateTimeFormat(undefined, full);
    try {
      return f.formatRange(parseDate(a), parseDate(b));
    } catch {
      return `${f.format(parseDate(a))} – ${f.format(parseDate(b))}`;
    }
  }
  function fmtShortRange(a, b) {
    const short = { day: 'numeric', month: 'short' };
    if (!a && !b) return '';
    if (!a || !b || a === b) return fmtDate(a || b, short);
    const f = new Intl.DateTimeFormat(undefined, short);
    try {
      return f.formatRange(parseDate(a), parseDate(b));
    } catch {
      return `${f.format(parseDate(a))} – ${f.format(parseDate(b))}`;
    }
  }

  function fmtMoney(n, cur) {
    const digits = Number.isInteger(round2(n)) ? 0 : 2;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
    } catch {
      return `${n.toFixed(digits)} ${cur}`;
    }
  }
  function parseMoney(v) {
    const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? round2(n) : 0;
  }

  function safeUrl(v) {
    let s = String(v || '').trim();
    if (!s) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;
    try {
      const u = new URL(s);
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
    } catch {
      return '';
    }
  }

  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------- data ---------- */

  function guessCurrency() {
    const region = (navigator.language || '').split('-')[1]?.toUpperCase();
    const map = { GB: 'GBP', US: 'USD', RO: 'RON', MD: 'MDL', CH: 'CHF', PL: 'PLN', CA: 'CAD', AU: 'AUD', SE: 'SEK', NO: 'NOK', DK: 'DKK', CZ: 'CZK', HU: 'HUF', BG: 'BGN', TR: 'TRY', JP: 'JPY', AE: 'AED', TH: 'THB' };
    return map[region] || 'EUR';
  }

  // Everything read from storage or a backup file goes through these, so a
  // damaged or hand-edited file can never put unexpected values on screen.
  const cleanStr = (v, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '');
  const cleanDate = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseDate(v).getTime()) ? v : '');
  const cleanTime = (v) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : '');
  const cleanNum = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? round2(n) : 0; };
  const cleanId = (v) => (typeof v === 'string' && /^[\w-]{4,64}$/.test(v) ? v : uid());
  const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);

  function cleanItem(raw) {
    if (!raw || typeof raw !== 'object' || !KINDS[raw.kind]) return null;
    const it = {
      id: cleanId(raw.id),
      kind: raw.kind,
      cost: cleanNum(raw.cost),
      paidFull: raw.paidFull === true,
      paidAmount: cleanNum(raw.paidAmount),
      ref: cleanStr(raw.ref, 80),
      notes: cleanStr(raw.notes, 2000),
    };
    if (it.kind === 'stay') {
      Object.assign(it, {
        type: oneOf(raw.type, STAY_TYPES.map((t) => t.id), 'hotel'),
        name: cleanStr(raw.name),
        address: cleanStr(raw.address),
        checkIn: cleanDate(raw.checkIn),
        checkOut: cleanDate(raw.checkOut),
        link: safeUrl(cleanStr(raw.link, 1000)),
      });
    } else if (it.kind === 'ticket') {
      Object.assign(it, {
        type: oneOf(raw.type, TICKET_TYPES.map((t) => t.id), 'other'),
        name: cleanStr(raw.name),
        from: cleanStr(raw.from),
        to: cleanStr(raw.to),
        date: cleanDate(raw.date),
        time: cleanTime(raw.time),
        qty: Math.min(99, Math.max(1, Math.round(Number(raw.qty)) || 1)),
      });
    } else {
      Object.assign(it, {
        type: oneOf(raw.type, EXPENSE_CATS.map((t) => t.id), 'other'),
        name: cleanStr(raw.name),
        date: cleanDate(raw.date),
      });
    }
    return it;
  }

  function cleanTrip(raw, defaultCurrency) {
    if (!raw || typeof raw !== 'object') return null;
    return {
      id: cleanId(raw.id),
      name: cleanStr(raw.name) || 'Untitled trip',
      destination: cleanStr(raw.destination),
      startDate: cleanDate(raw.startDate),
      endDate: cleanDate(raw.endDate),
      travellers: Math.min(50, Math.max(1, Math.round(Number(raw.travellers)) || 1)),
      currency: oneOf(raw.currency, CURRENCIES, defaultCurrency),
      budget: cleanNum(raw.budget),
      emoji: oneOf(raw.emoji, EMOJIS, EMOJIS[0]),
      theme: oneOf(raw.theme, THEMES, THEMES[0]),
      notes: cleanStr(raw.notes, 4000),
      updatedAt: Number(raw.updatedAt) || 0,
      items: (Array.isArray(raw.items) ? raw.items : []).map(cleanItem).filter(Boolean),
    };
  }

  function cleanData(raw) {
    const currency = oneOf(raw?.settings?.currency, CURRENCIES, guessCurrency());
    return {
      version: 1,
      settings: { currency },
      trips: (Array.isArray(raw?.trips) ? raw.trips : []).map((t) => cleanTrip(t, currency)).filter(Boolean),
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return cleanData(JSON.parse(raw));
    } catch (err) {
      console.error('Could not read saved trips', err);
    }
    return cleanData({});
  }

  let askedPersist = false;
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error(err);
      toast('Could not save — browser storage is full or blocked');
      return;
    }
    if (!askedPersist && navigator.storage?.persist) {
      askedPersist = true;
      navigator.storage.persist().catch(() => {});
    }
  }

  let state = load();

  /* ---------- trip maths ---------- */

  const paidOf = (it) => (it.paidFull ? it.cost : Math.min(it.paidAmount || 0, it.cost));

  function totals(trip) {
    const by = { stay: 0, ticket: 0, expense: 0 };
    let total = 0;
    let paid = 0;
    for (const it of trip.items) {
      by[it.kind] += it.cost;
      total += it.cost;
      paid += paidOf(it);
    }
    return { by, total: round2(total), paid: round2(paid), due: round2(total - paid) };
  }

  function tripStatus(t) {
    const today = todayStr();
    if (!t.startDate) return { key: 'upcoming', label: 'No dates yet' };
    const end = t.endDate || t.startDate;
    if (today < t.startDate) {
      const n = dayDiff(today, t.startDate);
      return { key: 'upcoming', label: n === 1 ? 'Tomorrow' : `In ${n} days` };
    }
    if (today > end) return { key: 'past', label: 'Done' };
    const length = dayDiff(t.startDate, end) + 1;
    return { key: 'now', label: length > 1 ? `Day ${dayDiff(t.startDate, today) + 1} of ${length}` : 'Today' };
  }

  const itemDate = (it) => (it.kind === 'stay' ? it.checkIn : it.date);
  const itemsOf = (trip, kind) => trip.items
    .filter((it) => it.kind === kind)
    .sort((a, b) => ((itemDate(a) || '9999') + (a.time || '')).localeCompare((itemDate(b) || '9999') + (b.time || '')));

  /* ---------- routing ---------- */

  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    if (parts[0] === 'trip' && parts[1]) {
      return { view: 'trip', id: parts[1], tab: TABS.some((t) => t.id === parts[2]) ? parts[2] : 'overview' };
    }
    return { view: 'home' };
  }
  const currentTrip = () => {
    const r = route();
    return r.view === 'trip' ? state.trips.find((t) => t.id === r.id) : null;
  };

  /* ---------- rendering ---------- */

  let lastScreen = '';
  function render() {
    const r = route();
    const trip = r.view === 'trip' ? state.trips.find((t) => t.id === r.id) : null;
    if (r.view === 'trip' && !trip) {
      location.replace('#/');
      return;
    }
    document.body.dataset.view = trip ? 'trip' : 'home';
    renderSidebar(trip);
    main.innerHTML = trip ? tripHtml(trip, r.tab) : welcomeHtml();
    document.title = trip ? `${trip.name} · Holidays` : 'Holidays';

    const screen = trip ? `${trip.id}/${r.tab}` : 'home';
    if (screen !== lastScreen) {
      lastScreen = screen;
      window.scrollTo(0, 0);
      main.scrollTop = 0;
    }
  }

  function renderSidebar(active) {
    const groups = { now: [], upcoming: [], past: [] };
    for (const t of state.trips) groups[tripStatus(t).key].push(t);
    groups.now.sort((a, b) => a.startDate.localeCompare(b.startDate));
    groups.upcoming.sort((a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999'));
    groups.past.sort((a, b) => b.startDate.localeCompare(a.startDate));

    const section = (label, list) => (list.length
      ? `<h2 class="list-label">${label}</h2>${list.map((t) => tripCard(t, active)).join('')}`
      : '');

    const list = state.trips.length
      ? section('Happening now', groups.now) + section('Upcoming', groups.upcoming) + section('Past trips', groups.past)
      : `<div class="empty">
           <div class="big">🧳</div>
           <h3>No trips yet</h3>
           <p>Add your first holiday, then fill in where you're staying, your tickets and what it all costs.</p>
         </div>`;

    sidebar.innerHTML = `
      <header class="home-head">
        <div><p class="eyebrow">Trip planner</p><h1>Holidays</h1></div>
        <button class="icon-btn" data-action="settings" aria-label="Settings and backup">${icon('sliders')}</button>
      </header>
      <div class="new-trip-wrap">
        <button class="btn primary block" data-action="new-trip">${icon('plus')} New trip</button>
      </div>
      <div class="trip-list">${list}</div>`;
  }

  function tripCard(t, active) {
    const st = tripStatus(t);
    const tot = totals(t);
    return `
      <a class="trip-card theme-${t.theme}${active?.id === t.id ? ' is-active' : ''}" href="#/trip/${t.id}">
        <span class="trip-tile" aria-hidden="true">${t.emoji}</span>
        <span class="trip-card-body">
          <strong>${esc(t.name)}</strong>
          ${t.destination ? `<span class="sub">${esc(t.destination)}</span>` : ''}
          <span class="sub">${esc(fmtRange(t.startDate, t.endDate))}</span>
        </span>
        <span class="trip-card-meta">
          <b>${esc(fmtMoney(tot.total, t.currency))}</b>
          <span class="pill pill-${st.key}">${esc(st.label)}</span>
        </span>
      </a>`;
  }

  function welcomeHtml() {
    const has = state.trips.length > 0;
    return `
      <div class="content welcome">
        <div class="empty">
          <div class="big">${has ? '🗺️' : '🧳'}</div>
          <h3>${has ? 'Pick a trip' : 'Plan your first holiday'}</h3>
          <p>${has
            ? 'Choose a trip on the left to see its stays, tickets and costs.'
            : "Create a trip, then add where you're staying, your tickets and everything it costs."}</p>
          ${has ? '' : `<button class="btn primary" data-action="new-trip">${icon('plus')} New trip</button>`}
        </div>
      </div>`;
  }

  function tripHtml(trip, tabId) {
    const st = tripStatus(trip);
    const tot = totals(trip);
    const tab = TABS.find((t) => t.id === tabId);
    const nights = trip.startDate && trip.endDate ? dayDiff(trip.startDate, trip.endDate) : 0;
    const meta = [fmtRange(trip.startDate, trip.endDate), nights > 0 ? plural(nights, 'night') : '', plural(trip.travellers, 'traveller')]
      .filter(Boolean).join('  ·  ');

    const body = tab.kind ? listTabHtml(trip, tab.kind) : overviewHtml(trip, tot, nights);

    return `
      <div class="topbar">
        <a class="back" href="#/">${icon('back')}<span>Trips</span></a>
        <button class="chip-btn" data-action="edit-trip">${icon('edit')} Edit trip</button>
      </div>
      <div class="content">
        <section class="hero theme-${trip.theme}">
          <span class="hero-emoji" aria-hidden="true">${trip.emoji}</span>
          <span class="hero-pill">${esc(st.label)}</span>
          <h2>${esc(trip.name)}</h2>
          ${trip.destination ? `<p class="hero-dest">${esc(trip.destination)}</p>` : ''}
          <p class="hero-meta">${esc(meta)}</p>
        </section>

        <div class="toolbar">
          <nav class="tabs" aria-label="Trip sections">
            ${TABS.map((t) => `<a class="tab" href="#/trip/${trip.id}/${t.id}" data-tab ${t.id === tab.id ? 'aria-current="page"' : ''}>${icon(t.icon)}<span>${t.label}</span></a>`).join('')}
          </nav>
          <button class="btn primary fab" data-action="add" ${tab.kind ? `data-kind="${tab.kind}"` : ''}>${icon('plus')} ${tab.kind ? KINDS[tab.kind].add : 'Add'}</button>
        </div>

        <div class="tab-body">${body}</div>
      </div>`;
  }

  function overviewHtml(trip, tot, nights) {
    const cur = trip.currency;
    const money = (n) => esc(fmtMoney(n, cur));

    let fourth = '';
    if (trip.travellers > 1) {
      fourth = `<div class="stat"><span>Per person</span><b>${money(tot.total / trip.travellers)}</b><small>${plural(trip.travellers, 'traveller')}</small></div>`;
    } else if (nights > 0) {
      fourth = `<div class="stat"><span>Per night</span><b>${money(tot.total / nights)}</b><small>${plural(nights, 'night')}</small></div>`;
    }

    const stats = `
      <div class="stats">
        <div class="stat"><span>Total cost</span><b>${money(tot.total)}</b><small>${plural(trip.items.length, 'item')}</small></div>
        <div class="stat is-good"><span>Paid so far</span><b>${money(tot.paid)}</b><small>${tot.total ? Math.round((tot.paid / tot.total) * 100) : 0}% of total</small></div>
        <div class="stat ${tot.due > 0 ? 'is-due' : ''}"><span>Still to pay</span><b>${money(tot.due)}</b><small>${tot.due > 0 ? 'outstanding' : 'all settled'}</small></div>
        ${fourth}
      </div>`;

    let budget = '';
    if (trip.budget > 0) {
      const over = tot.total > trip.budget;
      const pct = Math.min(100, Math.round((tot.total / trip.budget) * 100));
      budget = `
        <div class="card">
          <div class="meter-label"><span>Budget</span><b>${money(tot.total)} of ${money(trip.budget)}</b></div>
          <div class="meter ${over ? 'over' : ''}"><i style="width:${pct}%"></i></div>
          <p class="meter-note">${over ? `Over budget by ${money(tot.total - trip.budget)}` : `${money(trip.budget - tot.total)} left to spend`}</p>
        </div>`;
    }

    let split = '';
    if (tot.total > 0) {
      const row = (kind) => `
        <div class="split-row">
          <span>${KINDS[kind].plural}</span>
          <div class="meter"><i class="${kind}" style="width:${Math.round((tot.by[kind] / tot.total) * 100)}%"></i></div>
          <b>${money(tot.by[kind])}</b>
        </div>`;
      split = `<div class="card">${row('stay')}${row('ticket')}${row('expense')}</div>`;
    }

    const notes = trip.notes
      ? `<div class="section-head"><h3>Notes</h3></div><div class="card"><p class="notes-text">${esc(trip.notes)}</p></div>`
      : '';

    return `
      ${stats}${budget}${split}
      <div class="section-head"><h3>Itinerary</h3></div>
      ${itineraryHtml(trip)}
      ${notes}`;
  }

  function itineraryHtml(trip) {
    if (!trip.items.length) {
      return `
        <div class="empty">
          <div class="big">📍</div>
          <h3>Nothing planned yet</h3>
          <p>Add where you're staying, your tickets and any other costs — they'll line up here by date.</p>
          <button class="btn primary" data-action="add">${icon('plus')} Add something</button>
        </div>`;
    }

    // Entries sort by day, then: check-outs, timed things, check-ins, everything else.
    const entries = [];
    for (const it of trip.items) {
      const date = itemDate(it);
      const order = it.kind === 'stay' ? '2' : it.time ? `1${it.time}` : '3';
      entries.push({ date, order, it });
      if (it.kind === 'stay' && it.checkOut && it.checkOut !== it.checkIn) {
        entries.push({ date: it.checkOut, order: '0', it, checkout: true });
      }
    }
    entries.sort((a, b) => ((a.date || '9999') + a.order).localeCompare((b.date || '9999') + b.order));

    const today = todayStr();
    const days = [];
    for (const e of entries) {
      if (!days.length || days[days.length - 1].date !== e.date) days.push({ date: e.date, list: [] });
      days[days.length - 1].list.push(e);
    }

    return days.map((d) => {
      let tag = '';
      if (d.date && trip.startDate && d.date >= trip.startDate && (!trip.endDate || d.date <= trip.endDate)) {
        tag = `Day ${dayDiff(trip.startDate, d.date) + 1}`;
      }
      const head = d.date
        ? `<span>${esc(fmtDate(d.date))}</span>${tag ? `<small>${tag}</small>` : ''}${d.date === today ? '<span class="pill pill-now">Today</span>' : ''}`
        : '<span>No date yet</span>';
      const rows = d.list.map((e) => (e.checkout
        ? `<div class="item is-minor"><div class="item-row"><span aria-hidden="true">👋</span><span>Check out of ${esc(e.it.name)}</span></div></div>`
        : itemHtml(trip, e.it, false))).join('');
      return `<section class="day"><h4 class="day-head">${head}</h4>${rows}</section>`;
    }).join('');
  }

  function listTabHtml(trip, kind) {
    const list = itemsOf(trip, kind);
    const k = KINDS[kind];
    if (!list.length) {
      const copy = {
        stay: ['🏨', 'No stays yet', 'Add the hotel, apartment or villa — with check-in and check-out dates and what it costs.'],
        ticket: ['🎟️', 'No tickets yet', 'Add flights, trains, events and attractions with their dates and prices.'],
        expense: ['💳', 'No extra costs yet', 'Track everything else: food, insurance, parking, shopping…'],
      }[kind];
      return `
        <div class="empty">
          <div class="big">${copy[0]}</div>
          <h3>${copy[1]}</h3>
          <p>${copy[2]}</p>
          <button class="btn primary" data-action="add" data-kind="${kind}">${icon('plus')} ${k.add}</button>
        </div>`;
    }
    const sum = list.reduce((s, it) => s + it.cost, 0);
    return `
      <div class="section-head"><h3>${k.plural}</h3><span>${plural(list.length, 'item')} · ${esc(fmtMoney(sum, trip.currency))}</span></div>
      ${list.map((it) => itemHtml(trip, it, true)).join('')}`;
  }

  function payBadge(it, cur) {
    if (!it.cost) return '';
    const paid = paidOf(it);
    if (paid >= it.cost) return '<span class="badge paid">Paid</span>';
    if (paid > 0) return `<span class="badge part">${esc(fmtMoney(it.cost - paid, cur))} to pay</span>`;
    return '<span class="badge due">To pay</span>';
  }

  function itemHtml(trip, it, detailed) {
    const cur = trip.currency;
    let glyph;
    let lines = [];
    let small = '';

    if (it.kind === 'stay') {
      glyph = byId(STAY_TYPES, it.type).icon;
      const nights = it.checkIn && it.checkOut ? dayDiff(it.checkIn, it.checkOut) : 0;
      lines.push([fmtShortRange(it.checkIn, it.checkOut), nights > 0 ? plural(nights, 'night') : ''].filter(Boolean).join(' · '));
      if (it.address) lines.push(it.address);
      if (nights > 0 && it.cost > 0) small = `${fmtMoney(it.cost / nights, cur)} / night`;
    } else if (it.kind === 'ticket') {
      const type = byId(TICKET_TYPES, it.type);
      glyph = type.icon;
      const journey = it.from && it.to ? `${it.from} → ${it.to}` : it.from || it.to;
      if (journey) lines.push(journey);
      const when = [detailed ? fmtDate(it.date) : '', it.time].filter(Boolean).join(', ');
      lines.push([when, it.qty > 1 ? plural(it.qty, 'ticket') : (journey ? '' : type.label)].filter(Boolean).join(' · '));
      if (it.qty > 1 && it.cost > 0) small = `${fmtMoney(it.cost / it.qty, cur)} each`;
    } else {
      const cat = byId(EXPENSE_CATS, it.type);
      glyph = cat.icon;
      lines.push([cat.label, detailed ? fmtDate(it.date) : ''].filter(Boolean).join(' · '));
    }

    let extras = '';
    if (detailed) {
      const links = [];
      if (it.kind === 'stay' && it.address) {
        links.push(`<a class="chip-btn" href="https://maps.apple.com/?q=${encodeURIComponent(it.address)}" target="_blank" rel="noopener noreferrer">📍 Map</a>`);
      }
      if (it.kind === 'stay' && it.link) {
        links.push(`<a class="chip-btn" href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">🔗 Booking</a>`);
      }
      if (it.ref) {
        links.push(`<button class="chip-btn" data-action="copy" data-text="${esc(it.ref)}" title="Copy booking reference">Ref ${esc(it.ref)}</button>`);
      }
      if (links.length) extras += `<div class="item-links">${links.join('')}</div>`;
      if (it.notes) extras += `<p class="item-notes">${esc(it.notes)}</p>`;
    }

    return `
      <article class="item">
        <button class="item-main" data-action="edit-item" data-id="${it.id}" title="Tap to edit">
          <span class="item-icon" aria-hidden="true">${glyph}</span>
          <span class="item-body">
            <strong>${esc(it.name)}</strong>
            ${lines.filter(Boolean).map((l) => `<span class="sub">${esc(l)}</span>`).join('')}
          </span>
          <span class="item-amt">
            <b>${esc(fmtMoney(it.cost, cur))}</b>
            ${payBadge(it, cur)}
            ${small && detailed ? `<small>${esc(small)}</small>` : ''}
          </span>
        </button>
        ${extras}
      </article>`;
  }

  /* ---------- sheets & forms ---------- */

  let sheetCtx = null;

  function openSheet({ title, body, onSubmit, onDelete, deleteLabel, validate, doneOnly }) {
    sheetCtx = { onSubmit, onDelete, validate };
    sheet.innerHTML = `
      <form class="sheet-form" autocomplete="off">
        <header class="sheet-head">
          ${doneOnly ? '<span></span>' : '<button type="button" class="link-btn" data-action="close-sheet">Cancel</button>'}
          <h2>${esc(title)}</h2>
          ${doneOnly
            ? '<button type="button" class="link-btn strong" data-action="close-sheet">Done</button>'
            : '<button type="submit" class="link-btn strong">Save</button>'}
        </header>
        <div class="sheet-body">
          ${body}
          ${onDelete ? `<div class="sheet-danger"><button type="button" class="btn danger block" data-action="delete">${esc(deleteLabel)}</button></div>` : ''}
        </div>
      </form>`;
    sheet.setAttribute('aria-label', title);
    if (!sheet.open) sheet.showModal();
    $('.sheet-body', sheet).scrollTop = 0;
  }
  function closeSheet() {
    if (sheet.open) sheet.close();
  }
  sheet.addEventListener('close', () => {
    sheetCtx = null;
    sheet.innerHTML = '';
  });
  sheet.addEventListener('submit', (e) => {
    e.preventDefault();
    sheetCtx?.onSubmit?.(new FormData(e.target), e.target);
  });
  sheet.addEventListener('input', (e) => {
    const form = e.target.form;
    if (!form) return;
    if (e.target.name === 'paidFull') {
      const part = $('[data-paid-part]', form);
      if (part) part.hidden = e.target.checked;
    }
    sheetCtx?.validate?.(form);
  });

  const field = (label, control, hint = '') => `
    <label class="field"><span class="field-label">${label}</span>${control}${hint ? `<span class="field-hint">${hint}</span>` : ''}</label>`;
  const group = (label, control) => `
    <div class="field"><span class="field-label">${label}</span>${control}</div>`;
  const text = (name, value, attrs = '') => `<input type="text" name="${name}" value="${esc(value)}" ${attrs}>`;
  const date = (name, value) => `<input type="date" name="${name}" value="${esc(value)}">`;
  const money = (name, value, cur) => `
    <div class="money"><span>${esc(cur)}</span><input type="text" name="${name}" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]{0,2}" placeholder="0" value="${value ? esc(value) : ''}" title="An amount like 1250 or 89.90"></div>`;
  const select = (name, options, value) => `
    <select name="${name}">${options.map((o) => `<option value="${esc(o.id)}" ${o.id === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
  const textarea = (name, value, placeholder = '') => `<textarea name="${name}" rows="3" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;
  const typeOptions = (types) => types.map((t) => ({ id: t.id, label: `${t.icon}  ${t.label}` }));

  const paidFields = (it, cur) => `
    <label class="switch-row">
      <span><b>Paid in full</b><small>Leave off to record a deposit instead</small></span>
      <input type="checkbox" name="paidFull" role="switch" ${it.paidFull ? 'checked' : ''}>
    </label>
    <div data-paid-part ${it.paidFull ? 'hidden' : ''}>
      ${field('Paid so far', money('paidAmount', it.paidAmount, cur), 'Deposit or part payment — leave empty if nothing is paid yet')}
    </div>`;

  function orderCheck(form, startName, endName, message) {
    const start = form.elements[startName].value;
    const end = form.elements[endName];
    end.setCustomValidity(start && end.value && end.value < start ? message : '');
  }

  function openTripForm(trip) {
    const t = trip || {
      name: '', destination: '', startDate: '', endDate: '', travellers: 2,
      currency: state.settings.currency, budget: 0, notes: '',
      emoji: EMOJIS[state.trips.length % EMOJIS.length],
      theme: THEMES[state.trips.length % THEMES.length],
    };
    const chips = (name, options, value, show) => `
      <div class="chips">${options.map((o) => `
        <label class="chip"><input type="radio" name="${name}" value="${o}" ${o === value ? 'checked' : ''} aria-label="${name} ${o}">${show(o)}</label>`).join('')}
      </div>`;

    openSheet({
      title: trip ? 'Edit trip' : 'New trip',
      body: `
        ${field('Trip name', text('name', t.name, 'required maxlength="80" placeholder="Summer in Santorini"'))}
        ${field('Destination', text('destination', t.destination, 'maxlength="120" placeholder="Santorini, Greece"'))}
        <div class="row2">
          ${field('From', date('startDate', t.startDate))}
          ${field('To', date('endDate', t.endDate))}
        </div>
        <div class="row2">
          ${field('Travellers', `<input type="number" name="travellers" min="1" max="50" step="1" inputmode="numeric" value="${t.travellers}">`)}
          ${field('Currency', select('currency', CURRENCIES.map((c) => ({ id: c, label: c })), t.currency))}
        </div>
        ${field('Budget (optional)', money('budget', t.budget, t.currency), 'Leave empty if you just want to track costs')}
        ${group('Icon', chips('emoji', EMOJIS, t.emoji, (o) => `<span>${o}</span>`))}
        ${group('Colour', chips('theme', THEMES, t.theme, (o) => `<span class="swatch theme-${o}"></span>`))}
        ${field('Notes', textarea('notes', t.notes, 'Passport numbers to renew, packing ideas, who is driving…'))}`,
      validate: (form) => orderCheck(form, 'startDate', 'endDate', 'The end date is before the start date'),
      deleteLabel: 'Delete this trip',
      onDelete: trip && (() => {
        state.trips = state.trips.filter((x) => x.id !== trip.id);
        save();
        closeSheet();
        toast('Trip deleted');
        if (location.hash === '#/' || location.hash === '') render(); else location.hash = '#/';
      }),
      onSubmit: (fd) => {
        const data = cleanTrip({
          ...(trip || {}),
          id: trip?.id || uid(),
          name: fd.get('name').trim(),
          destination: fd.get('destination').trim(),
          startDate: fd.get('startDate'),
          endDate: fd.get('endDate') || fd.get('startDate'),
          travellers: fd.get('travellers'),
          currency: fd.get('currency'),
          budget: parseMoney(fd.get('budget')),
          emoji: fd.get('emoji'),
          theme: fd.get('theme'),
          notes: fd.get('notes').trim(),
          updatedAt: Date.now(),
        }, state.settings.currency);
        if (trip) Object.assign(trip, data);
        else state.trips.push(data);
        save();
        closeSheet();
        toast(trip ? 'Trip updated' : 'Trip created');
        if (trip) render(); else location.hash = `#/trip/${data.id}`;
      },
    });

    // Keep the currency label on the budget field in step with the picker.
    const form = $('form', sheet);
    form.elements.currency.addEventListener('change', (e) => {
      $('.money > span', form).textContent = e.target.value;
    });
  }

  function openAddChooser() {
    openSheet({
      title: 'Add to trip',
      doneOnly: true,
      body: Object.entries(KINDS).map(([kind, k]) => `
        <button type="button" class="choice" data-action="add" data-kind="${kind}">
          <span class="item-icon" aria-hidden="true">${k.icon}</span>
          <span><b>${k.label}</b><small>${k.hint}</small></span>
        </button>`).join(''),
    });
  }

  function openItemForm(trip, kind, item) {
    const cur = trip.currency;
    const k = KINDS[kind];
    const it = item || {
      kind, type: '', name: '', cost: 0, paidFull: false, paidAmount: 0, ref: '', notes: '',
      address: '', link: '', from: '', to: '', time: '', qty: trip.travellers,
      checkIn: trip.startDate, checkOut: trip.endDate, date: kind === 'ticket' ? trip.startDate : '',
    };

    let body;
    let validate;
    if (kind === 'stay') {
      body = `
        ${field('Type', select('type', typeOptions(STAY_TYPES), it.type || 'hotel'))}
        ${field('Name', text('name', it.name, 'required maxlength="100" placeholder="Hotel Aressana"'))}
        ${field('Address', text('address', it.address, 'maxlength="200" placeholder="Street, town"'))}
        <div class="row2">
          ${field('Check-in', date('checkIn', it.checkIn))}
          ${field('Check-out', date('checkOut', it.checkOut))}
        </div>
        ${field('Total cost', money('cost', it.cost, cur), 'For the whole stay')}
        ${paidFields(it, cur)}
        ${field('Booking reference', text('ref', it.ref, 'maxlength="80" autocapitalize="characters" placeholder="e.g. 4821.337.905"'))}
        ${field('Booking link', `<input type="text" name="link" value="${esc(it.link)}" maxlength="1000" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="booking.com/…">`)}
        ${field('Notes', textarea('notes', it.notes, 'Check-in from 3pm, key box code, breakfast included…'))}`;
      validate = (form) => orderCheck(form, 'checkIn', 'checkOut', 'Check-out is before check-in');
    } else if (kind === 'ticket') {
      body = `
        ${field('Type', select('type', typeOptions(TICKET_TYPES), it.type || 'flight'))}
        ${field('What is it?', text('name', it.name, 'required maxlength="100" placeholder="Flight to Athens"'))}
        <div class="row2">
          ${field('From', text('from', it.from, 'maxlength="80" placeholder="London LTN"'))}
          ${field('To', text('to', it.to, 'maxlength="80" placeholder="Athens ATH"'))}
        </div>
        <div class="row2">
          ${field('Date', date('date', it.date))}
          ${field('Time', `<input type="time" name="time" value="${esc(it.time)}">`)}
        </div>
        <div class="row2">
          ${field('Tickets', `<input type="number" name="qty" min="1" max="99" step="1" inputmode="numeric" value="${it.qty}">`)}
          ${field('Total cost', money('cost', it.cost, cur))}
        </div>
        ${paidFields(it, cur)}
        ${field('Booking reference', text('ref', it.ref, 'maxlength="80" autocapitalize="characters" placeholder="e.g. K7XQ2M"'))}
        ${field('Notes', textarea('notes', it.notes, 'Seats, baggage, terminal, meeting point…'))}`;
    } else {
      body = `
        ${field('Category', select('type', typeOptions(EXPENSE_CATS), it.type || 'food'))}
        ${field('What is it?', text('name', it.name, 'required maxlength="100" placeholder="Travel insurance"'))}
        <div class="row2">
          ${field('Date (optional)', date('date', it.date))}
          ${field('Cost', money('cost', it.cost, cur))}
        </div>
        ${paidFields(it, cur)}
        ${field('Notes', textarea('notes', it.notes))}`;
    }

    openSheet({
      title: item ? `Edit ${k.label.toLowerCase()}` : k.add,
      body,
      validate,
      deleteLabel: `Delete this ${k.label.toLowerCase()}`,
      onDelete: item && (() => {
        trip.items = trip.items.filter((x) => x.id !== item.id);
        trip.updatedAt = Date.now();
        save();
        closeSheet();
        render();
        toast(`${k.label} deleted`);
      }),
      onSubmit: (fd) => {
        const get = (name) => (fd.get(name) ?? '').toString().trim();
        const data = cleanItem({
          id: item?.id || uid(),
          kind,
          type: get('type'),
          name: get('name'),
          cost: parseMoney(get('cost')),
          paidFull: fd.get('paidFull') === 'on',
          paidAmount: parseMoney(get('paidAmount')),
          ref: get('ref'),
          notes: get('notes'),
          address: get('address'),
          link: get('link'),
          checkIn: get('checkIn'),
          checkOut: get('checkOut') || get('checkIn'),
          from: get('from'),
          to: get('to'),
          date: get('date'),
          time: get('time'),
          qty: get('qty'),
        });
        if (item) trip.items[trip.items.indexOf(item)] = data;
        else trip.items.push(data);
        trip.updatedAt = Date.now();
        save();
        closeSheet();
        render();
        toast(item ? 'Saved' : `${k.label} added`);
      },
    });
  }

  /* ---------- settings & backup ---------- */

  function openSettings() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const install = standalone
      ? '<p>Holidays is installed on this device. It opens full screen and works offline.</p>'
      : isIos
        ? `<p>Add Holidays to your Home Screen so it opens like an app and keeps working offline:</p>
           <ol><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>.</li></ol>`
        : `<p>Install Holidays so it gets its own window and Start menu entry:</p>
           <ol><li>Open this page in <b>Edge</b> or <b>Chrome</b>.</li><li>Click the <b>install icon</b> at the right of the address bar (or menu → Apps → Install).</li></ol>`;

    openSheet({
      title: 'Settings',
      doneOnly: true,
      body: `
        <section class="settings-block">
          <h3>Default currency</h3>
          <p>Used for new trips. Each trip can still have its own currency.</p>
          ${select('defaultCurrency', CURRENCIES.map((c) => ({ id: c, label: c })), state.settings.currency)}
        </section>
        <section class="settings-block">
          <h3>Backup &amp; transfer</h3>
          <p>Your trips are saved on this device only. Export a backup file to keep them safe or to copy them to another device, then import it there. Importing never deletes anything — it adds new trips and keeps whichever copy of a trip was edited last.</p>
          <div class="btn-row">
            <button type="button" class="btn" data-action="export">Export backup</button>
            <button type="button" class="btn" data-action="import">Import backup</button>
          </div>
        </section>
        <section class="settings-block">
          <h3>Install the app</h3>
          ${install}
        </section>
        <p class="version">Holidays ${APP_VERSION} · ${plural(state.trips.length, 'trip')} saved on this device</p>`,
    });
    $('[name="defaultCurrency"]', sheet).addEventListener('change', (e) => {
      state.settings.currency = oneOf(e.target.value, CURRENCIES, state.settings.currency);
      save();
      toast(`New trips will use ${state.settings.currency}`);
    });
  }

  async function exportBackup() {
    const payload = { app: 'holidays', version: 1, exportedAt: new Date().toISOString(), settings: state.settings, trips: state.trips };
    const name = `holidays-backup-${todayStr()}.json`;
    const json = JSON.stringify(payload, null, 2);

    // On phones the share sheet (Save to Files, AirDrop…) is the reliable way to hand over a file.
    if (window.matchMedia('(pointer: coarse)').matches && navigator.canShare) {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Holidays backup' });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }
    }
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Backup file saved to your downloads');
  }

  function importBackup() {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'application/json,.json', hidden: true });
    document.body.append(input);
    input.addEventListener('change', async () => {
      const file = input.files[0];
      input.remove();
      if (!file) return;
      try {
        const raw = JSON.parse(await file.text());
        if (!raw || !Array.isArray(raw.trips)) throw new Error('not a backup');
        const incoming = cleanData(raw).trips;
        let added = 0;
        let updated = 0;
        for (const t of incoming) {
          const i = state.trips.findIndex((x) => x.id === t.id);
          if (i < 0) { state.trips.push(t); added++; }
          else if (t.updatedAt > state.trips[i].updatedAt) { state.trips[i] = t; updated++; }
        }
        save();
        closeSheet();
        render();
        toast(added || updated ? `Imported: ${added} new, ${updated} updated` : 'Nothing new in that backup');
      } catch (err) {
        console.error(err);
        toast("That file isn't a Holidays backup");
      }
    });
    input.addEventListener('cancel', () => input.remove());
    input.click();
  }

  /* ---------- events ---------- */

  let armedDelete;
  const actions = {
    'new-trip': () => openTripForm(),
    'edit-trip': () => { const t = currentTrip(); if (t) openTripForm(t); },
    'settings': openSettings,
    'close-sheet': closeSheet,
    'export': exportBackup,
    'import': importBackup,
    'add': (el) => {
      const trip = currentTrip();
      if (!trip) return;
      if (el.dataset.kind) openItemForm(trip, el.dataset.kind);
      else openAddChooser();
    },
    'edit-item': (el) => {
      const trip = currentTrip();
      const item = trip?.items.find((x) => x.id === el.dataset.id);
      if (item) openItemForm(trip, item.kind, item);
    },
    'delete': (el) => {
      // Two taps to delete: the first one arms the button for a few seconds.
      if (!el.classList.contains('is-armed')) {
        el.classList.add('is-armed');
        el.dataset.label = el.textContent;
        el.textContent = 'Tap again to delete for good';
        clearTimeout(armedDelete);
        armedDelete = setTimeout(() => {
          if (el.isConnected) { el.classList.remove('is-armed'); el.textContent = el.dataset.label; }
        }, 4000);
        return;
      }
      clearTimeout(armedDelete);
      sheetCtx?.onDelete?.();
    },
    'copy': async (el) => {
      try {
        await navigator.clipboard.writeText(el.dataset.text);
        toast('Booking reference copied');
      } catch {
        toast(el.dataset.text);
      }
    },
  };

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('a[data-tab]');
    if (tab) {
      // Switching tabs replaces the history entry so Back returns to the trip list.
      e.preventDefault();
      location.replace(tab.getAttribute('href'));
      return;
    }
    const el = e.target.closest('[data-action]');
    if (el) actions[el.dataset.action]?.(el);
  });

  window.addEventListener('hashchange', () => {
    closeSheet();
    render();
  });
  document.addEventListener('visibilitychange', () => {
    // Refresh countdowns when the app comes back to the foreground.
    if (!document.hidden && !sheet.open) render();
  });
  window.addEventListener('storage', (e) => {
    // Another tab or window of the app changed the data.
    if (e.key === STORE_KEY && !sheet.open) { state = load(); render(); }
  });

  // Tell the form sheet how tall the on-screen keyboard is, so the last fields can scroll above it.
  if (window.visualViewport) {
    const vv = window.visualViewport;
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb', `${Math.round(kb)}px`);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Offline support unavailable', err));
    });
  }

  render();
})();
