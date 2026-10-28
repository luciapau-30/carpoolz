import { fmtWin } from "../../lib/time.js";

export default function AdminOverview({ downCars, pending, setAssignModal, signups, unDown, unUp, upCars }) {
  return (
    <>
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
    </>
  );
}
