import { fmtWin } from "../../lib/time.js";

export default function MySpotTab({ cars, lookupErr, lookupPhone, me, myDownCar, myRequests, myUpCar, reqForm, requestClosed, setLookupErr, setLookupPhone, setMyId, setReqForm, setTab, signups, submitRequest }) {
  return (
    <>
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
    </>
  );
}
