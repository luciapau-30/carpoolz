import { test } from "node:test";
import assert from "node:assert/strict";
import { overlap, openSeats, scoreMatch, planAutoAssign } from "./matching.js";

const car = (over = {}) => ({
  id: "u1", dir: "up", driver: "Dana", seats: 4, date: "Fri", winStart: "08:00", winEnd: "11:00",
  skiSunday: true, passengers: [], ...over,
});
const rider = (over = {}) => ({
  id: "s1", name: "Riley", upDate: "Fri", upTimeStart: "09:00", upTimeEnd: "10:00",
  downDate: "Sun", downTimeStart: "12:00", downTimeEnd: "15:00", skiSunday: "Yes",
  upCarId: null, downCarId: null, ...over,
});

test("overlap treats touching windows as overlapping", () => {
  assert.equal(overlap("08:00", "09:00", "09:00", "10:00"), true);
  assert.equal(overlap("08:00", "08:59", "09:00", "10:00"), false);
});

test("openSeats excludes the driver", () => {
  assert.equal(openSeats(car({ seats: 4, passengers: ["A"] })), 2);
});

test("scoreMatch rewards same date and matching Sunday preference", () => {
  assert.equal(scoreMatch(rider(), car()), 80);
  assert.equal(scoreMatch(rider({ upDate: "Thu" }), car()), 60);
  assert.equal(scoreMatch(rider({ skiSunday: "No" }), car()), 70);
});

test("scoreMatch rejects cars with no time overlap or no seats", () => {
  assert.equal(scoreMatch(rider({ upTimeStart: "12:00", upTimeEnd: "13:00" }), car()), -1);
  assert.equal(scoreMatch(rider(), car({ seats: 2, passengers: ["A"] })), -1);
});

test("scoreMatch never offers a down car before an up car is assigned", () => {
  const down = car({ id: "d1", dir: "down", date: "Sun", winStart: "12:00", winEnd: "16:00" });
  assert.equal(scoreMatch(rider(), down), -1);
  assert.ok(scoreMatch(rider({ upCarId: "u1" }), down) > 0);
});

test("planAutoAssign puts drivers in their own cars and riders in the best car", () => {
  const cars = [
    car({ id: "u1", driver: "Dana", date: "Thu" }),
    car({ id: "u2", driver: "Eli", date: "Fri" }),
    car({ id: "d1", dir: "down", driver: "Dana", date: "Sun", winStart: "12:00", winEnd: "16:00" }),
  ];
  const signups = [rider({ id: "s0", name: "Dana" }), rider()];
  const plan = planAutoAssign(cars, signups);

  const dana = plan.signups.find(s => s.name === "Dana");
  assert.equal(dana.upCarId, "u1");
  assert.equal(dana.downCarId, "d1");

  const riley = plan.signups.find(s => s.name === "Riley");
  assert.equal(riley.upCarId, "u2", "same-date car wins");
  assert.equal(riley.downCarId, "d1");
  assert.deepEqual(plan.cars.find(c => c.id === "u2").passengers, ["Riley"]);
});

test("planAutoAssign respects capacity and leaves overflow unassigned", () => {
  const cars = [car({ seats: 2 })]; // driver + 1 passenger
  const signups = [rider({ id: "a", name: "A" }), rider({ id: "b", name: "B" })];
  const plan = planAutoAssign(cars, signups);
  assert.equal(plan.cars[0].passengers.length, 1);
  assert.equal(plan.signups.filter(s => s.upCarId).length, 1);
});

test("planAutoAssign does not mutate its inputs", () => {
  const cars = [car()];
  const signups = [rider()];
  planAutoAssign(cars, signups);
  assert.deepEqual(cars[0].passengers, []);
  assert.equal(signups[0].upCarId, null);
});
