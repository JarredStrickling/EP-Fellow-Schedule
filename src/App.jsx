import { useState, useEffect, useRef } from "react";
import { format, addWeeks, parseISO, isAfter } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const SUPABASE_URL = "https://ekrraibgkgntafarxoni.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnJhaWJna2dudGFmYXJ4b25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzI5MTMsImV4cCI6MjA2MDk0ODkxM30.a6KwZbxSCql1AjhKG9PMPjh6ctU9nnFzwgGerMOVmBI";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fellows = ["JS", "TD", "MS"];
const fellowColors = {
  JS: "#bfdbfe",
  TD: "#bbf7d0",
  MS: "#fecaca",
};

const roleLabels = {
  lab_d: "Lab D",
  lab_f: "Lab F",
  rex_hbh: "Rex/HBH",
};

const clinicScheduleLink = "https://unchcs-my.sharepoint.com/:x:/r/personal/u324188_unch_unc_edu/Documents/Attachments/EP%20schedule%202025%20JUN-DEC.xlsx?d=w7e639e8a3f3a4636bfc019a3e39f7f1c&csf=1&web=1&e=dw3UBA";

export default function App() {
  const [clinicData, setClinicData] = useState({});
  const [schedule, setSchedule] = useState({});
  const [startDate] = useState(parseISO("2025-06-30"));
  const [weeksToShow] = useState(52);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem("unc_ep_pw") === "uncep";
  });
  const [enteredPw, setEnteredPw] = useState("");
  const [visibleClinic, setVisibleClinic] = useState(null);

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

  const fetchClinicData = async () => {
    const { data, error } = await supabase.from("clinic_schedule").select("*");
    if (error) {
      console.error("Error fetching clinic data:", error);
    } else {
      const mapped = {};
      data.forEach((row) => {
        mapped[row.week_range] = {
          monday: row.monday,
          tuesday: row.tuesday,
          wednesday: row.wednesday,
          thursday: row.thursday,
          friday: row.friday,
        };
      });
      setClinicData(mapped);
    }
  };

  const saveAssignment = async (weekKey, assignments) => {
    const { error } = await supabase
      .from("schedule")
      .upsert({ week_key: weekKey, ...assignments });
    if (error) console.error("Error saving assignment:", error);
  };

  const handleTap = async (weekKey, role, e) => {
    e.preventDefault();
    setSchedule((prev) => {
      const currentWeek = prev[weekKey] || {
        lab_d: fellows[0],
        lab_f: fellows[1],
        rex_hbh: fellows[2],
      };

      const nextFellow =
        fellows[(fellows.indexOf(currentWeek[role]) + 1) % fellows.length];

      const updatedWeek = {
        lab_d: currentWeek.lab_d,
        lab_f: currentWeek.lab_f,
        rex_hbh: currentWeek.rex_hbh,
        [role]: nextFellow,
      };

      const updated = {
        ...prev,
        [weekKey]: updatedWeek,
      };

      saveAssignment(weekKey, updatedWeek);
      return updated;
    });
  };

  useEffect(() => {
    fetchSchedule();
    fetchClinicData();
  }, []);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

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

  const todayIndex = weekList.findIndex((w) =>
    isAfter(new Date(w.weekStart), new Date())
  );

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
  if (!unlocked) {
    return (
      <div style={{ height: "100vh", backgroundColor: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem", fontFamily: "sans-serif" }}>
        <h2 style={{ marginBottom: "1rem" }}>Enter Password to Access Schedule</h2>
        <input
          type="password"
          value={enteredPw}
          onChange={(e) => setEnteredPw(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #ccc", fontSize: "1rem" }}
        />
        <button
          onClick={() => {
            if (enteredPw === "uncep") {
              localStorage.setItem("unc_ep_pw", "uncep");
              setUnlocked(true);
            } else {
              alert("Incorrect password.");
            }
          }}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}
        >
          Unlock
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        {weekList.map(({ weekKey, weekStart, assigned }, i) => (
          <div key={weekKey} ref={i === todayIndex ? scrollRef : null} style={{ backgroundColor: "var(--card-bg)", padding: "1rem", borderRadius: "0.75rem", boxShadow: "0 2px 5px var(--card-shadow)", position: "relative" }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              Week of {format(weekStart, "MMM d, yyyy")}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {Object.keys(roleLabels).map((role) => (
                <div key={role} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    onClick={(e) => handleTap(weekKey, role, e)}
                    style={{ width: "36px", height: "36px", borderRadius: "50%", background: fellowColors[assigned[role]], color: "var(--fellow-text)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", cursor: "pointer" }}
                  >
                    {assigned[role]}
                  </div>
                  <div style={{ fontWeight: "500" }}>{roleLabels[role]}</div>
                </div>
              ))}
            </div>

            <button style={{ marginTop: "0.75rem", backgroundColor: "#2563eb", color: "white", border: "none", padding: "0.25rem 0.5rem", borderRadius: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }} onClick={() => setVisibleClinic(visibleClinic === weekKey ? null : weekKey)}>
              {visibleClinic === weekKey ? "Hide Clinic" : "View Clinic"}
            </button>

            {visibleClinic === weekKey && clinicData[weekKey] && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", backgroundColor: "var(--bg)", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--card-shadow)", textAlign: "left" }}>
                {Object.entries(clinicData[weekKey]).map(([day, person]) => (
                  <div key={day}>
                    <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong> {person}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
