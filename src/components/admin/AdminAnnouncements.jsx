export default function AdminAnnouncements({ anns, newAnn, setAnns, setNewAnn, toast }) {
  return (
    <>
      <div className="ac mb20">
        <div className="act">Post Announcement</div>
        <div className="f"><label>Message</label><textarea value={newAnn} onChange={e => setNewAnn(e.target.value)} rows={3} placeholder="e.g. Cars sent! Check your spot. Fight On! ✌️" /></div>
        <button className="btn b-purple bw" onClick={() => { if (!newAnn.trim()) return; setAnns(p => [{ id: "a" + Date.now(), text: newAnn, time: "Now" }, ...p]); setNewAnn(""); toast("Posted!", "purple"); }}>Post</button>
      </div>
      <div className="ac">
        <div className="act">Posted</div>
        {anns.map(a => (
          <div key={a.id} className="ann-box">
            <div style={{ flex: 1 }}><div style={{ fontSize: "0.85rem", color: "var(--text)" }}>{a.text}</div><div style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "DM Mono,monospace", marginTop: 3 }}>{a.time}</div></div>
            <button style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }} onClick={() => setAnns(p => p.filter(x => x.id !== a.id))}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}
