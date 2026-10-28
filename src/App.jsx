import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import { STYLES } from "./styles.js";
import { WEEK, TIERS, SIGNUP_DEADLINE, REQUEST_DEADLINE, NOW, TIME_SLOTS } from "./lib/constants.js";
import { sortCars } from "./lib/time.js";
import { dbCarToApp, dbSuToApp, dbReqToApp } from "./lib/db.js";
import AdminPanel from "./components/AdminPanel.jsx";
import CarpoolsTab from "./components/tabs/CarpoolsTab.jsx";
import SignupTab from "./components/tabs/SignupTab.jsx";
import MySpotTab from "./components/tabs/MySpotTab.jsx";
import logo from "./assets/usc-ski-logo.jpg";

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
          <img src={logo} alt="USC Ski Club" style={{height:"70px",width:"auto",display:"block"}} />
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
        {tab === "carpools" && <CarpoolsTab dirFilter={dirFilter} me={me} myDownCar={myDownCar} myUpCar={myUpCar} pubDown={pubDown} pubUp={pubUp} setDirFilter={setDirFilter} setTab={setTab} signups={signups} />}

        {/* ── SIGN UP ── */}
        {tab === "signup" && <SignupTab F={F} canSignup={canSignup} downDates={downDates} form={form} me={me} missingFields={missingFields} phoneValid={phoneValid} setSlot={setSlot} signupClosed={signupClosed} submitSignup={submitSignup} tierInfo={tierInfo} upDates={upDates} />}

        {/* ── MY SPOT ── */}
        {tab === "myspot" && <MySpotTab cars={cars} lookupErr={lookupErr} lookupPhone={lookupPhone} me={me} myDownCar={myDownCar} myRequests={myRequests} myUpCar={myUpCar} reqForm={reqForm} requestClosed={requestClosed} setLookupErr={setLookupErr} setLookupPhone={setLookupPhone} setMyId={setMyId} setReqForm={setReqForm} setTab={setTab} signups={signups} submitRequest={submitRequest} />}

      </div>
    </div>
  );
}

