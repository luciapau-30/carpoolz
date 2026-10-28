// Date and time helpers.

export function getThisWeekDates() {
  // Returns Thu/Fri/Sat of the current week (Mon-based), and next Sun
  const today = new Date();
  const day = today.getDay(); // 0=Sun,1=Mon,...,6=Sat
  // Find this week's Thursday (day 4)
  const thu = new Date(today);
  thu.setDate(today.getDate() + ((4 - day + 7) % 7));
  const fri = new Date(thu); fri.setDate(thu.getDate() + 1);
  const sat = new Date(thu); sat.setDate(thu.getDate() + 2);
  const sun = new Date(thu); sun.setDate(thu.getDate() + 3);
  const fmt = (d) => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return { label: `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`, iso: d.toISOString().slice(0,10) };
  };
  return { thu: fmt(thu), fri: fmt(fri), sat: fmt(sat), sun: fmt(sun) };
}

export function fmtWin(s, e) {
  const f = t => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hr = +h;
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };
  return e ? `${f(s)} – ${f(e)}` : f(s);
}

export const DATE_ORDER = ["Thu","Fri","Sat","Sun","Mon"];

// Sort cars by day of the week, then by departure window start.
export function sortCars(arr) {
  return [...arr].sort((a, b) => {
    const da = DATE_ORDER.findIndex(d => a.date?.startsWith(d));
    const db = DATE_ORDER.findIndex(d => b.date?.startsWith(d));
    if (da !== db) return da - db;
    return (a.winStart || "").localeCompare(b.winStart || "");
  });
}
