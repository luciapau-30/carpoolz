import { fmtWin } from "../../lib/time.js";

export default function AdminRequests({ cars, pending, requests, resolveRequest, signups }) {
  return (
    <>
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
    </>
  );
}
