import { supabase } from "../../supabase.js";

export default function AdminPeople({ cars, deletePerson, loadAll, setAssignModal, signups }) {
  return (
    <>
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
    </>
  );
}
