import CarCard from "../CarCard.jsx";

export default function CarpoolsTab({ dirFilter, me, myDownCar, myUpCar, pubDown, pubUp, setDirFilter, setTab, signups }) {
  return (
    <>
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
    </>
  );
}
