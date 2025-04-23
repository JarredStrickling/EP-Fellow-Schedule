import { useState, useEffect } from "react";
import { format, addWeeks, parseISO } from "date-fns";

const fellows = ["JS", "TD", "MS"];
const colors = {
  JS: "#bfdbfe", // blue
  TD: "#bbf7d0", // green
  MS: "#fecaca", // red
};

const getInitialSchedule = () => {
  const stored = localStorage.getItem("epSchedule");
  return stored ? JSON.parse(stored) : {};
};

export default function App() {
  const [schedule, setSchedule] = useState(getInitialSchedule);
  const [startDate] = useState(parseISO("2025-06-30")); // Start June 30, 2025
  const [weeksToShow] = useState(52); // Full year

  useEffect(() => {
    localStorage.setItem("epSchedule", JSON.stringify(schedule));
  }, [schedule]);

  const handleAssign = (weekKey) => {
    const current = schedule[weekKey];
    const next = fellows[(fellows.indexOf(current) + 1) % fellows.length];
    setSchedule({ ...schedule, [weekKey]: next });
  };

  const weekList = Array.from({ length: weeksToShow }, (_, i) => {
    const weekStart = addWeeks(startDate, i);
    const weekKey = format(weekStart, "yyyy-MM-dd");
    const assigned = schedule[weekKey] || fellows[i % fellows.length];
    return { weekKey, weekStart, assigned };
  });

  const tally = fellows.reduce((acc, name) => {
    const past = weekList
      .slice(0, weekList.findIndex((w) => new Date(w.weekStart) > new Date()))
      .filter((w) => w.assigned === name).length;
    const upcoming = weekList
      .slice(weekList.findIndex((w) => new Date(w.weekStart) > new Date()))
      .filter((w) => w.assigned === name).length;
    acc[name] = { past, upcoming, total: past + upcoming };
    return acc;
  }, {});

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>EP Cuck Schedule</h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        {fellows.map((name) => (
          <div
            key={name}
            style={{
              background: colors[name],
              padding: "1rem",
              borderRadius: "0.5rem",
              flex: 1,
              textAlign: "center",
            }}
          >
            <strong>{name}</strong>
            <div>Past: {tally[name].past}</div>
            <div>Upcoming: {tally[name].upcoming}</div>
            <div>Total: {tally[name].total}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {weekList.map(({ weekKey, weekStart, assigned }) => (
          <div
            key={weekKey}
            onClick={() => handleAssign(weekKey)}
            style={{
              background: colors[assigned],
              padding: "1rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <div><strong>Week of {format(weekStart, "MMM d, yyyy")}</strong></div>
            <div>Cuck: {assigned}</div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>(Click to change)</div>
          </div>
        ))}
      </div>
    </div>
  );
}
