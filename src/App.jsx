import { useState, useEffect, useRef } from "react";
import { format, addWeeks, parseISO, isAfter } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import { FaEdit } from "react-icons/fa";

const SUPABASE_URL = "https://ekrraibgkgntafarxoni.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnJhaWJna2dudGFmYXJ4b25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzI5MTMsImV4cCI6MjA2MDk0ODkxM30.a6KwZbxSCql1AjhKG9PMPjh6ctU9nnFzwgGerMOVmBI";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fellows = ["JS", "TD", "MS"];
const colors = {
  lab_d: "#bfdbfe", // blue
  lab_f: "#bbf7d0", // green
  rex_hbh: "#fecaca", // red
};

export default function App() {
  const [schedule, setSchedule] = useState({});
  const [startDate] = useState(parseISO("2025-06-30"));
  const [weeksToShow] = useState(52);
  const [loading, setLoading] = useState(true);
  const [editingWeek, setEditingWeek] = useState(null);
  const scrollRef = useRef(null);

  const fetchSchedule = async () => {
    const { data, error } = await supabase.from("schedule").select();
    if (error) console.error("Error fetching schedule:", error);
    else {
      const mapped = {};
      data.forEach(({ week_key, lab_d, lab_f, rex_hbh }) => {
        mapped[week_key] = { lab_d, lab_f, rex_hbh };
      });
      setSchedule(mapped);
      setLoading(false);
    }
  };

  const saveAssignment = async (weekKey, assignments) => {
    const { error } = await supabase.from("schedule").upsert({ week_key: weekKey, ...assignments });
    if (error) console.error("Error saving assignment:", error);
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  const handleEdit = (weekKey) => {
    setEditingWeek(weekKey);
  };

  const handleSave = async (weekKey) => {
    await saveAssignment(weekKey, schedule[weekKey]);
    setEditingWeek(null);
  };

  const handleChange = (weekKey, role, value) => {
    setSchedule((prev) => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [role]: value,
      },
    }));
  };

  const weekList = Array.from({ length: weeksToShow }, (_, i) => {
    const weekStart = addWeeks(startDate, i);
    const weekKey = format(weekStart, "yyyy-MM-dd");
    const assigned = schedule[weekKey] || {
      lab_d: fellows[i % fellows.length],
      lab_f: fellows[(i + 1) % fellows.length],
      rex_hbh: fellows[(i + 2) % fellows.length],
    };
    return { weekKey, weekStart, assigned };
  });

  const todayIndex = weekList.findIndex((w) => isAfter(new Date(w.weekStart), new Date()));

  const tally = fellows.reduce((acc, name) => {
    acc[name] = { lab_d: 0, lab_f: 0, rex_hbh: 0, total: 0 };
    weekList.forEach(({ assigned }) => {
      Object.keys(assigned).forEach((role) => {
        if (assigned[role] === name) {
          acc[name][role] += 1;
          acc[name].total += 1;
        }
      });
    });
    return acc;
  }, {});

  if (loading) return <div style={{ padding: "2rem" }}>Loading schedule...</div>;

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          padding: "1rem",
          display: "flex",
          gap: "1rem",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          zIndex: 10,
        }}
      >
        {fellows.map((name) => (
          <div
            key={name}
            style={{
              background: "#f9fafb",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              flex: 1,
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            <strong>{name}</strong>
            <div>Lab D: {tally[name].lab_d}</div>
            <div>Lab F: {tally[name].lab_f}</div>
            <div>Rex/HBH: {tally[name].rex_hbh}</div>
            <div>Total: {tally[name].total}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {weekList.map(({ weekKey, weekStart, assigned }, i) => (
          <div
            key={weekKey}
            ref={i === todayIndex ? scrollRef : null}
            style={{
              background: "#f0f4f8",
              padding: "1rem",
              borderRadius: "0.75rem",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              position: "relative",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              Week of {format(weekStart, "MMM d, yyyy")}
            </div>

            {editingWeek === weekKey ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Object.keys(colors).map((role) => (
                  <div key={role} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: colors[role],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {assigned[role]}
                    </div>
                    <select
                      value={assigned[role]}
                      onChange={(e) => handleChange(weekKey, role, e.target.value)}
                      style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem" }}
                    >
                      {fellows.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <button
                  onClick={() => handleSave(weekKey)}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    background: "#4ade80",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Object.keys(colors).map((role) => (
                  <div key={role} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: colors[role],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {assigned[role]}
                    </div>
                    <div style={{ fontWeight: "500" }}>{role.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            )}

            {editingWeek !== weekKey && (
              <button
                onClick={() => handleEdit(weekKey)}
                style={{
                  position: "absolute",
                  bottom: "1rem",
                  right: "1rem",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <FaEdit size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
