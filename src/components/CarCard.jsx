import { useState } from "react";
import { fmtWin } from "../lib/time.js";
import SeatsBar from "./SeatsBar.jsx";

export default function CarCard({ car, myName, isMine, signups }) {
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
