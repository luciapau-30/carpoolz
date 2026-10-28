
export default function CalPicker({ options, value, onChange }) {
  return (
    <div className="cal-grid">
      {options.map(opt => {
        const parts = opt.label.split(" "); // e.g. ["Fri","Apr","4"]
        return (
          <div key={opt.label} className={`cal-day ${value === opt.label ? "sel" : ""}`} onClick={() => onChange(opt.label)}>
            <div className="cal-dow">{parts[0]}</div>
            <div className="cal-date">{parts[2]}</div>
            <div className="cal-month">{parts[1]}</div>
          </div>
        );
      })}
    </div>
  );
}
