
export default function SeatsBar({ car, myName }) {
  return (
    <div className="seats-bar">
      <div className="seat filled">🚗</div>
      {Array.from({ length: car.seats - 1 }).map((_, i) => {
        const p = car.passengers[i];
        const me = p === myName;
        return <div key={i} className={`seat ${me ? "me" : p ? "filled" : ""}`}>{me ? "★" : p ? p[0] : ""}</div>;
      })}
    </div>
  );
}
