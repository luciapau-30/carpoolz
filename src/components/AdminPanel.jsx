import { useState } from "react";
import { supabase } from "../supabase.js";
import { planAutoAssign } from "../lib/matching.js";
import { buildCarpoolCsv } from "../lib/csv.js";
import ConfirmModal from "./admin/ConfirmModal.jsx";
import AssignModal from "./admin/AssignModal.jsx";
import AdminOverview from "./admin/AdminOverview.jsx";
import AdminRequests from "./admin/AdminRequests.jsx";
import AdminPeople from "./admin/AdminPeople.jsx";
import AdminCars from "./admin/AdminCars.jsx";
import AdminAnnouncements from "./admin/AdminAnnouncements.jsx";
import AdminSettings from "./admin/AdminSettings.jsx";

export default function AdminPanel({ cars, signups, requests, toast, loadAll }) {
  const [sub, setSub] = useState("overview");
  const [modal, setModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [anns, setAnns] = useState([{ id: "a0", text: "Carpools are live! Check your spot and submit any changes by Wed midnight. Fight On! ✌️", time: "Now" }]);
  const [newAnn, setNewAnn] = useState("");
  const [settings, setSettings] = useState({ signupOpen: true, requestsOpen: true, dashPublic: true, memberOpen: true, alumniOpen: false });
  const [newCar, setNewCar] = useState({ dir: "up", driver: "", phone: "", seats: 4, date: "", winStart: "08:00", winEnd: "11:00", pickup: "", skiSunday: true });

  const upCars = cars.filter(c => c.dir === "up");
  const downCars = cars.filter(c => c.dir === "down");
  const pending = requests.filter(r => r.status === "pending");
  const unUp = signups.filter(s => !s.upCarId);
  const unDown = signups.filter(s => !s.downCarId);

  const resolveRequest = async (req, accepted) => {
    if (accepted && req.type === "change") {
      const fromCar = cars.find(c => c.id === req.fromCarId);
      const toCar   = cars.find(c => c.id === req.toCarId);
      const dbKey   = req.dir === "up" ? "up_car_id" : "down_car_id";
      const ops = [supabase.from("requests").update({ status: "accepted" }).eq("id", req.id)];
      if (fromCar) ops.push(supabase.from("carpools").update({ passengers: fromCar.passengers.filter(n => n !== req.name) }).eq("id", fromCar.id));
      if (toCar)   ops.push(supabase.from("carpools").update({ passengers: [...toCar.passengers, req.name] }).eq("id", toCar.id));
      ops.push(supabase.from("signups").update({ [dbKey]: req.toCarId }).eq("id", req.signupId));
      await Promise.all(ops);
    } else if (accepted && req.type === "drop") {
      // Remove from all car passenger lists
      await Promise.all(cars.map(c =>
        supabase.from("carpools").update({ passengers: c.passengers.filter(n => n !== req.name) }).eq("id", c.id)
      ));
      // Delete their requests then their signup
      await supabase.from("requests").delete().eq("signup_id", req.signupId);
      await supabase.from("signups").delete().eq("id", req.signupId);
    } else {
      await supabase.from("requests").update({ status: accepted ? "accepted" : "denied" }).eq("id", req.id);
    }
    await loadAll();
    toast(accepted ? "Request accepted ✓" : "Request denied", "purple");
  };

  const assignToCar = async (signup, dir, carId) => {
    // Don't assign to down car if they have no up car yet
    if (dir === "down" && !signup.upCarId) { toast("Assign an up car first", "warn"); return; }
    const dbKey  = dir === "up" ? "up_car_id" : "down_car_id";
    const oldId  = dir === "up" ? signup.upCarId : signup.downCarId;
    const oldCar = cars.find(c => c.id === oldId);
    const newCarObj = cars.find(c => c.id === carId);
    const ops = [supabase.from("signups").update({ [dbKey]: carId }).eq("id", signup.id)];
    if (oldCar) ops.push(supabase.from("carpools").update({ passengers: oldCar.passengers.filter(n => n !== signup.name) }).eq("id", oldId));
    // Only add to passengers if they're not the driver of that car
    if (newCarObj && newCarObj.driver !== signup.name) ops.push(supabase.from("carpools").update({ passengers: [...newCarObj.passengers.filter(n => n !== signup.name), signup.name] }).eq("id", carId));
    await Promise.all(ops);
    await loadAll();
    setAssignModal(null);
    toast(`${signup.name} assigned!`, "purple");
  };

  const assignToCarFromCars = async (signup, dir, fromCarId, toCarId) => {
    const dbKey     = dir === "up" ? "up_car_id" : "down_car_id";
    const fromCar   = cars.find(c => c.id === fromCarId);
    const toCar     = cars.find(c => c.id === toCarId);
    const ops = [supabase.from("signups").update({ [dbKey]: toCarId }).eq("id", signup.id)];
    if (fromCar) ops.push(supabase.from("carpools").update({ passengers: fromCar.passengers.filter(n => n !== signup.name) }).eq("id", fromCarId));
    if (toCar && toCar.driver !== signup.name) ops.push(supabase.from("carpools").update({ passengers: [...toCar.passengers.filter(n => n !== signup.name), signup.name] }).eq("id", toCarId));
    await Promise.all(ops);
    await loadAll();
    toast(`${signup.name} moved!`, "purple");
  };

  const removeFromCarById = async (signup, dir, carId) => {
    const dbKey = dir === "up" ? "up_car_id" : "down_car_id";
    const car   = cars.find(c => c.id === carId);
    const ops   = [supabase.from("signups").update({ [dbKey]: null }).eq("id", signup.id)];
    if (car) ops.push(supabase.from("carpools").update({ passengers: car.passengers.filter(n => n !== signup.name) }).eq("id", carId));
    await Promise.all(ops);
    await loadAll();
    toast("Removed from car", "warn");
  };

  const deletePerson = (signup) => {
    setModal({ msg: `Remove ${signup.name} entirely?`, onOk: async () => {
      const ops = [
        supabase.from("requests").delete().eq("signup_id", signup.id),
      ];
      cars.forEach(c => {
        if (c.passengers.includes(signup.name))
          ops.push(supabase.from("carpools").update({ passengers: c.passengers.filter(n => n !== signup.name) }).eq("id", c.id));
      });
      await Promise.all(ops);
      await supabase.from("signups").delete().eq("id", signup.id);
      await loadAll();
      toast("Deleted", "warn"); setModal(null);
    }});
  };

  const deleteCar = (car) => {
    setModal({ msg: `Delete ${car.driver}'s ${car.dir} car? Passengers become unmatched.`, onOk: async () => {
      const dbKey = car.dir === "up" ? "up_car_id" : "down_car_id";
      const ops = [
        supabase.from("carpools").delete().eq("id", car.id),
        ...car.passengers.map(name => supabase.from("signups").update({ [dbKey]: null }).eq("name", name)),
      ];
      await Promise.all(ops);
      await loadAll();
      toast("Car deleted", "warn"); setModal(null);
    }});
  };

  const addCar = async () => {
    if (!newCar.driver.trim()) return;
    const id = (newCar.dir === "up" ? "u" : "d") + Date.now();
    const row = { id, dir: newCar.dir, driver: newCar.driver, phone: newCar.phone, seats: newCar.seats, date: newCar.date, win_start: newCar.winStart, win_end: newCar.winEnd, pickup: newCar.pickup, ski_sunday: newCar.skiSunday, gear: [], passengers: [] };
    const { error } = await supabase.from("carpools").insert(row);
    if (error) { toast("Failed to add car", "warn"); console.error(error); return; }
    await loadAll();
    setNewCar({ dir: "up", driver: "", phone: "", seats: 4, date: "", winStart: "08:00", winEnd: "11:00", pickup: "", skiSunday: true });
    toast("Car added!", "purple");
  };

  const exportCSV = () => {
    const csv = buildCarpoolCsv(signups, cars);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "usc_ski_carpoolz.csv" }).click();
    toast("Exported!", "purple");
  };

  const autoAssign = async () => {
    const plan = planAutoAssign(cars, signups);
    const ops = [
      ...plan.cars.map(c => supabase.from("carpools").update({ passengers: c.passengers }).eq("id", c.id)),
      ...plan.signups.map(s => supabase.from("signups").update({ up_car_id: s.upCarId || null, down_car_id: s.downCarId || null }).eq("id", s.id)),
    ];
    await Promise.all(ops);
    await loadAll();
    toast("Auto-assigned! Review and adjust as needed.", "purple");
  };

  const dirCars = (dir) => cars.filter(c => c.dir === dir);
  const SUBS = [{ id: "overview", l: "Overview" }, { id: "requests", l: "Requests", n: pending.length }, { id: "people", l: "People" }, { id: "cars", l: "Cars" }, { id: "announce", l: "Announce" }, { id: "settings", l: "Settings" }];

  return (<>
    {modal && <ConfirmModal modal={modal} setModal={setModal} />}
    {assignModal && <AssignModal assignModal={assignModal} assignToCar={assignToCar} dirCars={dirCars} setAssignModal={setAssignModal} />}

    <div className="adm-head">
      <h2>Admin Panel</h2>
      <span className="badge badge-purple">Officer Mode</span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button className="btn b-purple bs" onClick={autoAssign}>⚡ Auto-Assign</button>
        <button className="btn b-green bs" onClick={exportCSV}>⬇ Export CSV</button>
      </div>
    </div>

    <div className="adm-sub">
      {SUBS.map(t => (
        <button key={t.id} className={`asb ${sub === t.id ? "on" : ""}`} onClick={() => setSub(t.id)}>
          {t.l}{t.n > 0 && <span className="notif">{t.n}</span>}
        </button>
      ))}
    </div>

    {sub === "overview" && <AdminOverview downCars={downCars} pending={pending} setAssignModal={setAssignModal} signups={signups} unDown={unDown} unUp={unUp} upCars={upCars} />}

    {sub === "requests" && <AdminRequests cars={cars} pending={pending} requests={requests} resolveRequest={resolveRequest} signups={signups} />}

    {sub === "people" && <AdminPeople cars={cars} deletePerson={deletePerson} loadAll={loadAll} setAssignModal={setAssignModal} signups={signups} />}

    {sub === "cars" && <AdminCars addCar={addCar} assignToCar={assignToCar} assignToCarFromCars={assignToCarFromCars} cars={cars} deleteCar={deleteCar} newCar={newCar} removeFromCarById={removeFromCarById} setNewCar={setNewCar} signups={signups} />}

    {sub === "announce" && <AdminAnnouncements anns={anns} newAnn={newAnn} setAnns={setAnns} setNewAnn={setNewAnn} toast={toast} />}

    {sub === "settings" && <AdminSettings setSettings={setSettings} settings={settings} toast={toast} />}
  </>);
}
