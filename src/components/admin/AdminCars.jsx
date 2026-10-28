import { fmtWin, sortCars } from "../../lib/time.js";

export default function AdminCars({ addCar, assignToCar, assignToCarFromCars, cars, deleteCar, newCar, removeFromCarById, setNewCar, signups }) {
  return (
    <>
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
    </>
  );
}
