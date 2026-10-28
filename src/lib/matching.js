// Carpool matching: scoring a rider against a car, and auto-assigning everyone.
// Pure functions with no Supabase or React dependencies, so they can be unit tested.

// Times are "HH:MM" strings, so lexicographic comparison works.
export function overlap(ps, pe, cs, ce) { return ps <= ce && pe >= cs; }

// Seats left after the driver and current passengers.
export function openSeats(car) { return car.seats - car.passengers.length - 1; }

// Score how well a signup fits a car. -1 means the car is not an option.
export function scoreMatch(su, car) {
  const [ps, pe] = car.dir === "up" ? [su.upTimeStart, su.upTimeEnd || "23:59"] : [su.downTimeStart, su.downTimeEnd || "23:59"];
  const date = car.dir === "up" ? su.upDate : su.downDate;
  // Hard blocks
  if (!overlap(ps, pe, car.winStart, car.winEnd)) return -1;
  if (openSeats(car) <= 0) return -1; // no open seats
  if (car.dir === "down" && !su.upCarId) return -1; // no down without up
  let s = 50;
  if (date && car.date === date) s += 20;
  if (su.skiSunday === "Yes" && car.skiSunday) s += 10;
  if (su.skiSunday === "No" && !car.skiSunday) s += 10;
  return s;
}

// Greedy auto-assignment. Drivers go in their own cars first; then each
// unassigned rider takes the highest-scoring car with an open seat, up before down.
// Returns new arrays and never mutates the inputs.
export function planAutoAssign(cars, signups) {
  const newCars = cars.map(c => ({ ...c, passengers: c.passengers.filter(p => p !== c.driver) }));
  const newSignups = signups.map(s => ({ ...s }));

  // First: assign drivers to their own cars
  newCars.forEach(c => {
    if (c.driver === "TBD" || !c.driver) return;
    const su = newSignups.find(s => s.name === c.driver);
    if (!su) return;
    if (c.dir === "up"   && !su.upCarId)   su.upCarId   = c.id;
    if (c.dir === "down" && !su.downCarId) su.downCarId = c.id;
  });

  // Then: assign everyone still missing a car
  newSignups
    .filter(s => !s.upCarId || !s.downCarId)
    .forEach(su => {
      ["up", "down"].forEach(dir => {
        if (dir === "up" ? su.upCarId : su.downCarId) return;
        // Don't assign a down car until there is an up car
        if (dir === "down" && !su.upCarId) return;
        const candidates = newCars
          .filter(c => c.dir === dir && c.driver !== su.name && openSeats(c) > 0)
          .map(c => ({ car: c, score: scoreMatch(su, c) }))
          .filter(x => x.score >= 0)
          .sort((a, b) => b.score - a.score);
        if (candidates.length === 0) return;
        const best = candidates[0].car;
        best.passengers.push(su.name);
        if (dir === "up") su.upCarId = best.id;
        else su.downCarId = best.id;
      });
    });

  return { cars: newCars, signups: newSignups };
}
