import { useState, useEffect } from "react";
import { format, addWeeks, parseISO } from "date-fns";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ekrraibgkgntafarxoni.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnJhaWJna2dudGFmYXJ4b25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzI5MTMsImV4cCI6MjA2MDk0ODkxM30.a6KwZbxSCql1AjhKG9PMPjh6ctU9nnFzwgGerMOVmBI";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fellows = ["JS", "TD", "MS"];
const colors = {
  JS: "#bfdbfe",
  TD: "#bbf7d0",
  MS: "#fecaca",
};

export default function App() {
  const [schedule, setSchedule] = useState({});
  const [startDate] = useState(parseISO("2025-06-30"));
  const [weeksToShow] = useState(52);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    const { data, error } = await supabase.from("schedule").select();
    if (error) console.error("Error fetching schedule:", error);
    else {
      const mapped = {};
      data.forEach(({ week_key, assigned }) => {
        mapped[week_key] = assigned;
      });
      setSchedule(mapped);
      setLoading(false);
    }
  };

  const saveAssignment = async (weekKey, assigned) => {
    const { error } = await supabase
      .from("schedule")
      .upsert({ week_key: weekKey, assigned });
    if (error) console.error("Error saving assignment:", error);
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAssign = async (weekKey) => {
    const current = schedule[weekKey];
    const next = fellows[(fellows.indexOf(current) + 1) % fellows.length];
    const updated = { ...schedule, [weekKey]: next };
    setSchedule(updated);
    await saveAssignment(weekKey, next);
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

  if (loading) return <div style={{ padding: "2rem" }}>Loading schedule...</div>;

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>EP Rex/HBH Schedule (Shared)</h1>

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
            <div>
              <strong>Week of {format(weekStart, "MMM d, yyyy")}</strong>
            </div>
            <div>Rex/HBH: {assigned}</div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>(Click to change)</div>
          </div>
        ))}
      </div>
    </div>
  );
}
