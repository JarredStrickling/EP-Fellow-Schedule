import { useState, useEffect, useRef } from "react";
import { format, addWeeks, parseISO, isAfter } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const SUPABASE_URL = "https://ekrraibgkgntafarxoni.supabase.co";
const SUPABASE_KEY = "[your-key]"; // Keep this secure
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fellows = ["JS", "TD", "MS"];
const fellowColors = {
  JS: "#bfdbfe",
  TD: "#bbf7d0",
  MS: "#fecaca",
  AG: "#fde68a",
  TM: "#fcd34d",
  MB: "#fbbf24",
  FS: "#f87171",
  PK: "#c4b5fd",
  "N/A": "#e5e7eb",
};

const roleLabels = {
  lab_d: "Lab D",
  lab_f: "Lab F",
  rex_hbh: "Rex/HBH",
  tues_am_ecg: "Tues AM ECG",
  thurs_am_ep: "Thurs AM EP",
};

const attendings = ["AG", "TM", "MB", "FS", "PK", "N/A"];

const clinicScheduleLink = "https://unchcs-my.sharepoint.com/...";
const ecgConfLink = "https://go.unc.edu/weeklyFellowsconference";

export default function App() {
  const [clinicData, setClinicData] = useState({});
  const [schedule, setSchedule] = useState({});
  const [startDate] = useState(parseISO("2025-06-30"));
  const [weeksToShow] = useState(52);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem("unc_ep_pw") === "uncep");
  const [enteredPw, setEnteredPw] = useState("");
  const [visibleClinic, setVisibleClinic] = useState(null);

  const fetchSchedule = async () => {
    const { data, error } = await supabase.from("schedule").select();
    if (error) console.error("Error fetching schedule:", error);
    else {
      const mapped = {};
      data.forEach(({ week_key, lab_d, lab_f, rex_hbh, tues_am_ecg, thurs_am_ep }) => {
        mapped[week_key] = { lab_d, lab_f, rex_hbh, tues_am_ecg, thurs_am_ep };
      });
      setSchedule(mapped);
      setLoading(false);
    }
  };

  const fetchClinicData = async () => {
    const { data, error } = await supabase.from("clinic_schedule").select("*");
    if (error) {
      console.error("Error fetching clinic data:", error);
      return;
    }
    const mapped = {};
    data.forEach((row) => {
      mapped[row.week_key] = {
        monday: row.monday,
        tuesday: row.tuesday,
        wednesday: row.wednesday,
        thursday: row.thursday,
        friday: row.friday,
      };
    });
    setClinicData(mapped);
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

  const saveAssignment = async (weekKey, assignments) => {
    const { error } = await supabase.from("schedule").upsert({ week_key: weekKey, ...assignments });
    if (error) console.error("Error saving assignment:", error);
  };

  const handleTap = (weekKey, role, e) => {
    e.preventDefault();
    setSchedule((prev) => {
      const currentWeek = prev[weekKey] || {
        lab_d: fellows[0],
        lab_f: fellows[1],
        rex_hbh: fellows[2],
        tues_am_ecg: "AG",
        thurs_am_ep: "TM",
      };
      const list = role.includes("ecg") || role.includes("ep") ? attendings : fellows;
      const next = list[(list.indexOf(currentWeek[role]) + 1) % list.length];
      const updatedWeek = { ...currentWeek, [role]: next };
      const updated = { ...prev, [weekKey]: updatedWeek };
      saveAssignment(weekKey, updatedWeek);
      return updated;
    });
  };

  const weekList = Array.from({ length: weeksToShow }, (_, i) => {
    const weekStart = addWeeks(startDate, i);
    const weekEnd = addWeeks(weekStart, 1);
    const weekKey = `${format(weekStart, "yyyy-MM-dd")}_${format(weekEnd, "yyyy-MM-dd")}`;
    const assigned = schedule[weekKey] || {
      lab_d: fellows[i % fellows.length],
      lab_f: fellows[(i + 1) % fellows.length],
      rex_hbh: fellows[(i + 2) % fellows.length],
      tues_am_ecg: attendings[i % attendings.length],
      thurs_am_ep: attendings[(i + 1) % attendings.length],
    };
    return { weekKey, weekStart, assigned };
  });

  const todayIndex = weekList.findIndex((w) => isAfter(new Date(w.weekStart), new Date()));

  if (loading) return <div style={{ padding: "2rem" }}>Loading schedule...</div>;

  if (!unlocked) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <h2>Enter Password</h2>
        <input type="password" value={enteredPw} onChange={(e) => setEnteredPw(e.target.value)} />
        <button onClick={() => {
          if (enteredPw === "uncep") {
            localStorage.setItem("unc_ep_pw", "uncep");
            setUnlocked(true);
          } else {
            alert("Wrong password");
          }
        }}>Unlock</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", fontFamily: '"Segoe UI", system-ui, sans-serif', backgroundColor: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, background: "var(--bg)", paddingBottom: "1rem", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>
            EP Schedule
            <div style={{ fontSize: "0.9rem", fontWeight: "normal", color: "#888" }}>UNC</div>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
            <a href={clinicScheduleLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem" }}>Clinic Schedule</a>
            <a href={ecgConfLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>ECG/EP Conference Zoom</a>
            <img src="/unc-logo.png" alt="UNC Logo" title="UNC EP Fellowship" style={{ width: "50px", marginTop: "0.5rem", alignSelf: "flex-end", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        {weekList.map(({ weekKey, weekStart, assigned }, i) => (
          <div
            key={weekKey}
            ref={i === todayIndex ? scrollRef : null}
            style={{
              background: "var(--card-bg)",
              padding: "1rem",
              borderRadius: "0.75rem",
              boxShadow: i === todayIndex ? "0 0 0 2px #60a5fa, 0 4px 10px rgba(96, 165, 250, 0.5)" : "0 2px 5px var(--card-shadow)",
            }}
          >
            <div><strong>Week of {format(weekStart, "MMM d, yyyy")}</strong></div>
            {Object.keys(roleLabels).map((role) => (
              <div key={role} style={{ marginTop: "0.5rem" }}>
                <div
                  onClick={(e) => handleTap(weekKey, role, e)}
                  className="tap-pill"
                  style={{
                    background: fellowColors[assigned[role]] || "#e5e7eb",
                  }}
                >
                  {assigned[role]}
                </div>
                <span style={{ marginLeft: "0.5rem" }}>{roleLabels[role]}</span>
              </div>
            ))}
            <button style={{ marginTop: "0.75rem", fontSize: "0.8rem" }} onClick={() => setVisibleClinic(visibleClinic === weekKey ? null : weekKey)}>
              {visibleClinic === weekKey ? "Hide Clinic" : "View Clinic"}
            </button>
            {visibleClinic === weekKey && (
              <div style={{ marginTop: "0.5rem" }}>
                {!clinicData[weekKey] ? (
                  <div style={{ fontStyle: "italic", color: "#666" }}>No clinic data available for this week.</div>
                ) : (
                  Object.entries(clinicData[weekKey]).map(([day, person]) => (
                    <div key={day}><strong>{day}:</strong> {person}</div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
