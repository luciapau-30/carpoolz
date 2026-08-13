import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function getThisWeekDates() {
  // Returns Thu/Fri/Sat of the current week (Mon-based), and next Sun
  const today = new Date();
  const day = today.getDay(); // 0=Sun,1=Mon,...,6=Sat
  // Find this week's Thursday (day 4)
  const thu = new Date(today);
  thu.setDate(today.getDate() + ((4 - day + 7) % 7));
  const fri = new Date(thu); fri.setDate(thu.getDate() + 1);
  const sat = new Date(thu); sat.setDate(thu.getDate() + 2);
  const sun = new Date(thu); sun.setDate(thu.getDate() + 3);
  const fmt = (d) => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return { label: `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`, iso: d.toISOString().slice(0,10) };
  };
  return { thu: fmt(thu), fri: fmt(fri), sat: fmt(sat), sun: fmt(sun) };
}

function fmtWin(s, e) {
  const f = t => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hr = +h;
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };
  return e ? `${f(s)} – ${f(e)}` : f(s);
}

function overlap(ps, pe, cs, ce) { return ps <= ce && pe >= cs; }

function scoreMatch(su, car) {
  const [ps, pe] = car.dir === "up" ? [su.upTimeStart, su.upTimeEnd || "23:59"] : [su.downTimeStart, su.downTimeEnd || "23:59"];
  const date = car.dir === "up" ? su.upDate : su.downDate;
  // Hard blocks
  if (!overlap(ps, pe, car.winStart, car.winEnd)) return -1;
  if (car.seats - car.passengers.length - 1 <= 0) return -1; // no open seats
  if (car.dir === "down" && !su.upCarId) return -1; // no down without up
  let s = 50;
  if (date && car.date === date) s += 20;
  if (su.skiSunday === "Yes" && car.skiSunday) s += 10;
  if (su.skiSunday === "No" && !car.skiSunday) s += 10;
  return s;
}

const WEEK = getThisWeekDates();

const TIME_SLOTS = [
  { id: "morning", label: "Morning", sub: "8:00 AM – 11:00 AM", start: "08:00", end: "11:00" },
  { id: "lunch",   label: "Lunch",   sub: "12:00 PM – 3:00 PM",  start: "12:00", end: "15:00" },
  { id: "evening", label: "Evening", sub: "3:00 PM onward",      start: "15:00", end: null },
];

const TIERS = [
  { standing: "Officer",                              opensAt: new Date("2025-01-01") },
  { standing: "Member",                               opensAt: new Date("2025-01-01") },
  { standing: "Study Abroad/Graduating Early Member", opensAt: new Date("2025-01-01") },
  { standing: "Alumni",                               opensAt: new Date("2025-01-02") },
  { standing: "Guest",                                opensAt: new Date("2025-01-02") },
];

const SIGNUP_DEADLINE  = new Date("2099-01-01");
const REQUEST_DEADLINE = new Date("2099-01-01");
const NOW = new Date();
const DATE_ORDER = ["Thu","Fri","Sat","Sun","Mon"];
function sortCars(arr) {
  return [...arr].sort((a, b) => {
    const da = DATE_ORDER.findIndex(d => a.date?.startsWith(d));
    const db = DATE_ORDER.findIndex(d => b.date?.startsWith(d));
    if (da !== db) return da - db;
    return (a.winStart || "").localeCompare(b.winStart || "");
  });
}

// ─────────────────────────────────────────────────────────
// STYLES  (USC: cardinal #990000, gold #FFC72C, navy #003087)
// ─────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Raleway:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cardinal: #990000;
    --cardinal-dk: #6B0000;
    --cardinal-lt: #B30000;
    --gold: #FFC72C;
    --gold-dk: #E6A800;
    --navy: #003087;
    --cream: #FFF8E7;
    --card: rgba(255,255,255,0.06);
    --border: rgba(255,200,44,0.18);
    --border-lt: rgba(255,255,255,0.1);
    --text: #FFF8E7;
    --muted: rgba(255,248,231,0.5);
    --up: #FFC72C;
    --down: #FFD97A;
    --green: #4ade80;
    --red: #f87171;
    --warn: #fb923c;
    --purple: #c084fc;
  }
  body { font-family:'Raleway',sans-serif; background:var(--cardinal-dk); color:var(--text); min-height:100vh; overflow-x:hidden; }

  .app {
    min-height:100vh;
    background:
      linear-gradient(180deg, #6B0000 0%, #8B0000 40%, #7A0000 100%);
  }

  /* HEADER */
  .hdr-stripe { background:var(--navy); height:4px; width:100%; }
  .hdr { background:linear-gradient(180deg,#8B0000,#750000); padding:0 32px; display:flex; align-items:center; justify-content:center; gap:40px; position:relative; z-index:20; min-height:90px; border-bottom:2px solid var(--gold-dk); }
  .hdr-logo { display:flex; flex-direction:column; align-items:center; }
  .hdr-logo-box { background:var(--gold); border-radius:4px; padding:4px 8px; display:flex; flex-direction:column; align-items:center; }
  .hdr-logo-usc { font-family:'Bebas Neue',sans-serif; font-size:1.1rem; letter-spacing:3px; color:var(--cardinal-dk); line-height:1; }
  .hdr-logo-ski { font-size:1.2rem; }
  .hdr-club-name { font-family:'Bebas Neue',sans-serif; font-size:0.75rem; letter-spacing:3px; color:var(--gold); margin-top:4px; }
  .hdr-title { font-family:'Bebas Neue',sans-serif; font-size:3rem; letter-spacing:5px; color:var(--gold); line-height:1; text-shadow:0 2px 12px rgba(0,0,0,0.4); }
  .hdr-sub { display:none; }
  .deadline-pill { background:rgba(0,0,0,0.3); border:1px solid rgba(255,200,44,0.3); border-radius:100px; padding:8px 16px; font-size:0.72rem; color:rgba(255,200,44,0.8); font-family:'DM Mono',monospace; display:flex; align-items:center; gap:8px; }
  .dot { width:6px; height:6px; background:var(--gold); border-radius:50%; animation:pulse 1.5s ease-in-out infinite; flex-shrink:0; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* NAV */
  .nav { background:rgba(0,0,0,0.25); border-bottom:1px solid rgba(255,200,44,0.15); display:flex; align-items:center; gap:2px; padding:0 24px; position:relative; z-index:10; flex-wrap:wrap; }
  .nb { font-family:'Raleway',sans-serif; font-size:0.78rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:14px 18px; border:none; background:transparent; color:rgba(255,200,44,0.55); cursor:pointer; transition:all 0.2s; border-bottom:3px solid transparent; margin-bottom:-1px; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .nb:hover { color:var(--gold); }
  .nb.on { color:var(--gold); border-bottom-color:var(--gold); }
  .nb.adm { color:rgba(192,132,252,0.6); }
  .nb.adm:hover { color:var(--purple); }
  .nb.adm.on { color:var(--purple); border-bottom-color:var(--purple); }
  .notif { background:var(--warn); color:white; border-radius:50%; width:16px; height:16px; font-size:0.6rem; font-weight:700; display:inline-flex; align-items:center; justify-content:center; }
  .signed-in { margin-left:auto; font-family:'DM Mono',monospace; font-size:0.72rem; color:rgba(255,200,44,0.6); padding:14px 0; }
  .signed-in span { color:var(--gold); }

  .main { padding:28px 32px 60px; max-width:1160px; margin:0 auto; }

  /* CARDS */
  .card { background:rgba(0,0,0,0.25); border:1px solid var(--border); border-radius:16px; padding:24px; backdrop-filter:blur(8px); }
  .card.gold-tint { background:rgba(255,200,44,0.06); border-color:rgba(255,200,44,0.25); }
  .card.up-tint { background:rgba(255,200,44,0.05); border-color:rgba(255,200,44,0.2); }
  .card.down-tint { background:rgba(255,217,122,0.05); border-color:rgba(255,217,122,0.2); }
  .ct { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; letter-spacing:2px; color:var(--gold); margin-bottom:16px; }

  /* FIELDS */
  .f { margin-bottom:14px; }
  .f label { display:block; font-size:0.68rem; letter-spacing:2px; text-transform:uppercase; color:rgba(255,200,44,0.65); font-family:'DM Mono',monospace; margin-bottom:6px; }
  .f input,.f select,.f textarea { width:100%; background:rgba(0,0,0,0.3); border:1px solid rgba(255,200,44,0.2); border-radius:10px; padding:10px 14px; color:var(--text); font-family:'Raleway',sans-serif; font-size:0.9rem; outline:none; transition:border-color 0.2s; }
  .f input:focus,.f select:focus,.f textarea:focus { border-color:var(--gold); }
  .f select option { background:#6B0000; }
  .f textarea { resize:vertical; min-height:72px; }
  .twin { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .twin-label { font-size:0.62rem; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,200,44,0.5); font-family:'DM Mono',monospace; margin-bottom:4px; display:block; }

  /* BUTTONS */
  .btn { font-family:'Raleway',sans-serif; font-weight:700; font-size:0.85rem; letter-spacing:0.5px; padding:11px 26px; border-radius:100px; border:none; cursor:pointer; transition:all 0.2s; }
  .btn:disabled { opacity:0.35; cursor:not-allowed; }
  .bp { background:var(--gold); color:var(--cardinal-dk); }
  .bp:hover:not(:disabled) { background:#FFD860; transform:translateY(-1px); }
  .bw { width:100%; margin-top:8px; }
  .bs { font-size:0.76rem; padding:7px 16px; }
  .b-outline { background:transparent; color:var(--gold); border:1px solid rgba(255,200,44,0.4); }
  .b-outline:hover:not(:disabled) { border-color:var(--gold); background:rgba(255,200,44,0.08); }
  .b-red { background:rgba(248,113,113,0.15); color:var(--red); border:1px solid rgba(248,113,113,0.3); }
  .b-red:hover:not(:disabled) { background:rgba(248,113,113,0.28); }
  .b-green { background:rgba(74,222,128,0.12); color:var(--green); border:1px solid rgba(74,222,128,0.3); }
  .b-green:hover:not(:disabled) { background:rgba(74,222,128,0.22); }
  .b-purple { background:rgba(192,132,252,0.12); color:var(--purple); border:1px solid rgba(192,132,252,0.28); }
  .b-purple:hover:not(:disabled) { background:rgba(192,132,252,0.22); }
  .b-warn { background:rgba(251,146,60,0.12); color:var(--warn); border:1px solid rgba(251,146,60,0.3); }
  .b-warn:hover:not(:disabled) { background:rgba(251,146,60,0.22); }
  .b-ghost { background:rgba(255,255,255,0.06); color:var(--text); border:1px solid var(--border-lt); }
  .b-ghost:hover:not(:disabled) { border-color:var(--gold); color:var(--gold); }

  /* PILLS */
  .rg { display:flex; flex-wrap:wrap; gap:8px; }
  .rp { padding:7px 15px; border-radius:100px; border:1px solid rgba(255,200,44,0.22); background:transparent; color:rgba(255,200,44,0.55); cursor:pointer; font-size:0.82rem; font-family:'Raleway',sans-serif; font-weight:600; transition:all 0.15s; }
  .rp:hover { border-color:rgba(255,200,44,0.5); color:rgba(255,200,44,0.8); }
  .rp.sel { background:rgba(255,200,44,0.18); border-color:var(--gold); color:var(--gold); }

  /* TAGS */
  .badge { font-family:'DM Mono',monospace; font-size:0.68rem; padding:4px 10px; border-radius:100px; white-space:nowrap; }
  .badge-gold { background:rgba(255,200,44,0.15); color:var(--gold); border:1px solid rgba(255,200,44,0.25); }
  .badge-green { background:rgba(74,222,128,0.12); color:var(--green); border:1px solid rgba(74,222,128,0.25); }
  .badge-warn { background:rgba(251,146,60,0.12); color:var(--warn); border:1px solid rgba(251,146,60,0.25); }
  .badge-red { background:rgba(248,113,113,0.12); color:var(--red); border:1px solid rgba(248,113,113,0.25); }
  .badge-purple { background:rgba(192,132,252,0.12); color:var(--purple); border:1px solid rgba(192,132,252,0.25); }
  .chip { font-family:'DM Mono',monospace; font-size:0.73rem; padding:4px 11px; border-radius:100px; background:rgba(0,0,0,0.25); color:rgba(255,248,231,0.6); border:1px solid rgba(255,200,44,0.15); white-space:nowrap; }
  .meta { font-size:0.73rem; font-family:'DM Mono',monospace; padding:3px 10px; border-radius:100px; background:rgba(0,0,0,0.2); color:rgba(255,248,231,0.55); border:1px solid rgba(255,200,44,0.12); white-space:nowrap; }
  .cdl { font-family:'DM Mono',monospace; font-size:0.7rem; color:var(--warn); padding:4px 10px; border-radius:100px; background:rgba(251,146,60,0.1); border:1px solid rgba(251,146,60,0.25); white-space:nowrap; }
  .tier-ok { padding:11px 15px; border-radius:10px; font-size:0.78rem; margin-bottom:14px; font-family:'DM Mono',monospace; background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.25); color:var(--green); }
  .tier-lock { padding:11px 15px; border-radius:10px; font-size:0.78rem; margin-bottom:14px; font-family:'DM Mono',monospace; background:rgba(251,146,60,0.08); border:1px solid rgba(251,146,60,0.25); color:var(--warn); }

  /* STATUS CHIPS */
  .s-pending  { background:rgba(251,146,60,0.1);  border:1px solid rgba(251,146,60,0.3);  color:var(--warn); }
  .s-accepted { background:rgba(74,222,128,0.1);  border:1px solid rgba(74,222,128,0.3);  color:var(--green); }
  .s-denied   { background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.3); color:var(--red); }

  /* GRIDS */
  .g2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .g3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .g4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
  @media(max-width:760px) { .g2,.g3 { grid-template-columns:1fr; } .g4 { grid-template-columns:repeat(2,1fr); } }

  .sbox { background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:12px; padding:16px; text-align:center; }
  .snum { font-family:'Bebas Neue',sans-serif; font-size:2.2rem; color:var(--gold); line-height:1; }
  .slbl { font-size:0.68rem; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; font-family:'DM Mono',monospace; margin-top:4px; }

  /* CALENDAR */
  .cal-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .cal-day { padding:10px 8px; border-radius:12px; border:1px solid rgba(255,200,44,0.18); background:rgba(0,0,0,0.2); cursor:pointer; text-align:center; transition:all 0.15s; }
  .cal-day:hover { border-color:rgba(255,200,44,0.4); }
  .cal-day.sel { background:rgba(255,200,44,0.15); border-color:var(--gold); }
  .cal-day.sel .cal-dow { color:var(--gold); }
  .cal-day.sel .cal-date { color:var(--gold); }
  .cal-dow { font-family:'DM Mono',monospace; font-size:0.65rem; letter-spacing:2px; text-transform:uppercase; color:var(--muted); }
  .cal-date { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; letter-spacing:1px; color:var(--text); line-height:1.1; margin-top:2px; }
  .cal-month { font-family:'DM Mono',monospace; font-size:0.62rem; color:var(--muted); margin-top:1px; }

  /* TIME SLOT CARDS */
  .ts-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .ts-card { padding:10px 12px; border-radius:12px; border:1px solid rgba(255,200,44,0.18); background:rgba(0,0,0,0.2); cursor:pointer; transition:all 0.15s; }
  .ts-card:hover { border-color:rgba(255,200,44,0.38); }
  .ts-card.sel { background:rgba(255,200,44,0.12); border-color:var(--gold); }
  .ts-name { font-family:'Raleway',sans-serif; font-weight:700; font-size:0.82rem; color:var(--text); }
  .ts-card.sel .ts-name { color:var(--gold); }
  .ts-time { font-family:'DM Mono',monospace; font-size:0.68rem; color:var(--muted); margin-top:2px; }
  .ts-card.sel .ts-time { color:rgba(255,200,44,0.7); }

  /* DIR TOGGLE */
  .dir-toggle { display:flex; background:rgba(0,0,0,0.3); border:1px solid rgba(255,200,44,0.18); border-radius:100px; padding:4px; width:fit-content; margin-bottom:22px; }
  .dir-btn { font-family:'Raleway',sans-serif; font-size:0.82rem; font-weight:700; letter-spacing:0.5px; padding:8px 22px; border-radius:100px; border:none; background:transparent; cursor:pointer; transition:all 0.2s; color:rgba(255,200,44,0.5); }
  .dir-btn.on { background:var(--gold); color:var(--cardinal-dk); }

  /* CAR CARDS */
  .car-cards { display:flex; flex-direction:column; gap:12px; }
  .car-card { background:rgba(0,0,0,0.25); border:1px solid rgba(255,200,44,0.15); border-radius:16px; padding:20px 22px; backdrop-filter:blur(6px); position:relative; overflow:hidden; transition:border-color 0.2s; }
  .car-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--gold); opacity:0; transition:opacity 0.2s; }
  .car-card:hover { border-color:rgba(255,200,44,0.35); }
  .car-card:hover::before { opacity:1; }
  .car-card.my-car { border-color:rgba(74,222,128,0.4); }
  .car-card.my-car::before { background:var(--green); opacity:1; }
  .car-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
  .dname { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; letter-spacing:2px; color:var(--gold); }
  .cmeta { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
  .seats-bar { display:flex; gap:5px; align-items:center; flex-wrap:wrap; }
  .seat { width:26px; height:26px; border-radius:7px; border:1.5px solid rgba(255,200,44,0.2); display:flex; align-items:center; justify-content:center; font-size:0.65rem; color:var(--muted); }
  .seat.filled { background:rgba(255,200,44,0.15); border-color:rgba(255,200,44,0.5); color:var(--gold); }
  .seat.me { background:rgba(74,222,128,0.2); border-color:var(--green); color:var(--green); }
  .pax { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,200,44,0.1); align-items:center; }
  .pchip { font-size:0.76rem; padding:4px 12px; border-radius:100px; background:rgba(0,0,0,0.2); color:var(--muted); border:1px solid rgba(255,200,44,0.12); }
  .pchip.me { border-color:rgba(74,222,128,0.4); color:var(--green); }

  /* ROWS */
  .row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,200,44,0.08); }
  .row:last-child { border-bottom:none; }
  .av { width:34px; height:34px; border-radius:9px; background:rgba(255,200,44,0.12); border:1.5px solid rgba(255,200,44,0.25); display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:1rem; color:var(--gold); flex-shrink:0; }
  .ri { flex:1; min-width:0; }
  .rn { font-size:0.88rem; font-weight:600; color:var(--text); }
  .rd { font-size:0.72rem; color:var(--muted); font-family:'DM Mono',monospace; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ra { display:flex; gap:6px; margin-left:auto; flex-shrink:0; flex-wrap:wrap; }

  /* MY SPOTS */
  .spot { border-radius:16px; padding:22px; position:relative; overflow:hidden; }
  .spot::after { position:absolute; right:18px; bottom:12px; font-size:2.8rem; opacity:0.1; pointer-events:none; }
  .spot.up { background:linear-gradient(135deg,rgba(255,200,44,0.1),rgba(255,200,44,0.03)); border:1px solid rgba(255,200,44,0.3); }
  .spot.up::after { content:'⛷'; }
  .spot.down { background:linear-gradient(135deg,rgba(255,200,44,0.08),rgba(255,200,44,0.02)); border:1px solid rgba(255,200,44,0.2); }
  .spot.down::after { content:'🏠'; }
  .spot.empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:155px; opacity:0.65; }
  .sdir { font-family:'Bebas Neue',sans-serif; font-size:0.85rem; letter-spacing:2.5px; color:var(--gold); margin-bottom:4px; }
  .sdrv { font-family:'Bebas Neue',sans-serif; font-size:1.9rem; letter-spacing:2px; color:var(--gold); line-height:1.1; }
  .smeta { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }

  /* REQUESTS */
  .req-card { background:rgba(251,146,60,0.05); border:1px solid rgba(251,146,60,0.2); border-radius:14px; padding:18px; margin-bottom:12px; }
  .req-card.accepted { background:rgba(74,222,128,0.05); border-color:rgba(74,222,128,0.25); }
  .req-card.denied   { background:rgba(248,113,113,0.05); border-color:rgba(248,113,113,0.2); }
  .req-type { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:1.5px; margin-bottom:5px; }

  /* ADMIN */
  .adm-head { display:flex; align-items:center; gap:14px; margin-bottom:20px; flex-wrap:wrap; }
  .adm-head h2 { font-family:'Bebas Neue',sans-serif; font-size:2rem; letter-spacing:2px; color:var(--purple); }
  .adm-sub { display:flex; gap:6px; margin-bottom:22px; flex-wrap:wrap; }
  .asb { font-family:'Raleway',sans-serif; font-size:0.78rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:7px 16px; border-radius:100px; border:1px solid rgba(192,132,252,0.25); background:transparent; color:rgba(192,132,252,0.65); cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:5px; }
  .asb:hover { border-color:var(--purple); color:var(--purple); }
  .asb.on { background:var(--purple); color:#1a0030; border-color:transparent; }
  .ac { background:rgba(192,132,252,0.05); border:1px solid rgba(192,132,252,0.15); border-radius:16px; padding:22px; }
  .act { font-family:'Bebas Neue',sans-serif; font-size:1.2rem; letter-spacing:2px; color:var(--purple); margin-bottom:14px; }
  .prog { width:60px; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; }
  .progf { height:100%; border-radius:3px; }
  .trow { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(255,200,44,0.08); }
  .trow:last-child { border-bottom:none; }
  .tlbl { font-size:0.88rem; color:var(--text); font-weight:600; }
  .tsub { font-size:0.71rem; color:var(--muted); font-family:'DM Mono',monospace; margin-top:2px; }
  .tog { position:relative; width:44px; height:24px; background:rgba(255,255,255,0.1); border-radius:100px; cursor:pointer; border:none; transition:background 0.2s; flex-shrink:0; }
  .tog.on { background:var(--purple); }
  .tog::after { content:''; position:absolute; top:3px; left:3px; width:18px; height:18px; background:white; border-radius:50%; transition:transform 0.2s; }
  .tog.on::after { transform:translateX(20px); }
  .inline2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .locked-banner { background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.3); border-radius:12px; padding:14px 18px; font-family:'DM Mono',monospace; font-size:0.8rem; color:var(--red); margin-bottom:20px; display:flex; align-items:center; gap:10px; }
  .ann-box { background:rgba(192,132,252,0.07); border:1px solid rgba(192,132,252,0.15); border-radius:12px; padding:14px; margin-bottom:10px; display:flex; gap:10px; align-items:flex-start; }
  .login-box { max-width:360px; margin:60px auto; }
  .modal-ov { position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:center; justify-content:center; }
  .modal { background:#5a0000; border:1px solid rgba(192,132,252,0.3); border-radius:18px; padding:28px; max-width:500px; width:92%; }
  .modal h3 { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; letter-spacing:2px; color:var(--purple); margin-bottom:12px; }
  .toast { position:fixed; top:24px; right:24px; padding:12px 22px; border-radius:12px; font-weight:700; font-size:0.85rem; z-index:999; animation:sli 0.3s ease; }
  .t-ok { background:var(--green); color:#052e16; }
  .t-warn { background:var(--warn); color:#431407; }
  .t-purple { background:var(--purple); color:#1a0030; }
  .t-gold { background:var(--gold); color:var(--cardinal-dk); }
  @keyframes sli { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
  .empty { text-align:center; padding:40px 24px; color:var(--muted); font-size:0.88rem; }
  .mb12 { margin-bottom:12px; } .mb16 { margin-bottom:16px; } .mb20 { margin-bottom:20px; } .mb24 { margin-bottom:24px; }
  .mt8 { margin-top:8px; } .mt12 { margin-top:12px; } .mt16 { margin-top:16px; }
  .sec-title { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; letter-spacing:2px; color:var(--gold); margin:22px 0 14px; }
  .divider { height:1px; background:rgba(255,200,44,0.12); margin:20px 0; }
  .up-c { color:var(--gold); } .down-c { color:var(--down); } .green-c { color:var(--green); } .red-c { color:var(--red); } .warn-c { color:var(--warn); } .purple-c { color:var(--purple); }
`;

// ─────────────────────────────────────────────────────────
// CALENDAR PICKER
// ─────────────────────────────────────────────────────────
function CalPicker({ options, value, onChange }) {
  return (
    <div className="cal-grid">
      {options.map(opt => {
        const parts = opt.label.split(" "); // e.g. ["Fri","Apr","4"]
        return (
          <div key={opt.label} className={`cal-day ${value === opt.label ? "sel" : ""}`} onClick={() => onChange(opt.label)}>
            <div className="cal-dow">{parts[0]}</div>
            <div className="cal-date">{parts[2]}</div>
            <div className="cal-month">{parts[1]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TIME SLOT PICKER
// ─────────────────────────────────────────────────────────
function TimeSlotPicker({ value, customStart, onSlot, onCustomStart }) {
  return (
    <div>
      <div className="ts-grid mb12">
        {TIME_SLOTS.map(ts => (
          <div key={ts.id} className={`ts-card ${value === ts.id ? "sel" : ""}`} onClick={() => onSlot(ts.id)}>
            <div className="ts-name">{ts.label}</div>
            <div className="ts-time">{ts.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8, padding:"10px 14px", background:"rgba(0,0,0,0.2)", borderRadius:10, border:"1px solid rgba(255,200,44,0.15)" }}>
        <span style={{ fontFamily:"DM Mono,monospace", fontSize:"0.72rem", color:"var(--muted)", whiteSpace:"nowrap" }}>
          Available to leave starting at:
        </span>
        <input type="time" value={customStart} onChange={e => onCustomStart(e.target.value)}
          style={{ flex:1, minWidth:0, background:"transparent", border:"none", borderBottom:"1px solid rgba(255,200,44,0.3)", borderRadius:0, padding:"2px 4px", color:"var(--gold)", fontFamily:"DM Mono,monospace", fontSize:"0.88rem", outline:"none" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SEATS BAR
// ─────────────────────────────────────────────────────────
function SeatsBar({ car, myName }) {
  return (
    <div className="seats-bar">
      <div className="seat filled">🚗</div>
      {Array.from({ length: car.seats - 1 }).map((_, i) => {
        const p = car.passengers[i];
        const me = p === myName;
        return <div key={i} className={`seat ${me ? "me" : p ? "filled" : ""}`}>{me ? "★" : p ? p[0] : ""}</div>;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CAR CARD (public read-only)
// ─────────────────────────────────────────────────────────
function CarCard({ car, myName, isMine, signups }) {
  const [copied, setCopied] = useState(false);
  const open = car.seats - car.passengers.length - 1;
  const roster = [
    { name: car.driver, phone: car.phone, pickup: signups?.find(s => s.name === car.driver)?.pickup || car.pickup || null, timeStart: car.dir === "up" ? signups?.find(s => s.name === car.driver)?.upTimeStart : signups?.find(s => s.name === car.driver)?.downTimeStart, date: car.dir === "up" ? signups?.find(s => s.name === car.driver)?.upDate : signups?.find(s => s.name === car.driver)?.downDate, notes: signups?.find(s => s.name === car.driver)?.notes || null, isDriver: true, isMe: car.driver === myName },
    ...car.passengers.filter(p => p !== car.driver).map(p => {
      const su = signups?.find(s => s.name === p);
      return { name: p, phone: su?.phone || null, pickup: su?.pickup || null, timeStart: car.dir === "up" ? su?.upTimeStart : su?.downTimeStart, date: car.dir === "up" ? su?.upDate : su?.downDate, notes: su?.notes || null, isDriver: false, isMe: p === myName };
    }),
  ];

  const copyNumbers = () => {
    const text = roster
      .filter(p => p.phone)
      .map(p => `${p.name}${p.isDriver ? " (Driver)" : ""}: ${p.phone}${p.pickup ? ` — ${p.pickup}` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`car-card ${isMine ? "my-car" : ""}`}>
      <div className="car-top">
        <div>
          <div className="dname">{car.driver}</div>
          <div className="cmeta">
            <span className="meta">🗓 {car.date}</span>
            <span className="meta">🕐 {fmtWin(car.winStart, car.winEnd)}</span>
            <span className="meta">📍 {car.pickup}</span>
            {car.skiSunday && <span className="meta" style={{ color: "var(--gold)" }}>⛷ Sun</span>}
            {open > 0
              ? <span className="meta" style={{ color: "var(--green)" }}>{open} open</span>
              : <span className="meta" style={{ color: "var(--warn)" }}>Full</span>}
          </div>
        </div>
        {isMine && <span className="badge badge-green">You're here ★</span>}
      </div>
      <SeatsBar car={car} myName={myName} />
      {/* Roster with phone numbers */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,200,44,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,200,44,0.45)" }}>Roster</span>
          <button
            onClick={copyNumbers}
            style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", padding: "4px 12px", borderRadius: 100, border: `1px solid ${copied ? "rgba(74,222,128,0.4)" : "rgba(255,200,44,0.25)"}`, background: copied ? "rgba(74,222,128,0.1)" : "rgba(255,200,44,0.07)", color: copied ? "var(--green)" : "rgba(255,200,44,0.65)", cursor: "pointer", transition: "all 0.2s" }}
          >
            {copied ? "✓ Copied!" : "Copy All Numbers"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {roster.map(person => (
            <div key={person.name} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: person.isDriver ? "var(--gold)" : "rgba(255,200,44,0.35)", flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: person.isMe ? 700 : person.isDriver ? 600 : 500, color: person.isDriver ? "var(--gold)" : person.isMe ? "var(--green)" : "var(--text)", lineHeight: 1.4 }}>
                    {person.name}
                    {person.isDriver && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.62rem", marginLeft: 6, color: "rgba(255,200,44,0.6)", letterSpacing: "1px" }}>DRIVER</span>}
                    {person.isMe && <span style={{ marginLeft: 5, color: "var(--green)" }}>★</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 3 }}>
                    {person.pickup && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.67rem", color: "rgba(255,200,44,0.4)" }}>📍 {person.pickup}</span>}
                    {(person.date || person.timeStart) && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.67rem", color: "rgba(255,200,44,0.4)" }}>🕐 {[person.date, person.timeStart ? fmtWin(person.timeStart, null) : null].filter(Boolean).join(" · ")}</span>}
                  </div>
                  {person.notes && <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.66rem", color: "rgba(255,200,44,0.35)", marginTop: 2, fontStyle: "italic" }}>"{person.notes}"</div>}
                </div>
              </div>
              {person.phone && (
                <span
                  onClick={() => navigator.clipboard.writeText(person.phone)}
                  title="Tap to copy"
                  style={{ fontFamily: "DM Mono,monospace", fontSize: "0.75rem", color: "rgba(255,200,44,0.6)", cursor: "pointer", padding: "2px 8px", borderRadius: 6, transition: "background 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}
                  onMouseEnter={e => e.target.style.background = "rgba(255,200,44,0.1)"}
                  onMouseLeave={e => e.target.style.background = "transparent"}
                >
                  {person.phone}
                </span>
              )}
            </div>
          ))}
        </div>
        {car.gear.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {car.gear.map(g => <span key={g} className="pchip" style={{ color: "var(--gold)", borderColor: "rgba(255,200,44,0.25)" }}>🎿 {g}</span>)}
          </div>
        )}
        {(() => {
          const ds = signups?.find(s => s.name === car.driver);
          if (!ds) return null;
          const specs = [];
          if (ds.carType) specs.push(`🚗 ${ds.carType}`);
          if (ds.carSeats) specs.push(`💺 ${ds.carSeats} seats`);
          if (ds.seatDown === "Yes — can fold seats down") specs.push(`📦 Seat down`);
          if (ds.skiRackType && ds.skiRackType !== "No rack") specs.push(`🎿 ${ds.skiRackType}${ds.skiRackSpots ? ` (${ds.skiRackSpots} spots)` : ""}`);
          if (ds.carTraction) specs.push(ds.carTraction === "4WD / AWD" ? "🚙 4WD/AWD" : ds.carTraction === "Chains" ? "⛓ Chains" : ds.carTraction === "Both" ? "🚙 4WD + ⛓ Chains" : null);
          if (ds.gear && ds.gear !== "No") specs.push(`🎒 ${ds.gear}`);
          return (
            <div style={{ marginTop: 8 }}>
              {specs.filter(Boolean).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {specs.filter(Boolean).map(s => (
                    <span key={s} style={{ fontFamily: "DM Mono,monospace", fontSize: "0.72rem", padding: "3px 10px", borderRadius: 100, background: "rgba(255,200,44,0.08)", border: "1px solid rgba(255,200,44,0.2)", color: "rgba(255,200,44,0.75)" }}>{s}</span>
                  ))}
                </div>
              )}
              {ds.notes && <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.66rem", color: "rgba(255,200,44,0.35)", marginTop: 6, fontStyle: "italic" }}>"{ds.notes}"</div>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────────────────────
function AdminPanel({ cars, signups, requests, toast, loadAll }) {
  const [sub, setSub] = useState("overview");
  const [modal, setModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [anns, setAnns] = useState([{ id: "a0", text: "Carpools are live! Check your spot and submit any changes by Wed midnight. Fight On! ✌️", time: "Now" }]);
  const [newAnn, setNewAnn] = useState("");
  const [settings, setSettings] = useState({ signupOpen: true, requestsOpen: true, dashPublic: true, memberOpen: true, alumniOpen: false });
  const [newCar, setNewCar] = useState({ dir: "up", driver: "", phone: "", seats: 4, date: "", winStart: "08:00", winEnd: "11:00", pickup: "", skiSunday: true });

  const upCars = cars.filter(c => c.dir === "up");
  const downCars = cars.filter(c => c.dir === "down");
  const pending = requests.filter(r => r.status === "pending");
  const unUp = signups.filter(s => !s.upCarId);
  const unDown = signups.filter(s => !s.downCarId);

  const resolveRequest = async (req, accepted) => {
    if (accepted && req.type === "change") {
      const fromCar = cars.find(c => c.id === req.fromCarId);
      const toCar   = cars.find(c => c.id === req.toCarId);
      const dbKey   = req.dir === "up" ? "up_car_id" : "down_car_id";
      const ops = [supabase.from("requests").update({ status: "accepted" }).eq("id", req.id)];
      if (fromCar) ops.push(supabase.from("carpools").update({ passengers: fromCar.passengers.filter(n => n !== req.name) }).eq("id", fromCar.id));
      if (toCar)   ops.push(supabase.from("carpools").update({ passengers: [...toCar.passengers, req.name] }).eq("id", toCar.id));
      ops.push(supabase.from("signups").update({ [dbKey]: req.toCarId }).eq("id", req.signupId));
      await Promise.all(ops);
    } else if (accepted && req.type === "drop") {
      // Remove from all car passenger lists
      await Promise.all(cars.map(c =>
        supabase.from("carpools").update({ passengers: c.passengers.filter(n => n !== req.name) }).eq("id", c.id)
      ));
      // Delete their requests then their signup
      await supabase.from("requests").delete().eq("signup_id", req.signupId);
      await supabase.from("signups").delete().eq("id", req.signupId);
    } else {
      await supabase.from("requests").update({ status: accepted ? "accepted" : "denied" }).eq("id", req.id);
    }
    await loadAll();
    toast(accepted ? "Request accepted ✓" : "Request denied", "purple");
  };

  const assignToCar = async (signup, dir, carId) => {
    // Don't assign to down car if they have no up car yet
    if (dir === "down" && !signup.upCarId) { toast("Assign an up car first", "warn"); return; }
    const dbKey  = dir === "up" ? "up_car_id" : "down_car_id";
    const oldId  = dir === "up" ? signup.upCarId : signup.downCarId;
    const oldCar = cars.find(c => c.id === oldId);
    const newCarObj = cars.find(c => c.id === carId);
    const ops = [supabase.from("signups").update({ [dbKey]: carId }).eq("id", signup.id)];
    if (oldCar) ops.push(supabase.from("carpools").update({ passengers: oldCar.passengers.filter(n => n !== signup.name) }).eq("id", oldId));
    // Only add to passengers if they're not the driver of that car
    if (newCarObj && newCarObj.driver !== signup.name) ops.push(supabase.from("carpools").update({ passengers: [...newCarObj.passengers.filter(n => n !== signup.name), signup.name] }).eq("id", carId));
    await Promise.all(ops);
    await loadAll();
    setAssignModal(null);
    toast(`${signup.name} assigned!`, "purple");
  };

  const assignToCarFromCars = async (signup, dir, fromCarId, toCarId) => {
    const dbKey     = dir === "up" ? "up_car_id" : "down_car_id";
    const fromCar   = cars.find(c => c.id === fromCarId);
    const toCar     = cars.find(c => c.id === toCarId);
    const ops = [supabase.from("signups").update({ [dbKey]: toCarId }).eq("id", signup.id)];
    if (fromCar) ops.push(supabase.from("carpools").update({ passengers: fromCar.passengers.filter(n => n !== signup.name) }).eq("id", fromCarId));
    if (toCar && toCar.driver !== signup.name) ops.push(supabase.from("carpools").update({ passengers: [...toCar.passengers.filter(n => n !== signup.name), signup.name] }).eq("id", toCarId));
    await Promise.all(ops);
    await loadAll();
    toast(`${signup.name} moved!`, "purple");
  };

  const removeFromCarById = async (signup, dir, carId) => {
    const dbKey = dir === "up" ? "up_car_id" : "down_car_id";
    const car   = cars.find(c => c.id === carId);
    const ops   = [supabase.from("signups").update({ [dbKey]: null }).eq("id", signup.id)];
    if (car) ops.push(supabase.from("carpools").update({ passengers: car.passengers.filter(n => n !== signup.name) }).eq("id", carId));
    await Promise.all(ops);
    await loadAll();
    toast("Removed from car", "warn");
  };

  const deletePerson = (signup) => {
    setModal({ msg: `Remove ${signup.name} entirely?`, onOk: async () => {
      const ops = [
        supabase.from("requests").delete().eq("signup_id", signup.id),
      ];
      cars.forEach(c => {
        if (c.passengers.includes(signup.name))
          ops.push(supabase.from("carpools").update({ passengers: c.passengers.filter(n => n !== signup.name) }).eq("id", c.id));
      });
      await Promise.all(ops);
      await supabase.from("signups").delete().eq("id", signup.id);
      await loadAll();
      toast("Deleted", "warn"); setModal(null);
    }});
  };

  const deleteCar = (car) => {
    setModal({ msg: `Delete ${car.driver}'s ${car.dir} car? Passengers become unmatched.`, onOk: async () => {
      const dbKey = car.dir === "up" ? "up_car_id" : "down_car_id";
      const ops = [
        supabase.from("carpools").delete().eq("id", car.id),
        ...car.passengers.map(name => supabase.from("signups").update({ [dbKey]: null }).eq("name", name)),
      ];
      await Promise.all(ops);
      await loadAll();
      toast("Car deleted", "warn"); setModal(null);
    }});
  };

  const addCar = async () => {
    if (!newCar.driver.trim()) return;
    const id = (newCar.dir === "up" ? "u" : "d") + Date.now();
    const row = { id, dir: newCar.dir, driver: newCar.driver, phone: newCar.phone, seats: newCar.seats, date: newCar.date, win_start: newCar.winStart, win_end: newCar.winEnd, pickup: newCar.pickup, ski_sunday: newCar.skiSunday, gear: [], passengers: [] };
    const { error } = await supabase.from("carpools").insert(row);
    if (error) { toast("Failed to add car", "warn"); console.error(error); return; }
    await loadAll();
    setNewCar({ dir: "up", driver: "", phone: "", seats: 4, date: "", winStart: "08:00", winEnd: "11:00", pickup: "", skiSunday: true });
    toast("Car added!", "purple");
  };

  const exportCSV = () => {
    // ── Sheet 1: People + assignments ──
    const rows = [["Name","Phone","Standing","Venmo","Venmo Type","Pickup","Driving","Car Type","Seats Avail","Seat Down","Ski Rack Type","Ski Rack Spots","Traction","Up Date","Up Window","Down Date","Down Window","Ski Sun","Gear","Notes","Up Car Driver","Up Car Phone","Up Car Date","Up Car Window","Up Car Pickup","Down Car Driver","Down Car Phone","Down Car Date","Down Car Window","Down Car Pickup"]];
    signups.forEach(s => {
      const uc = cars.find(c => c.id === s.upCarId);
      const dc = cars.find(c => c.id === s.downCarId);
      rows.push([
        s.name, s.phone, s.standing, s.venmo, s.venmoType, s.pickup, s.driving,
        s.carType||"", s.carSeats||"", s.seatDown||"", s.skiRackType||"", s.skiRackSpots||"", s.carTraction||"",
        s.upDate, `${s.upTimeStart}–${s.upTimeEnd||"open"}`,
        s.downDate, `${s.downTimeStart}–${s.downTimeEnd||"open"}`,
        s.skiSunday, s.gear, s.notes||"",
        uc ? uc.driver : "UNMATCHED",
        uc ? uc.phone  : "",
        uc ? uc.date   : "",
        uc ? fmtWin(uc.winStart, uc.winEnd) : "",
        uc ? uc.pickup : "",
        dc ? dc.driver : "UNMATCHED",
        dc ? dc.phone  : "",
        dc ? dc.date   : "",
        dc ? fmtWin(dc.winStart, dc.winEnd) : "",
        dc ? dc.pickup : "",
      ]);
    });

    // ── Sheet 2: Car rosters ──
    rows.push([]); // blank separator
    rows.push(["── CAR ROSTERS ──"]);
    rows.push([]);
    cars.forEach(c => {
      rows.push([`${c.dir.toUpperCase()} · ${c.driver} · ${c.date} · ${fmtWin(c.winStart, c.winEnd)} · ${c.pickup}`]);
      rows.push(["Role","Name","Phone","Venmo"]);
      // Driver row
      const driverSignup = signups.find(s => s.name === c.driver);
      rows.push(["DRIVER", c.driver, c.phone, driverSignup ? `${driverSignup.venmoType}: ${driverSignup.venmo}` : ""]);
      // Passengers
      c.passengers.forEach(p => {
        const su = signups.find(s => s.name === p);
        rows.push(["passenger", p, su?.phone||"", su ? `${su.venmoType}: ${su.venmo}` : ""]);
      });
      // Empty seats
      const openSeats = c.seats - c.passengers.length - 1;
      for (let i = 0; i < openSeats; i++) rows.push(["open seat","—","",""]);
      rows.push([]); // blank line between cars
    });

    const csv = rows.map(r => r.map(v => `"${(v||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "usc_ski_carpoolz.csv" }).click();
    toast("Exported!", "purple");
  };

  const autoAssign = async () => {
    let newCarsArr = cars.map(c => ({ ...c, passengers: c.passengers.filter(p => p !== c.driver) }));
    let newSignups = signups.map(s => ({ ...s }));

    // First: assign drivers to their own cars automatically
    newCarsArr.forEach(c => {
      if (c.driver === "TBD" || !c.driver) return;
      const idx = newSignups.findIndex(s => s.name === c.driver);
      if (idx === -1) return;
      if (c.dir === "up"   && !newSignups[idx].upCarId)   newSignups[idx].upCarId   = c.id;
      if (c.dir === "down" && !newSignups[idx].downCarId) newSignups[idx].downCarId = c.id;
    });

    // Then: assign unassigned non-drivers
    const unassigned = newSignups.filter(s => !s.upCarId || !s.downCarId);
    unassigned.forEach(su => {
      ["up", "down"].forEach(dir => {
        const alreadyAssigned = dir === "up" ? su.upCarId : su.downCarId;
        if (alreadyAssigned) return;
        // Don't assign down car unless up car is already assigned
        if (dir === "down" && !su.upCarId) return;
        const candidates = newCarsArr
          .filter(c => c.dir === dir && c.driver !== su.name && c.seats - c.passengers.length - 1 > 0)
          .map(c => ({ car: c, score: scoreMatch(su, c) }))
          .filter(x => x.score >= 0)
          .sort((a, b) => b.score - a.score);
        if (candidates.length === 0) return;
        const best = candidates[0].car;
        best.passengers.push(su.name);
        const idx = newSignups.findIndex(s => s.id === su.id);
        if (dir === "up") newSignups[idx].upCarId = best.id;
        else newSignups[idx].downCarId = best.id;
        su = newSignups[idx];
      });
    });

    const ops = [
      ...newCarsArr.map(c => supabase.from("carpools").update({ passengers: c.passengers }).eq("id", c.id)),
      ...newSignups.map(s => supabase.from("signups").update({ up_car_id: s.upCarId || null, down_car_id: s.downCarId || null }).eq("id", s.id)),
    ];
    await Promise.all(ops);
    await loadAll();
    toast("Auto-assigned! Review and adjust as needed.", "purple");
  };

  const dirCars = (dir) => cars.filter(c => c.dir === dir);
  const SUBS = [{ id: "overview", l: "Overview" }, { id: "requests", l: "Requests", n: pending.length }, { id: "people", l: "People" }, { id: "cars", l: "Cars" }, { id: "announce", l: "Announce" }, { id: "settings", l: "Settings" }];

  return (<>
    {modal && (
      <div className="modal-ov" onClick={() => setModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>Confirm</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{modal.msg}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="btn b-red bs" onClick={e => { e.stopPropagation(); modal.onOk(); }}>Yes, do it</button>
            <button className="btn b-ghost bs" onClick={e => { e.stopPropagation(); setModal(null); }}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    {assignModal && (
      <div className="modal-ov" onClick={() => setAssignModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: "95%", maxHeight: "85vh", overflowY: "auto" }}>
          <h3>Assign {assignModal.signup.name}</h3>

          {/* Passenger full details */}
          <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,200,44,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.6)" }}>📞 {assignModal.signup.phone}</span>
              <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.6)" }}>📍 {assignModal.signup.pickup}</span>
              <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.6)" }}>💸 {assignModal.signup.venmoType}: {assignModal.signup.venmo}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              {assignModal.dir === "up" ? (<>
                <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>↑ {assignModal.signup.upDate}</span>
                <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>🕐 from {fmtWin(assignModal.signup.upTimeStart, null)}</span>
              </>) : (<>
                <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>↓ {assignModal.signup.downDate}</span>
                <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>🕐 from {fmtWin(assignModal.signup.downTimeStart, null)}</span>
              </>)}
              <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>⛷ Sun: {assignModal.signup.skiSunday}</span>
              {assignModal.signup.gear && assignModal.signup.gear !== "No" && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>🎿 {assignModal.signup.gear}</span>}
              {assignModal.signup.driving !== "No" && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(74,222,128,0.7)" }}>🚗 {assignModal.signup.driving}</span>}
            </div>
            {assignModal.signup.notes && <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", color: "rgba(255,200,44,0.4)", fontStyle: "italic" }}>"{assignModal.signup.notes}"</div>}
          </div>

          <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginBottom: 10, letterSpacing: "1px", textTransform: "uppercase" }}>{assignModal.dir === "up" ? "↑ Up" : "↓ Down"} cars</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dirCars(assignModal.dir).map(c => {
              const open = c.seats - c.passengers.length - 1;
              const isCurr = c.id === (assignModal.dir === "up" ? assignModal.signup.upCarId : assignModal.signup.downCarId);
              const score = scoreMatch(assignModal.signup, c);
              return (
                <div key={c.id} style={{ padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 12, border: `1px solid ${isCurr ? "rgba(74,222,128,0.4)" : score > 60 ? "rgba(255,200,44,0.3)" : "rgba(255,200,44,0.12)"}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isCurr ? "var(--green)" : "var(--gold)" }}>
                        {c.driver}
                        {score >= 60 && !isCurr && <span style={{ marginLeft: 8, fontFamily: "DM Mono,monospace", fontSize: "0.6rem", color: "var(--green)", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 100, padding: "1px 6px" }}>good match</span>}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                        <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", color: "rgba(255,200,44,0.5)" }}>🗓 {c.date}</span>
                        <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", color: "rgba(255,200,44,0.5)" }}>🕐 {fmtWin(c.winStart, c.winEnd)}</span>
                        <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", color: "rgba(255,200,44,0.5)" }}>📍 {c.pickup}</span>
                        <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", color: open > 0 ? "var(--green)" : "var(--red)" }}>{open > 0 ? `${open} open` : "Full"}</span>
                        {c.skiSunday && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", color: "rgba(255,200,44,0.5)" }}>⛷ Sun</span>}
                      </div>
                      {c.passengers.length > 0 && <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.65rem", color: "rgba(255,200,44,0.35)", marginTop: 4 }}>{c.passengers.join(", ")}</div>}
                    </div>
                    <button className={`btn bs ${isCurr ? "b-ghost" : "b-purple"}`} disabled={open <= 0 && !isCurr} onClick={() => assignToCar(assignModal.signup, assignModal.dir, c.id)}>
                      {isCurr ? "Current" : "Assign"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}><button className="btn b-ghost bs" onClick={() => setAssignModal(null)}>Cancel</button></div>
        </div>
      </div>
    )}

    <div className="adm-head">
      <h2>Admin Panel</h2>
      <span className="badge badge-purple">Officer Mode</span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button className="btn b-purple bs" onClick={autoAssign}>⚡ Auto-Assign</button>
        <button className="btn b-green bs" onClick={exportCSV}>⬇ Export CSV</button>
      </div>
    </div>

    <div className="adm-sub">
      {SUBS.map(t => (
        <button key={t.id} className={`asb ${sub === t.id ? "on" : ""}`} onClick={() => setSub(t.id)}>
          {t.l}{t.n > 0 && <span className="notif">{t.n}</span>}
        </button>
      ))}
    </div>

    {sub === "overview" && (<>
      <div className="g4">
        {[
          { n: signups.length, l: "Signups", c: "var(--gold)" },
          { n: upCars.reduce((a, c) => a + (c.seats - c.passengers.length - 1), 0), l: "↑ Up Open", c: "var(--gold)" },
          { n: downCars.reduce((a, c) => a + (c.seats - c.passengers.length - 1), 0), l: "↓ Down Open", c: "var(--down)" },
          { n: pending.length, l: "Pending Requests", c: "var(--warn)" },
        ].map(({ n, l, c }) => (
          <div key={l} className="sbox"><div className="snum" style={{ color: c }}>{n}</div><div className="slbl">{l}</div></div>
        ))}
      </div>
      <div className="g2">
        {[{ cars: upCars, label: "↑ Up Cars", c: "var(--gold)" }, { cars: downCars, label: "↓ Down Cars", c: "var(--down)" }].map(({ cars: dc, label, c }) => (
          <div key={label} className="ac">
            <div className="act" style={{ color: c }}>{label}</div>
            {dc.map(car => { const used = car.passengers.length + 1; const pct = Math.round(used / car.seats * 100); return (
              <div key={car.id} className="row">
                <div className="ri"><div className="rn">{car.driver}</div><div className="rd">{car.date} · {fmtWin(car.winStart, car.winEnd)}</div></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="prog"><div className="progf" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--green)" : c }} /></div>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "DM Mono,monospace" }}>{used}/{car.seats}</span>
                </div>
              </div>
            );})}
          </div>
        ))}
        {(unUp.length > 0 || unDown.length > 0) && (
          <div className="ac" style={{ gridColumn: "span 2", borderColor: "rgba(251,146,60,0.3)", background: "rgba(251,146,60,0.04)" }}>
            <div className="act" style={{ color: "var(--warn)" }}>⚠ Unmatched</div>
            {[...new Map([...unUp, ...unDown].map(s => [s.id, s])).values()].map(s => (
              <div key={s.id} className="row">
                <div className="av" style={{ background: "rgba(251,146,60,0.15)", borderColor: "rgba(251,146,60,0.3)", color: "var(--warn)" }}>{s.name[0]}</div>
                <div className="ri"><div className="rn">{s.name}</div><div className="rd">{!s.upCarId && <span className="up-c">↑ no up  </span>}{!s.downCarId && <span className="down-c">↓ no down</span>}</div></div>
                <div className="ra">
                  {!s.upCarId && <button className="btn bs b-purple" onClick={() => setAssignModal({ signup: s, dir: "up" })}>Assign ↑</button>}
                  {!s.downCarId && <button className="btn bs b-purple" onClick={() => setAssignModal({ signup: s, dir: "down" })}>Assign ↓</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>)}

    {sub === "requests" && (<>
      <div className="ac mb20">
        <div className="act">Pending ({pending.length})</div>
        {pending.length === 0 && <div className="empty">No pending requests 🎉</div>}
        {pending.map(req => {
          const fromCar = cars.find(c => c.id === req.fromCarId); const toCar = cars.find(c => c.id === req.toCarId);
          const su = signups.find(s => s.id === req.signupId);
          return (
            <div key={req.id} className="req-card mb16">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div className="req-type" style={{ color: req.type === "drop" ? "var(--warn)" : req.type === "note" ? "rgba(255,200,44,0.65)" : "var(--gold)" }}>
                    {req.type === "drop" ? "🚫 Drop" : req.type === "note" ? "💬 Comment" : "🔄 Change"} · {req.dir === "up" ? "↑ Up" : "↓ Down"}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", marginBottom: 4 }}>{req.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontFamily: "DM Mono,monospace" }}>
                    {req.type === "drop" ? `Drop from ${fromCar?.driver}'s car` : req.type === "note" ? `Currently in ${fromCar?.driver}'s car` : `${fromCar?.driver} → ${toCar?.driver} (${toCar?.date} · ${toCar && fmtWin(toCar.winStart, toCar.winEnd)})`}
                  </div>
                  {req.reason && <div style={{ fontSize: "0.82rem", color: "var(--text)", marginTop: 8, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid rgba(255,200,44,0.1)" }}>"{req.reason}"</div>}
                  {su && <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginTop: 6 }}>{su.phone} · {su.venmoType}: {su.venmo}</div>}
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>{req.submittedAt}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="btn bs b-green" onClick={() => resolveRequest(req, true)}>Accept ✓</button>
                  <button className="btn bs b-red" onClick={() => resolveRequest(req, false)}>Deny ✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="ac">
        <div className="act">All History</div>
        {requests.map(req => (
          <div key={req.id} className="row">
            <div className="ri"><div className="rn">{req.name} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.82rem" }}>· {req.type} {req.dir}</span></div><div className="rd">{req.submittedAt} · {req.reason || "No reason"}</div></div>
            <span className={`badge ${req.status === "pending" ? "badge-warn" : req.status === "accepted" ? "badge-green" : "badge-red"}`}>{req.status}</span>
          </div>
        ))}
        {requests.length === 0 && <div className="empty">No requests yet</div>}
      </div>
    </>)}

    {sub === "people" && (
      <div className="ac">
        <div className="act">All Signups ({signups.length})</div>
        {signups.map(s => {
          const uc = cars.find(c => c.id === s.upCarId);
          const dc = cars.find(c => c.id === s.downCarId);
          const unassignedUp   = !s.upCarId;
          const unassignedDown = !s.downCarId;
          const anyUnassigned  = unassignedUp || unassignedDown;
          return (
            <div key={s.id} className="row" style={{
              background: anyUnassigned ? "rgba(251,146,60,0.06)" : s.flagged ? "rgba(248,113,113,0.04)" : "transparent",
              borderRadius: anyUnassigned || s.flagged ? 10 : 0,
              paddingInline: anyUnassigned || s.flagged ? 8 : 0,
              borderLeft: anyUnassigned ? "3px solid rgba(251,146,60,0.5)" : s.flagged ? "3px solid rgba(248,113,113,0.4)" : "none",
            }}>
              <div className="av" style={
                anyUnassigned ? { background: "rgba(251,146,60,0.15)", borderColor: "rgba(251,146,60,0.4)", color: "var(--warn)" }
                : s.flagged   ? { background: "rgba(248,113,113,0.15)", borderColor: "rgba(248,113,113,0.3)", color: "var(--red)" }
                : {}
              }>{s.name[0]}</div>
              <div className="ri">
                <div className="rn">
                  {s.name}
                  {anyUnassigned && (
                    <span style={{ marginLeft: 8, fontFamily: "DM Mono,monospace", fontSize: "0.62rem", padding: "2px 8px", borderRadius: 100, background: "rgba(251,146,60,0.15)", color: "var(--warn)", border: "1px solid rgba(251,146,60,0.3)" }}>
                      ⚠ UNASSIGNED{unassignedUp && unassignedDown ? " BOTH" : unassignedUp ? " ↑" : " ↓"}
                    </span>
                  )}
                  {s.flagged && <span className="badge badge-red" style={{ marginLeft: 6 }}>🚩</span>}
                </div>
                <div className="rd">{s.phone} · {s.standing} · {s.venmoType}: {s.venmo} · {s.pickup}</div>
                <div className="rd mt8">
                  <span style={{ color: unassignedUp ? "var(--warn)" : "var(--gold)" }}>
                    ↑ {uc ? `${uc.driver} · ${uc.date}` : "⚠ no car assigned"}
                  </span>
                  {"   "}
                  <span style={{ color: unassignedDown ? "var(--warn)" : "var(--down)" }}>
                    ↓ {dc ? `${dc.driver} · ${dc.date}` : "⚠ no car assigned"}
                  </span>
                </div>
                {s.notes && <div className="rd" style={{ color: "var(--text)", opacity: 0.7, marginTop: 2 }}>"{s.notes}"</div>}
              </div>
              <div className="ra">
                <button className="btn bs b-purple" title="Assign ↑" onClick={() => setAssignModal({ signup: s, dir: "up" })}>↑</button>
                <button className="btn bs b-purple" title="Assign ↓" onClick={() => setAssignModal({ signup: s, dir: "down" })}>↓</button>
                <button className="btn bs b-ghost" onClick={async () => { await supabase.from("signups").update({ flagged: !s.flagged }).eq("id", s.id); loadAll(); }}>{s.flagged ? "Unflag" : "🚩"}</button>
                <button className="btn bs b-red" onClick={() => deletePerson(s)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {sub === "cars" && (<>
      {[{ dir: "up", label: "↑ Up Cars", c: "var(--gold)" }, { dir: "down", label: "↓ Down Cars", c: "var(--down)" }].map(({ dir, label, c }) => (
        <div key={dir} style={{ marginBottom: 28 }}>
          <div className="sec-title" style={{ color: c }}>{label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortCars(cars.filter(existingCar => existingCar.dir === dir)).map(existingCar => (
              <div key={existingCar.id} className="ac" style={{ borderColor: dir === "up" ? "rgba(255,200,44,0.2)" : "rgba(255,217,122,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "1.2rem", letterSpacing: "1.5px", color: "var(--gold)" }}>{existingCar.driver}</div>
                      {(() => { const ds = signups.find(s => s.name === existingCar.driver); if (!ds?.driving || ds.driving === "No") return null;
                        return <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.65rem", padding: "2px 8px", borderRadius: 100, background: ds.driving === "Yes" ? "rgba(74,222,128,0.12)" : "rgba(255,200,44,0.1)", border: ds.driving === "Yes" ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,200,44,0.25)", color: ds.driving === "Yes" ? "var(--green)" : "var(--gold)" }}>Driving: {ds.driving}</span>;
                      })()}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      <span className="meta">📞 {existingCar.phone}</span><span className="meta">🗓 {existingCar.date}</span><span className="meta">🕐 {fmtWin(existingCar.winStart, existingCar.winEnd)}</span><span className="meta">📍 {existingCar.pickup}</span><span className="meta">{existingCar.passengers.filter(p => p !== existingCar.driver).length + 1}/{existingCar.seats}</span>
                    </div>
                    {/* Driver full info */}
                    {(() => { const ds = signups.find(s => s.name === existingCar.driver); if (!ds) return null; return (
                      <div style={{ background: "rgba(255,200,44,0.05)", border: "1px solid rgba(255,200,44,0.12)", borderRadius: 10, padding: "8px 12px", marginTop: 10 }}>
                        <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.62rem", color: "rgba(255,200,44,0.4)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Driver Info</div>

                        {/* Contact & payment */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                          {ds.phone     && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.6)", background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: 6 }}>📞 {ds.phone}</span>}
                          {ds.pickup    && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.6)", background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: 6 }}>📍 {ds.pickup}</span>}
                          {ds.venmoType && ds.venmo && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.6)", background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: 6 }}>💸 {ds.venmoType}: {ds.venmo}</span>}
                        </div>

                        {/* Timing */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                          {dir === "up"   && ds.upTimeStart   && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>↑ {ds.upDate} · from {fmtWin(ds.upTimeStart, null)}</span>}
                          {dir === "down" && ds.downTimeStart && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>↓ {ds.downDate} · from {fmtWin(ds.downTimeStart, null)}</span>}
                          {ds.skiSunday  && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>⛷ Ski Sun: {ds.skiSunday}</span>}
                        </div>

                        {/* Car details */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                          {ds.carType    && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>🚗 {ds.carType}</span>}
                          {ds.carSeats   && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>💺 {ds.carSeats} passenger seats</span>}
                          {ds.seatDown === "Yes — can fold seats down" && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(74,222,128,0.7)" }}>📦 Seat down ✓</span>}
                          {ds.skiRackType && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: ds.skiRackType === "No rack" ? "rgba(255,200,44,0.35)" : "rgba(255,200,44,0.5)" }}>🎿 {ds.skiRackType}{ds.skiRackSpots ? ` · ${ds.skiRackSpots} spots` : ""}</span>}
                          {ds.carTraction && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)" }}>🚙 {ds.carTraction}</span>}
                        </div>

                        {/* Gear */}
                        {ds.gear && <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.5)", marginBottom: 4 }}>🎒 Gear: {ds.gear}</div>}

                        {/* Notes */}
                        {ds.notes && <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", color: "rgba(255,200,44,0.4)", fontStyle: "italic", borderTop: "1px solid rgba(255,200,44,0.08)", paddingTop: 6, marginTop: 4 }}>"{ds.notes}"</div>}
                      </div>
                    ); })()}
                    {existingCar.passengers.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                        {existingCar.passengers.map(p => { const su = signups.find(s => s.name === p); return (
                          <div key={p} style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,200,44,0.15)", borderRadius: 12, padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--gold)" }}>{p}</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                  {su?.phone    && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.55)" }}>📞 {su.phone}</span>}
                                  {su?.pickup   && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.55)" }}>📍 {su.pickup}</span>}
                                  {su?.venmoType && su?.venmo && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.55)" }}>💸 {su.venmoType}: {su.venmo}</span>}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                  {dir === "up"   && su?.upTimeStart   && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.45)" }}>🕐 {fmtWin(su.upTimeStart, null)} · {su.upDate}</span>}
                                  {dir === "down" && su?.downTimeStart && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.45)" }}>🕐 {fmtWin(su.downTimeStart, null)} · {su.downDate}</span>}
                                  {su?.skiSunday  && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.45)" }}>⛷ Sun: {su.skiSunday}</span>}
                                  {su?.gear && su.gear !== "No" && <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.7rem", color: "rgba(255,200,44,0.45)" }}>🎿 {su.gear}</span>}
                                </div>
                                {su?.notes && <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.68rem", color: "rgba(255,200,44,0.38)", marginTop: 4, fontStyle: "italic" }}>"{su.notes}"</div>}
                                {/* Move to another car */}
                                {su && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                    <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.65rem", color: "rgba(255,200,44,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>Move to:</span>
                                    <select
                                      defaultValue=""
                                      onChange={e => { if (e.target.value) { assignToCarFromCars(su, dir, existingCar.id, e.target.value); e.target.value = ""; } }}
                                      style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,200,44,0.2)", borderRadius: 8, padding: "3px 8px", color: "var(--gold)", fontFamily: "DM Mono,monospace", fontSize: "0.72rem", outline: "none", cursor: "pointer" }}
                                    >
                                      <option value="">— pick a car —</option>
                                      {cars.filter(c => c.dir === dir && c.id !== existingCar.id).map(c => (
                                        <option key={c.id} value={c.id}>{c.driver} · {c.date} · {fmtWin(c.winStart, c.winEnd)}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                                {su && <button style={{ background: "none", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 6, color: "var(--warn)", cursor: "pointer", fontSize: "0.72rem", padding: "3px 8px" }} onClick={() => removeFromCarById(su, dir, existingCar.id)}>Remove</button>}
                              </div>
                            </div>
                          </div>
                        );})}
                      </div>
                    )}
                    {/* Add Passenger dropdown */}
                    {(() => {
                      const unassigned = signups.filter(s => {
                        if (s.name === existingCar.driver) return false;
                        if (existingCar.passengers.includes(s.name)) return false;
                        if (dir === "up")   return !s.upCarId;
                        if (dir === "down") return s.upCarId && !s.downCarId; // only show if they have an up car
                        return false;
                      });
                      if (unassigned.length === 0) return null;
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                          <span style={{ fontFamily: "DM Mono,monospace", fontSize: "0.65rem", color: "rgba(74,222,128,0.6)", textTransform: "uppercase", letterSpacing: "1px", flexShrink: 0 }}>+ Add:</span>
                          <select
                            defaultValue=""
                            onChange={e => { if (e.target.value) { assignToCar(signups.find(s => s.id === e.target.value), dir, existingCar.id); e.target.value = ""; } }}
                            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 8, padding: "4px 10px", color: "var(--green)", fontFamily: "DM Mono,monospace", fontSize: "0.72rem", outline: "none", cursor: "pointer", flex: 1 }}
                          >
                            <option value="">— unassigned people —</option>
                            {unassigned.map(s => (
                              <option key={s.id} value={s.id}>{s.name} · {s.pickup} · {dir === "up" ? `from ${fmtWin(s.upTimeStart, null)} ${s.upDate}` : `from ${fmtWin(s.downTimeStart, null)} ${s.downDate}`}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </div>
                  <button className="btn bs b-red" onClick={() => deleteCar(existingCar)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="sec-title purple-c">Add a Car</div>
      <div className="ac">
        <div className="f mb16"><label>Direction</label><div className="rg">
          {["up", "down"].map(d => <button key={d} className={`rp ${newCar.dir === d ? "sel" : ""}`} onClick={() => setNewCar(p => ({ ...p, dir: d }))}>{d === "up" ? "↑ Up" : "↓ Down"}</button>)}
        </div></div>
        <div className="inline2">
          {[{ l: "Driver Name *", k: "driver", ph: "Full name" }, { l: "Phone", k: "phone", ph: "310-555-0000" }, { l: "Seats (incl driver)", k: "seats", ph: "4", t: "number" }, { l: "Date", k: "date", ph: "Fri Apr 4" }, { l: "Pickup Area", k: "pickup", ph: "Westwood" }].map(({ l, k, ph, t }) => (
            <div key={k} className="f"><label>{l}</label><input type={t || "text"} placeholder={ph} value={newCar[k]} onChange={e => setNewCar(p => ({ ...p, [k]: t === "number" ? +e.target.value : e.target.value }))} /></div>
          ))}
          <div className="f"><label>Window Start</label><input type="time" value={newCar.winStart} onChange={e => setNewCar(p => ({ ...p, winStart: e.target.value }))} /></div>
          <div className="f"><label>Window End</label><input type="time" value={newCar.winEnd} onChange={e => setNewCar(p => ({ ...p, winEnd: e.target.value }))} /></div>
        </div>
        <button className="btn b-purple bw" onClick={addCar}>+ Add Car</button>
      </div>
    </>)}

    {sub === "announce" && (<>
      <div className="ac mb20">
        <div className="act">Post Announcement</div>
        <div className="f"><label>Message</label><textarea value={newAnn} onChange={e => setNewAnn(e.target.value)} rows={3} placeholder="e.g. Cars sent! Check your spot. Fight On! ✌️" /></div>
        <button className="btn b-purple bw" onClick={() => { if (!newAnn.trim()) return; setAnns(p => [{ id: "a" + Date.now(), text: newAnn, time: "Now" }, ...p]); setNewAnn(""); toast("Posted!", "purple"); }}>Post</button>
      </div>
      <div className="ac">
        <div className="act">Posted</div>
        {anns.map(a => (
          <div key={a.id} className="ann-box">
            <div style={{ flex: 1 }}><div style={{ fontSize: "0.85rem", color: "var(--text)" }}>{a.text}</div><div style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginTop: 3 }}>{a.time}</div></div>
            <button style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }} onClick={() => setAnns(p => p.filter(x => x.id !== a.id))}>✕</button>
          </div>
        ))}
      </div>
    </>)}

    {sub === "settings" && (
      <div className="ac">
        <div className="act">Controls</div>
        {[
          { k: "signupOpen",   l: "Signup Form Open",          s: "Allow new submissions" },
          { k: "requestsOpen", l: "Change/Drop Requests Open",  s: "Closes Wed 11:59 PM" },
          { k: "dashPublic",   l: "Carpools Public",            s: "Anyone can view the Carpools tab" },
          { k: "memberOpen",   l: "Member Tier Unlocked",       s: "Officers & Members can sign up" },
          { k: "alumniOpen",   l: "Alumni & Guest Tier Open",   s: "Alumni and guests can sign up" },
        ].map(({ k, l, s }) => (
          <div key={k} className="trow">
            <div><div className="tlbl">{l}</div><div className="tsub">{s}</div></div>
            <button className={`tog ${settings[k] ? "on" : ""}`} onClick={() => { const n = !settings[k]; setSettings(p => ({ ...p, [k]: n })); toast(`${l} ${n ? "ON" : "OFF"}`, n ? "purple" : "warn"); }} />
          </div>
        ))}
      </div>
    )}
  </>);
}

// ─────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────
// ── DB helpers ────────────────────────────────────────────
const dbCarToApp  = r => ({ id: r.id, dir: r.dir, driver: r.driver, phone: r.phone, seats: r.seats, date: r.date, winStart: r.win_start, winEnd: r.win_end, pickup: r.pickup, skiSunday: r.ski_sunday, gear: r.gear || [], passengers: r.passengers || [] });
const dbSuToApp   = r => ({ id: r.id, name: r.name, phone: r.phone, standing: r.standing, venmo: r.venmo, venmoType: r.venmo_type, pickup: r.pickup, driving: r.driving, carType: r.car_type, carSeats: r.car_seats, seatDown: r.seat_down, skiRackType: r.ski_rack_type, skiRackSpots: r.ski_rack_spots, carTraction: r.car_traction, upDate: r.up_date, upTimeSlot: r.up_time_slot, upTimeStart: r.up_time_start, upTimeEnd: r.up_time_end, downDate: r.down_date, downTimeSlot: r.down_time_slot, downTimeStart: r.down_time_start, downTimeEnd: r.down_time_end, skiSunday: r.ski_sunday, gear: r.gear, notes: r.notes, upCarId: r.up_car_id, downCarId: r.down_car_id, flagged: r.flagged });
const dbReqToApp  = r => ({ id: r.id, signupId: r.signup_id, name: r.name, type: r.type, dir: r.dir, fromCarId: r.from_car_id, toCarId: r.to_car_id, reason: r.reason, status: r.status, submittedAt: r.submitted_at });

export default function App() {
  const [tab, setTab]           = useState("carpools");
  const [cars, setCars]         = useState([]);
  const [signups, setSignups]   = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [myId, setMyId]         = useState(null);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupErr, setLookupErr]     = useState("");
  const [dirFilter, setDirFilter] = useState("up");
  const [toast, setToast]       = useState(null);

  const [form, setForm] = useState({
    name: "", phone: "", standing: "Member", venmo: "", venmoType: "Venmo", pickup: "", driving: "No",
    carSeats: "", skiRackSpots: "", skiRackType: "", seatDown: "", carTraction: "", carType: "",
    upDate: WEEK.fri.label,
    upTimeSlot: "morning", upTimeStart: "08:00", upTimeEnd: "11:00",
    downDate: WEEK.sun.label,
    downTimeSlot: "morning", downTimeStart: "08:00", downTimeEnd: "11:00",
    skiSunday: "Yes", gear: "No", notes: "",
  });

  const [reqForm, setReqForm] = useState({ type: "change", dir: "up", toCarId: "", reason: "" });

  // ── DB helpers ───────────────────────────────────────────
  const loadAll = useCallback(async () => {
    const [{ data: carsData }, { data: susData }, { data: reqsData }] = await Promise.all([
      supabase.from("carpools").select("*").order("win_start"),
      supabase.from("signups").select("*").order("created_at"),
      supabase.from("requests").select("*").order("created_at", { ascending: false }),
    ]);
    if (carsData) setCars(carsData.map(dbCarToApp));
    if (susData)  setSignups(susData.map(dbSuToApp));
    if (reqsData) setRequests(reqsData.map(dbReqToApp));
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadAll);
    const channel = supabase.channel("carpoolz-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "carpools" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "signups" },  loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadAll]);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When slot changes, auto-set start/end
  const setSlot = (dir, slotId) => {
    const ts = TIME_SLOTS.find(t => t.id === slotId);
    if (dir === "up") {
      F("upTimeSlot", slotId);
      if (ts?.start) F("upTimeStart", ts.start);
    } else {
      F("downTimeSlot", slotId);
      if (ts?.start) F("downTimeStart", ts.start);
    }
  };

  const me = myId ? signups.find(s => s.id === myId) : null;

  const tierInfo = useMemo(() => {
    const t = TIERS.find(t => t.standing === form.standing);
    if (!t) return null;
    return { open: NOW >= t.opensAt, opensAt: t.opensAt };
  }, [form.standing]);

  const phoneValid = /^\d{10}$/.test(form.phone.replace(/\D/g, ""));
  const missingFields = [
    !form.name && "Name",
    !phoneValid && "Phone",
    !form.venmo && "Venmo/Zelle",
    !form.pickup && "Pickup Address",
    !form.gear && "Bringing Gear",
    !form.skiSunday && "Skiing Sunday",
    !form.upDate && "Up Date",
    !form.downDate && "Down Date",
  ].filter(Boolean);
  const canSignup = tierInfo?.open && missingFields.length === 0;
  const signupClosed  = NOW > SIGNUP_DEADLINE;
  const requestClosed = NOW > REQUEST_DEADLINE;

  const myUpCar   = me ? cars.find(c => c.id === me.upCarId)   : null;
  const myDownCar = me ? cars.find(c => c.id === me.downCarId) : null;
  const myRequests = me ? requests.filter(r => r.signupId === me.id) : [];
  const pendingCount = myRequests.filter(r => r.status === "pending").length;

  const pubUp   = sortCars(cars.filter(c => c.dir === "up"));
  const pubDown = sortCars(cars.filter(c => c.dir === "down"));

  const submitSignup = async () => {
    const id = "p" + Date.now();
    const row = {
      id, name: form.name, phone: form.phone, standing: form.standing,
      venmo: form.venmo, venmo_type: form.venmoType, pickup: form.pickup, driving: form.driving,
      car_type: form.carType, car_seats: form.carSeats || null, seat_down: form.seatDown || null,
      ski_rack_type: form.skiRackType || null, ski_rack_spots: form.skiRackSpots || null, car_traction: form.carTraction || null,
      up_date: form.upDate, up_time_slot: form.upTimeSlot, up_time_start: form.upTimeStart, up_time_end: form.upTimeEnd || null,
      down_date: form.downDate, down_time_slot: form.downTimeSlot, down_time_start: form.downTimeStart, down_time_end: form.downTimeEnd || null,
      ski_sunday: form.skiSunday, gear: form.gear, notes: form.notes || null,
      up_car_id: null, down_car_id: null, flagged: false,
    };
    const { error } = await supabase.from("signups").insert(row);
    if (error) { showToast("Save failed — check connection", "warn"); console.error(error); return; }
    await loadAll();
    setMyId(id);
    setTab("myspot");
    showToast("Signed up successfully! 🎿", "gold");
  };

  const submitRequest = async () => {
    if (requestClosed || !me) return;
    if (reqForm.type === "change" && !reqForm.toCarId) { showToast("Pick a car to move to", "warn"); return; }
    const id = "r" + Date.now();
    const row = {
      id, signup_id: me.id, name: me.name,
      type: reqForm.type,
      dir: reqForm.type === "drop" ? "both" : reqForm.dir,
      from_car_id: reqForm.type === "drop" ? null : (reqForm.dir === "up" ? me.upCarId : me.downCarId),
      to_car_id: reqForm.type === "change" ? reqForm.toCarId : null,
      reason: reqForm.reason || null, status: "pending",
      submitted_at: new Date().toLocaleString("en-US", { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }),
    };
    const { error } = await supabase.from("requests").insert(row);
    if (error) { showToast("Save failed — check connection", "warn"); console.error(error); return; }
    setReqForm({ type: "change", dir: "up", toCarId: "", reason: "" });
    showToast("Request submitted!");
    setTab("myspot");
    loadAll();
  };

  const TABS = [
    { id: "carpools", l: "Carpools" },
    { id: "signup",   l: "Sign Up" },
    { id: "myspot",   l: "My Spot", n: me ? pendingCount : 0 },
  ];

  const upDates   = [WEEK.thu, WEEK.fri, WEEK.sat];
  const downDates = [WEEK.sun];

  if (loading) return (
    <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{STYLES}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "3rem", letterSpacing: "5px", color: "var(--gold)" }}>CARPOOLZ</div>
        <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.8rem", color: "var(--muted)", marginTop: 12, letterSpacing: "2px" }}>Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="app">
      <style>{STYLES}</style>
      {toast && <div className={`toast t-${toast.type}`}>{toast.msg}</div>}

      {/* HEADER */}
      <div className="hdr-stripe" />
      <div className="hdr">
        <div className="hdr-logo">
          <img src="data:image/png;base64,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" alt="USC Ski Club" style={{height:"70px",width:"auto",display:"block"}} />
        </div>
        <div>
          <div className="hdr-title">CARPOOLZ</div>
          <div className="hdr-sub">Fight On · Shred Hard</div>
        </div>
        <div className="deadline-pill">
          <div className="dot" />
          Signup Tue 11:59 PM · Changes Wed 11:59 PM
        </div>
      </div>

      {/* NAV */}
      <div className="nav">
        {TABS.map(t => (
          <button key={t.id} className={`nb ${tab === t.id ? "on" : ""} ${t.admin ? "adm" : ""}`} onClick={() => setTab(t.id)}>
            {t.l}{t.n > 0 && <span className="notif">{t.n}</span>}
          </button>
        ))}
        {me && <div className="signed-in">Signed in as <span>{me.name}</span></div>}
      </div>

      <div className="main">

        {/* ── CARPOOLS ── */}
        {tab === "carpools" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "2rem", letterSpacing: "2px", color: "var(--gold)" }}>Carpools</h2>
            <span className="badge badge-gold">{pubUp.length + pubDown.length} total</span>
            <span className="badge badge-gold" style={{ opacity: 0.6 }}>Public</span>
          </div>
          <div className="dir-toggle mb20">
            <button className={`dir-btn ${dirFilter === "up" ? "on" : ""}`} onClick={() => setDirFilter("up")}>↑ Going Up ({pubUp.length})</button>
            <button className={`dir-btn ${dirFilter === "down" ? "on" : ""}`} onClick={() => setDirFilter("down")}>↓ Coming Down ({pubDown.length})</button>
          </div>
          <div className="car-cards">
            {(dirFilter === "up" ? pubUp : pubDown).map(c => (
              <CarCard key={c.id} car={c} myName={me?.name} isMine={dirFilter === "up" ? me?.upCarId === c.id : me?.downCarId === c.id} signups={signups} />
            ))}
          </div>
          {!me && (
            <div style={{ marginTop: 24, padding: "14px 18px", background: "rgba(255,200,44,0.06)", border: "1px solid rgba(255,200,44,0.18)", borderRadius: 12, fontSize: "0.85rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: 14 }}>
              Want a spot? <button className="btn bs bp" onClick={() => setTab("signup")}>Sign Up →</button>
            </div>
          )}
          {me && !myUpCar && !myDownCar && (
            <div style={{ marginTop: 24, padding: "14px 18px", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, fontSize: "0.85rem", color: "var(--green)", display: "flex", alignItems: "center", gap: 10, fontFamily: "DM Mono,monospace" }}>
              ✓ Signed up successfully!
            </div>
          )}
        </>)}

        {/* ── SIGN UP ── */}
        {tab === "signup" && (<>
          {/* SIGNUP FORM */}
          {signupClosed && <div className="locked-banner">🔒 Signup closed. Contact an officer if you need to join.</div>}
          {me && <div style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, padding: "13px 16px", marginBottom: 20, fontFamily: "DM Mono,monospace", fontSize: "0.8rem", color: "var(--green)" }}>✓ You're already signed up as {me.name}.</div>}

          <div className="g2">
            {/* LEFT */}
            <div className="card">
              <div className="ct">Your Info</div>
              {tierInfo && <div className={tierInfo.open ? "tier-ok" : "tier-lock"}>{tierInfo.open ? "✓ Signup open for your tier" : `🔒 Opens ${tierInfo.opensAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at 12 PM`}</div>}
              <div className="f"><label>Name *</label><input value={form.name} onChange={e => F("name", e.target.value)} placeholder="Your full name" /></div>
              <div className="f">
                <label>Phone *</label>
                <input value={form.phone} onChange={e => F("phone", e.target.value)} placeholder="1234567890" />
                {form.phone && !phoneValid && <div style={{ fontSize:"0.72rem", color:"var(--red)", fontFamily:"DM Mono,monospace", marginTop:4 }}>10 digits only, no dashes or spaces</div>}
              </div>
              <div className="f">
                <label>Venmo / Zelle *</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div className="rg" style={{ flexShrink: 0 }}>
                    {["Venmo", "Zelle"].map(v => <button key={v} className={`rp ${form.venmoType === v ? "sel" : ""}`} onClick={() => F("venmoType", v)}>{v}</button>)}
                  </div>
                  <input value={form.venmo} onChange={e => F("venmo", e.target.value)} placeholder="@handle or phone" style={{ flex: 1 }} />
                </div>
              </div>
              <div className="f"><label>LA Pickup Address *</label><input value={form.pickup} onChange={e => F("pickup", e.target.value)} placeholder="e.g. 635 McCarthy Way" /></div>
              <div className="f">
                <label>Team Standing *</label>
                <div className="rg">{["Officer", "Member", "Study Abroad/Graduating Early Member", "Alumni", "Guest"].map(s => <button key={s} className={`rp ${form.standing === s ? "sel" : ""}`} onClick={() => F("standing", s)}>{s}</button>)}</div>
              </div>
              <div className="f">
                <label>Driving?</label>
                <div className="rg">{["Yes", "No", "If needed"].map(v => <button key={v} className={`rp ${form.driving === v ? "sel" : ""}`} onClick={() => F("driving", v)}>{v}</button>)}</div>
              </div>
              {(form.driving === "Yes" || form.driving === "If needed") && (
                <div style={{ background:"rgba(255,200,44,0.05)", border:"1px solid rgba(255,200,44,0.18)", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
                  <div style={{ fontFamily:"DM Mono,monospace", fontSize:"0.68rem", letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,200,44,0.65)", marginBottom:12 }}>Car Details</div>

                  <div className="f">
                    <label>Car Type</label>
                    <div className="rg">
                      {["Sedan","SUV","Truck","Minivan","Crossover","Other"].map(v => (
                        <button key={v} className={`rp ${form.carType === v ? "sel" : ""}`} onClick={() => F("carType", v)}>{v}</button>
                      ))}
                    </div>
                  </div>

                  <div className="f">
                    <label>Seats available (excl. you)</label>
                    <input type="number" min={1} max={7} value={form.carSeats} onChange={e => F("carSeats", e.target.value)} placeholder="e.g. 3" />
                  </div>

                  <div className="f">
                    <label>Seat Down</label>
                    <div className="rg">
                      {["Yes — can fold seats down", "No"].map(v => (
                        <button key={v} className={`rp ${form.seatDown === v ? "sel" : ""}`} onClick={() => F("seatDown", v)}>{v}</button>
                      ))}
                    </div>
                  </div>

                  <div className="f">
                    <label>Ski / Snowboard Rack</label>
                    <div className="rg">
                      {["Roof rack", "Hitch rack", "Both", "No rack"].map(v => (
                        <button key={v} className={`rp ${form.skiRackType === v ? "sel" : ""}`} onClick={() => F("skiRackType", v)}>{v}</button>
                      ))}
                    </div>
                  </div>

                  {(form.skiRackType === "Roof rack" || form.skiRackType === "Hitch rack" || form.skiRackType === "Both") && (
                    <div className="f">
                      <label>Rack spots</label>
                      <input type="number" min={1} max={10} value={form.skiRackSpots} onChange={e => F("skiRackSpots", e.target.value)} placeholder="e.g. 4" />
                    </div>
                  )}

                  <div className="f" style={{marginBottom:0}}>
                    <label>4WD / Chains</label>
                    <div className="rg">
                      {["4WD / AWD", "Chains", "Both", "Neither"].map(v => (
                        <button key={v} className={`rp ${form.carTraction === v ? "sel" : ""}`} onClick={() => F("carTraction", v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="f">
                <label>Bringing Gear?</label>
                <div className="rg">{["Yes", "No", "No, but bringing down", "Other"].map(v => <button key={v} className={`rp ${form.gear === v ? "sel" : ""}`} onClick={() => F("gear", v)}>{v}</button>)}</div>
              </div>
              <div className="f">
                <label>Skiing Sunday?</label>
                <div className="rg">{["Yes", "No", "Don't Care"].map(v => <button key={v} className={`rp ${form.skiSunday === v ? "sel" : ""}`} onClick={() => F("skiSunday", v)}>{v}</button>)}</div>
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="card up-tint mb20">
                <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "1.15rem", letterSpacing: "2.5px", color: "var(--gold)", marginBottom: 14 }}>↑ Going Up · LA → Mountain</div>
                <div className="f">
                  <label>Date</label>
                  <CalPicker options={upDates} value={form.upDate} onChange={v => F("upDate", v)} />
                </div>
                <div className="f">
                  <label>Available to leave</label>
                  <TimeSlotPicker
                    value={form.upTimeSlot}
                    customStart={form.upTimeStart}
                    onSlot={id => setSlot("up", id)}
                    onCustomStart={v => F("upTimeStart", v)}
                  />
                </div>
              </div>

              <div className="card down-tint mb20">
                <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "1.15rem", letterSpacing: "2.5px", color: "var(--down)", marginBottom: 14 }}>↓ Coming Down · Mountain → LA</div>
                <div className="f">
                  <label>Date</label>
                  <CalPicker options={downDates} value={form.downDate} onChange={v => F("downDate", v)} />
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginTop: 8 }}>Down trips depart Sundays only</div>
                </div>
                <div className="f">
                  <label>Available to leave</label>
                  <TimeSlotPicker
                    value={form.downTimeSlot}
                    customStart={form.downTimeStart}
                    onSlot={id => setSlot("down", id)}
                    onCustomStart={v => F("downTimeStart", v)}
                  />
                </div>
              </div>

              <div className="card">
                <div className="f"><textarea value={form.notes} onChange={e => F("notes", e.target.value)} placeholder="Anything else?" /></div>
                <button className="btn bp bw" disabled={!canSignup || signupClosed || !!me} onClick={submitSignup}>
                  {signupClosed ? "Signup Closed" : me ? "Already Signed Up" : missingFields.length > 0 ? `Missing: ${missingFields.join(", ")}` : "Submit →"}
                </button>
              </div>
            </div>
          </div>
        </>)}

        {/* ── MY SPOT ── */}
        {tab === "myspot" && (<>
          {!me ? (
            <div style={{ maxWidth: 420, margin: "48px auto" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>⛷</div>
                <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "1.8rem", letterSpacing: "3px", color: "var(--gold)" }}>Find My Spot</div>
                <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.75rem", color: "var(--muted)", marginTop: 6 }}>Enter the phone number you signed up with</div>
              </div>
              <div className="card">
                <div className="f">
                  <input
                    type="tel"
                    value={lookupPhone}
                    onChange={e => { setLookupPhone(e.target.value); setLookupErr(""); }}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const digits = lookupPhone.replace(/\D/g, "");
                        const found = signups.find(s => s.phone.replace(/\D/g, "") === digits);
                        if (found) { setMyId(found.id); setLookupErr(""); }
                        else setLookupErr("No signup found for that number.");
                      }
                    }}
                    placeholder="1234567890"
                    style={lookupErr ? { borderColor: "var(--red)" } : {}}
                  />
                  {lookupErr && <div style={{ color: "var(--red)", fontSize: "0.75rem", fontFamily: "DM Mono,monospace", marginTop: 6 }}>{lookupErr}</div>}
                </div>
                <button className="btn bp bw" onClick={() => {
                  const digits = lookupPhone.replace(/\D/g, "");
                  const found = signups.find(s => s.phone.replace(/\D/g, "") === digits);
                  if (found) { setMyId(found.id); setLookupErr(""); }
                  else setLookupErr("No signup found for that number.");
                }}>Find My Spot →</button>
                <div style={{ textAlign: "center", marginTop: 14, fontSize: "0.78rem", color: "var(--muted)" }}>
                  Not signed up yet? <button className="btn bs b-ghost" style={{ marginLeft: 6 }} onClick={() => setTab("signup")}>Sign Up →</button>
                </div>
              </div>
            </div>
          ) : (<>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "1.8rem", letterSpacing: "2px", color: "var(--gold)" }}>Your Cars</div>
              <button className="btn bs b-ghost" onClick={() => { setMyId(null); setLookupPhone(""); setLookupErr(""); }}>← Not you?</button>
            </div>
            <div className="g2 mb20">
              {myUpCar ? (
                <div className="spot up">
                  <div className="sdir">↑ GOING UP</div>
                  <div className="sdrv">{myUpCar.driver}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 3 }}>📞 {myUpCar.phone}</div>
                  <div className="smeta">
                    <span className="chip">🗓 {myUpCar.date}</span>
                    <span className="chip">🕐 {fmtWin(myUpCar.winStart, myUpCar.winEnd)}</span>
                    <span className="chip">📍 {myUpCar.pickup}</span>
                    <span className="cdl">Changes by Wed midnight</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                    {myUpCar.passengers.map(p => <span key={p} className={`pchip ${p === me.name ? "me" : ""}`}>{p}{p === me.name ? " ★" : ""}</span>)}
                  </div>
                </div>
              ) : (
                <div className="spot up empty">
                  <div className="sdir">↑ GOING UP</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "8px 0" }}>Not assigned yet</div>
                </div>
              )}
              {myDownCar ? (
                <div className="spot down">
                  <div className="sdir" style={{ color: "var(--down)" }}>↓ COMING DOWN</div>
                  <div className="sdrv" style={{ color: "var(--down)" }}>{myDownCar.driver}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 3 }}>📞 {myDownCar.phone}</div>
                  <div className="smeta">
                    <span className="chip">🗓 {myDownCar.date}</span>
                    <span className="chip">🕐 {fmtWin(myDownCar.winStart, myDownCar.winEnd)}</span>
                    <span className="chip">📍 {myDownCar.pickup}</span>
                    <span className="cdl">Changes by Wed midnight</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                    {myDownCar.passengers.map(p => <span key={p} className={`pchip ${p === me.name ? "me" : ""}`}>{p}{p === me.name ? " ★" : ""}</span>)}
                  </div>
                </div>
              ) : (
                <div className="spot down empty">
                  <div className="sdir" style={{ color: "var(--down)" }}>↓ COMING DOWN</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "8px 0" }}>Not assigned yet</div>
                </div>
              )}
            </div>

            {myUpCar && myDownCar && (
              <div style={{ marginBottom: 20, padding: "11px 15px", background: myUpCar.driver === myDownCar.driver ? "rgba(74,222,128,0.07)" : "rgba(0,0,0,0.2)", border: `1px solid ${myUpCar.driver === myDownCar.driver ? "rgba(74,222,128,0.2)" : "rgba(255,200,44,0.1)"}`, borderRadius: 12, fontSize: "0.8rem", color: myUpCar.driver === myDownCar.driver ? "var(--green)" : "var(--muted)", fontFamily: "DM Mono,monospace" }}>
                {myUpCar.driver === myDownCar.driver ? `🎉 Same driver both ways — ${myUpCar.driver}!` : `🔀 ${myUpCar.driver} up · ${myDownCar.driver} down`}
              </div>
            )}

            <div className="divider" />
            <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "1.5rem", letterSpacing: "2px", color: "var(--gold)", marginBottom: 4 }}>Requests</div>
            <div style={{ fontSize: "0.76rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginBottom: 16 }}>Changes and drops must be submitted by Wednesday 11:59 PM</div>

            {requestClosed ? (
              <div className="locked-banner">🔒 Request window closed. Contact an officer directly.</div>
            ) : (
              <div className="card mb20">
                <div className="ct">Submit a Request</div>
                <div className="f"><label>Type</label><div className="rg">
                  <button className={`rp ${reqForm.type === "change" ? "sel" : ""}`} onClick={() => setReqForm(p => ({ ...p, type: "change" }))}>🔄 Change Car</button>
                  <button className={`rp ${reqForm.type === "drop" ? "sel" : ""}`} onClick={() => setReqForm(p => ({ ...p, type: "drop" }))}>🚫 Drop from Carpools</button>
                </div></div>
                {reqForm.type === "drop" && (
                  <div style={{ padding: "10px 14px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, fontSize: "0.8rem", color: "var(--red)", fontFamily: "DM Mono,monospace", marginBottom: 14 }}>
                    This will remove you from all carpools entirely.
                  </div>
                )}
                {reqForm.type === "change" && (
                  <>
                    <div className="f"><label>Direction</label><div className="rg">
                      <button className={`rp ${reqForm.dir === "up" ? "sel" : ""}`} onClick={() => setReqForm(p => ({ ...p, dir: "up", toCarId: "" }))}>↑ Up</button>
                      <button className={`rp ${reqForm.dir === "down" ? "sel" : ""}`} onClick={() => setReqForm(p => ({ ...p, dir: "down", toCarId: "" }))}>↓ Down</button>
                    </div></div>
                    <div className="f"><label>Move to which car?</label>
                      <select value={reqForm.toCarId} onChange={e => setReqForm(p => ({ ...p, toCarId: e.target.value }))}>
                        <option value="">— select a car —</option>
                        {cars.filter(c => c.dir === reqForm.dir && c.id !== (reqForm.dir === "up" ? me.upCarId : me.downCarId)).map(c => {
                          const open = c.seats - c.passengers.length - 1;
                          return <option key={c.id} value={c.id} disabled={open <= 0}>{c.driver} · {c.date} · {fmtWin(c.winStart, c.winEnd)}{open <= 0 ? " (Full)" : ""}</option>;
                        })}
                      </select>
                    </div>
                  </>
                )}
                <div className="f"><label>Reason</label><textarea value={reqForm.reason} onChange={e => setReqForm(p => ({ ...p, reason: e.target.value }))} placeholder="Help us understand your situation..." /></div>
                <button className="btn bp bw" onClick={submitRequest}>Submit Request</button>
              </div>
            )}

            {myRequests.length > 0 && (
              <div className="card">
                <div className="ct">Your Requests</div>
                {myRequests.map(req => {
                  const fromCar = cars.find(c => c.id === req.fromCarId); const toCar = cars.find(c => c.id === req.toCarId);
                  return (
                    <div key={req.id} className={`req-card ${req.status}`}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div className="req-type" style={{ color: req.type === "drop" ? "var(--warn)" : "var(--gold)" }}>{req.type === "drop" ? "🚫 Drop" : "🔄 Change"} · {req.dir === "up" ? "↑ Up" : "↓ Down"}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginTop: 4 }}>{req.type === "drop" ? `Drop from ${fromCar?.driver}'s car` : `Move to ${toCar?.driver}'s car`}</div>
                          {req.reason && <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 5 }}>"{req.reason}"</div>}
                          <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginTop: 5 }}>{req.submittedAt}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className={`badge ${req.status === "pending" ? "badge-warn" : req.status === "accepted" ? "badge-green" : "badge-red"}`} style={{ padding: "5px 12px", fontSize: "0.75rem" }}>
                            {req.status === "pending" ? "⏳ Pending" : req.status === "accepted" ? "✓ Accepted" : "✕ Denied"}
                          </span>
                          {req.status === "accepted" && <div style={{ fontSize: "0.7rem", color: "var(--green)", fontFamily: "DM Mono,monospace", marginTop: 6 }}>Your car has been updated</div>}
                          {req.status === "denied" && <div style={{ fontSize: "0.7rem", color: "var(--red)", fontFamily: "DM Mono,monospace", marginTop: 6 }}>Contact an officer for details</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>)}
        </>)}

      </div>
    </div>
  );
}
