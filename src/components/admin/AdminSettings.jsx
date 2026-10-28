export default function AdminSettings({ setSettings, settings, toast }) {
  return (
    <>
      <div className="ac">
        <div className="act">Controls</div>
        {[
          { k: "signupOpen",   l: "Signup Form Open",          s: "Allow new submissions" },
          { k: "requestsOpen", l: "Change/Drop Requests Open",  s: "Closes Wed 11:59 PM" },
          { k: "dashPublic",   l: "Carpools Public",            s: "Anyone can view the Carpools tab" },
          { k: "memberOpen",   l: "Member Tier Unlocked",       s: "Officers & Members can sign up" },
          { k: "alumniOpen",   l: "Alumni & Guest Tier Open",   s: "Alumni and guests can sign up" },
        ].map(({ k, l, s }) => (
          <div key={k} className="trow">
            <div><div className="tlbl">{l}</div><div className="tsub">{s}</div></div>
            <button className={`tog ${settings[k] ? "on" : ""}`} onClick={() => { const n = !settings[k]; setSettings(p => ({ ...p, [k]: n })); toast(`${l} ${n ? "ON" : "OFF"}`, n ? "purple" : "warn"); }} />
          </div>
        ))}
      </div>
    </>
  );
}
