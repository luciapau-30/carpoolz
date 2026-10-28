// Global styles (USC: cardinal #990000, gold #FFC72C, navy #003087)
export const STYLES = `
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
