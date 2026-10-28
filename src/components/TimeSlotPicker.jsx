import { TIME_SLOTS } from "../lib/constants.js";

export default function TimeSlotPicker({ value, customStart, onSlot, onCustomStart }) {
  return (
    <div>
      <div className="ts-grid mb12">
        {TIME_SLOTS.map(ts => (
          <div key={ts.id} className={`ts-card ${value === ts.id ? "sel" : ""}`} onClick={() => onSlot(ts.id)}>
            <div className="ts-name">{ts.label}</div>
            <div className="ts-time">{ts.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8, padding:"10px 14px", background:"rgba(0,0,0,0.2)", borderRadius:10, border:"1px solid rgba(255,200,44,0.15)" }}>
        <span style={{ fontFamily:"DM Mono,monospace", fontSize:"0.72rem", color:"var(--muted)", whiteSpace:"nowrap" }}>
          Available to leave starting at:
        </span>
        <input type="time" value={customStart} onChange={e => onCustomStart(e.target.value)}
          style={{ flex:1, minWidth:0, background:"transparent", border:"none", borderBottom:"1px solid rgba(255,200,44,0.3)", borderRadius:0, padding:"2px 4px", color:"var(--gold)", fontFamily:"DM Mono,monospace", fontSize:"0.88rem", outline:"none" }} />
      </div>
    </div>
  );
}
