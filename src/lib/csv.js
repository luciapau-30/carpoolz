import { fmtWin } from "./time.js";

// Build the organizer export: one row per person, then a roster block per car.
export function buildCarpoolCsv(signups, cars) {
  // ── Sheet 1: People + assignments ──
  const rows = [["Name","Phone","Standing","Venmo","Venmo Type","Pickup","Driving","Car Type","Seats Avail","Seat Down","Ski Rack Type","Ski Rack Spots","Traction","Up Date","Up Window","Down Date","Down Window","Ski Sun","Gear","Notes","Up Car Driver","Up Car Phone","Up Car Date","Up Car Window","Up Car Pickup","Down Car Driver","Down Car Phone","Down Car Date","Down Car Window","Down Car Pickup"]];
  signups.forEach(s => {
    const uc = cars.find(c => c.id === s.upCarId);
    const dc = cars.find(c => c.id === s.downCarId);
    rows.push([
      s.name, s.phone, s.standing, s.venmo, s.venmoType, s.pickup, s.driving,
      s.carType||"", s.carSeats||"", s.seatDown||"", s.skiRackType||"", s.skiRackSpots||"", s.carTraction||"",
      s.upDate, `${s.upTimeStart}–${s.upTimeEnd||"open"}`,
      s.downDate, `${s.downTimeStart}–${s.downTimeEnd||"open"}`,
      s.skiSunday, s.gear, s.notes||"",
      uc ? uc.driver : "UNMATCHED",
      uc ? uc.phone  : "",
      uc ? uc.date   : "",
      uc ? fmtWin(uc.winStart, uc.winEnd) : "",
      uc ? uc.pickup : "",
      dc ? dc.driver : "UNMATCHED",
      dc ? dc.phone  : "",
      dc ? dc.date   : "",
      dc ? fmtWin(dc.winStart, dc.winEnd) : "",
      dc ? dc.pickup : "",
    ]);
  });

  // ── Sheet 2: Car rosters ──
  rows.push([]); // blank separator
  rows.push(["── CAR ROSTERS ──"]);
  rows.push([]);
  cars.forEach(c => {
    rows.push([`${c.dir.toUpperCase()} · ${c.driver} · ${c.date} · ${fmtWin(c.winStart, c.winEnd)} · ${c.pickup}`]);
    rows.push(["Role","Name","Phone","Venmo"]);
    // Driver row
    const driverSignup = signups.find(s => s.name === c.driver);
    rows.push(["DRIVER", c.driver, c.phone, driverSignup ? `${driverSignup.venmoType}: ${driverSignup.venmo}` : ""]);
    // Passengers
    c.passengers.forEach(p => {
      const su = signups.find(s => s.name === p);
      rows.push(["passenger", p, su?.phone||"", su ? `${su.venmoType}: ${su.venmo}` : ""]);
    });
    // Empty seats
    const openSeats = c.seats - c.passengers.length - 1;
    for (let i = 0; i < openSeats; i++) rows.push(["open seat","—","",""]);
    rows.push([]); // blank line between cars
  });

  const csv = rows.map(r => r.map(v => `"${(v||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
  return csv;
}
