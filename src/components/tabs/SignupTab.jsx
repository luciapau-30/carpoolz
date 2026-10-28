import CalPicker from "../CalPicker.jsx";
import TimeSlotPicker from "../TimeSlotPicker.jsx";

export default function SignupTab({ F, canSignup, downDates, form, me, missingFields, phoneValid, setSlot, signupClosed, submitSignup, tierInfo, upDates }) {
  return (
    <>
      {/* SIGNUP FORM */}
      {signupClosed && <div className="locked-banner">🔒 Signup closed. Contact an officer if you need to join.</div>}
      {me && <div style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, padding: "13px 16px", marginBottom: 20, fontFamily: "DM Mono,monospace", fontSize: "0.8rem", color: "var(--green)" }}>✓ You're already signed up as {me.name}.</div>}

      <div className="g2">
        {/* LEFT */}
        <div className="card">
          <div className="ct">Your Info</div>
          {tierInfo && <div className={tierInfo.open ? "tier-ok" : "tier-lock"}>{tierInfo.open ? "✓ Signup open for your tier" : `🔒 Opens ${tierInfo.opensAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at 12 PM`}</div>}
          <div className="f"><label>Name *</label><input value={form.name} onChange={e => F("name", e.target.value)} placeholder="Your full name" /></div>
          <div className="f">
            <label>Phone *</label>
            <input value={form.phone} onChange={e => F("phone", e.target.value)} placeholder="1234567890" />
            {form.phone && !phoneValid && <div style={{ fontSize:"0.72rem", color:"var(--red)", fontFamily:"DM Mono,monospace", marginTop:4 }}>10 digits only, no dashes or spaces</div>}
          </div>
          <div className="f">
            <label>Venmo / Zelle *</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="rg" style={{ flexShrink: 0 }}>
                {["Venmo", "Zelle"].map(v => <button key={v} className={`rp ${form.venmoType === v ? "sel" : ""}`} onClick={() => F("venmoType", v)}>{v}</button>)}
              </div>
              <input value={form.venmo} onChange={e => F("venmo", e.target.value)} placeholder="@handle or phone" style={{ flex: 1 }} />
            </div>
          </div>
          <div className="f"><label>LA Pickup Address *</label><input value={form.pickup} onChange={e => F("pickup", e.target.value)} placeholder="e.g. 635 McCarthy Way" /></div>
          <div className="f">
            <label>Team Standing *</label>
            <div className="rg">{["Officer", "Member", "Study Abroad/Graduating Early Member", "Alumni", "Guest"].map(s => <button key={s} className={`rp ${form.standing === s ? "sel" : ""}`} onClick={() => F("standing", s)}>{s}</button>)}</div>
          </div>
          <div className="f">
            <label>Driving?</label>
            <div className="rg">{["Yes", "No", "If needed"].map(v => <button key={v} className={`rp ${form.driving === v ? "sel" : ""}`} onClick={() => F("driving", v)}>{v}</button>)}</div>
          </div>
          {(form.driving === "Yes" || form.driving === "If needed") && (
            <div style={{ background:"rgba(255,200,44,0.05)", border:"1px solid rgba(255,200,44,0.18)", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontFamily:"DM Mono,monospace", fontSize:"0.68rem", letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,200,44,0.65)", marginBottom:12 }}>Car Details</div>

              <div className="f">
                <label>Car Type</label>
                <div className="rg">
                  {["Sedan","SUV","Truck","Minivan","Crossover","Other"].map(v => (
                    <button key={v} className={`rp ${form.carType === v ? "sel" : ""}`} onClick={() => F("carType", v)}>{v}</button>
                  ))}
                </div>
              </div>

              <div className="f">
                <label>Seats available (excl. you)</label>
                <input type="number" min={1} max={7} value={form.carSeats} onChange={e => F("carSeats", e.target.value)} placeholder="e.g. 3" />
              </div>

              <div className="f">
                <label>Seat Down</label>
                <div className="rg">
                  {["Yes — can fold seats down", "No"].map(v => (
                    <button key={v} className={`rp ${form.seatDown === v ? "sel" : ""}`} onClick={() => F("seatDown", v)}>{v}</button>
                  ))}
                </div>
              </div>

              <div className="f">
                <label>Ski / Snowboard Rack</label>
                <div className="rg">
                  {["Roof rack", "Hitch rack", "Both", "No rack"].map(v => (
                    <button key={v} className={`rp ${form.skiRackType === v ? "sel" : ""}`} onClick={() => F("skiRackType", v)}>{v}</button>
                  ))}
                </div>
              </div>

              {(form.skiRackType === "Roof rack" || form.skiRackType === "Hitch rack" || form.skiRackType === "Both") && (
                <div className="f">
                  <label>Rack spots</label>
                  <input type="number" min={1} max={10} value={form.skiRackSpots} onChange={e => F("skiRackSpots", e.target.value)} placeholder="e.g. 4" />
                </div>
              )}

              <div className="f" style={{marginBottom:0}}>
                <label>4WD / Chains</label>
                <div className="rg">
                  {["4WD / AWD", "Chains", "Both", "Neither"].map(v => (
                    <button key={v} className={`rp ${form.carTraction === v ? "sel" : ""}`} onClick={() => F("carTraction", v)}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="f">
            <label>Bringing Gear?</label>
            <div className="rg">{["Yes", "No", "No, but bringing down", "Other"].map(v => <button key={v} className={`rp ${form.gear === v ? "sel" : ""}`} onClick={() => F("gear", v)}>{v}</button>)}</div>
          </div>
          <div className="f">
            <label>Skiing Sunday?</label>
            <div className="rg">{["Yes", "No", "Don't Care"].map(v => <button key={v} className={`rp ${form.skiSunday === v ? "sel" : ""}`} onClick={() => F("skiSunday", v)}>{v}</button>)}</div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div className="card up-tint mb20">
            <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "1.15rem", letterSpacing: "2.5px", color: "var(--gold)", marginBottom: 14 }}>↑ Going Up · LA → Mountain</div>
            <div className="f">
              <label>Date</label>
              <CalPicker options={upDates} value={form.upDate} onChange={v => F("upDate", v)} />
            </div>
            <div className="f">
              <label>Available to leave</label>
              <TimeSlotPicker
                value={form.upTimeSlot}
                customStart={form.upTimeStart}
                onSlot={id => setSlot("up", id)}
                onCustomStart={v => F("upTimeStart", v)}
              />
            </div>
          </div>

          <div className="card down-tint mb20">
            <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: "1.15rem", letterSpacing: "2.5px", color: "var(--down)", marginBottom: 14 }}>↓ Coming Down · Mountain → LA</div>
            <div className="f">
              <label>Date</label>
              <CalPicker options={downDates} value={form.downDate} onChange={v => F("downDate", v)} />
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginTop: 8 }}>Down trips depart Sundays only</div>
            </div>
            <div className="f">
              <label>Available to leave</label>
              <TimeSlotPicker
                value={form.downTimeSlot}
                customStart={form.downTimeStart}
                onSlot={id => setSlot("down", id)}
                onCustomStart={v => F("downTimeStart", v)}
              />
            </div>
          </div>

          <div className="card">
            <div className="f"><textarea value={form.notes} onChange={e => F("notes", e.target.value)} placeholder="Anything else?" /></div>
            <button className="btn bp bw" disabled={!canSignup || signupClosed || !!me} onClick={submitSignup}>
              {signupClosed ? "Signup Closed" : me ? "Already Signed Up" : missingFields.length > 0 ? `Missing: ${missingFields.join(", ")}` : "Submit →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
