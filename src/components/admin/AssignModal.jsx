import { fmtWin } from "../../lib/time.js";
import { scoreMatch } from "../../lib/matching.js";

// Pick a car for one person; cars are labeled "good match" using scoreMatch.
export default function AssignModal({ assignModal, assignToCar, dirCars, setAssignModal }) {
  return (
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
  );
}
