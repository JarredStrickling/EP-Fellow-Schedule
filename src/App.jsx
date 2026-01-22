import { useState, useEffect, useRef } from "react";
import { format, addWeeks, parseISO } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import "./App.css";
import DiagnosticHub from "./DiagnosticHub"; // Integrated DiagnosticHub

const SUPABASE_URL = "https://ekrraibgkgntafarxoni.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnJhaWJna2dudGFmYXJ4b25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzI5MTMsImV4cCI6MjA2MDk0ODkxM30.a6KwZbxSCql1AjhKG9PMPjh6ctU9nnFzwgGerMOVmBI";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
const clinicScheduleLink = "https://unchcs-my.sharepoint.com/:x:/r/personal/u324188_unch_unc_edu/Documents/Attachments/EP%20schedule%202025%20JUN-DEC.xlsx?d=w7e639e8a3f3a4636bfc019a3e39f7f1c&csf=1&web=1&e=dw3UBA";
const ecgConfLink = "https://go.unc.edu/weeklyFellowsconference";

export default function App() {
  const [view, setView] = useState("schedule"); // View toggle state
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
        monday: row.monday, tuesday: row.tuesday, wednesday: row.wednesday, thursday: row.thursday, friday: row.friday,
      };
    });
    setClinicData(mapped);
  };

  useEffect(() => {
    fetchSchedule();
    fetchClinicData();
  }, []);

  useEffect(() => {
    if (!loading && scrollRef.current && view === "schedule") {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, view]);

  const saveAssignment = async (weekKey, assignments) => {
    const { error } = await supabase.from("schedule").upsert({ week_key: weekKey, ...assignments });
    if (error) console.error("Error saving assignment:", error);
  };

  const handleTap = (weekKey, role, e) => {
    e.preventDefault();
    setSchedule((prev) => {
      const currentWeek = prev[weekKey] || { lab_d: fellows[0], lab_f: fellows[1], rex_hbh: fellows[2], tues_am_ecg: "AG", thurs_am_ep: "TM" };
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
    weekEnd.setDate(weekEnd.getDate() - 1);
    const weekKey = `${format(weekStart, "yyyy-MM-dd")}_${format(weekEnd, "yyyy-MM-dd")}`;
    const assigned = schedule[weekKey] || {
      lab_d: fellows[i % fellows.length],
      lab_f: fellows[(i + 1) % fellows.length],
      rex_hbh: fellows[(i + 2) % fellows.length],
      tues_am_ecg: attendings[i % attendings.length],
      thurs_am_ep: attendings[(i + 1) % attendings.length],
    };
    return { weekKey, weekStart, weekEnd, assigned };
  });

  const todayIndex = weekList.findIndex(({ weekStart, weekEnd }) => {
    const now = new Date();
    return now >= weekStart && now <= weekEnd;
  });

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
    <div style={{ fontFamily: '"Segoe UI", system-ui, sans-serif', backgroundColor: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <div className="glass-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ textAlign: "left" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--text)" }}>
              EP <span style={{ color: "#3b82f6" }}>{view === "schedule" ? "Schedule" : "Hub"}</span>
            </h2>
            <div style={{ fontSize: "0.65rem", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              UNC Health
            </div>
          </div>

          <button 
            onClick={() => setView(view === "schedule" ? "hub" : "schedule")}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              backgroundColor: view === "schedule" ? "#3b82f6" : "#10b981",
              color: "white",
              border: "none",
              fontWeight: "700",
              fontSize: "0.75rem",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              cursor: "pointer"
            }}
          >
            {view === "schedule" ? "📖 Study Hub" : "🗓️ Schedule"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "15px", marginTop: "12px", paddingTop: "8px", borderTop: "1px solid var(--card-shadow)" }}>
          <a href={clinicScheduleLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--link)" }}>
            📍 Clinic
          </a>
          <a href={ecgConfLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--link)" }}>
            📺 Conference
          </a>
        </div>
      </div>

      <div style={{ padding: "0 1rem 1rem 1rem" }}>
        {view === "schedule" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
            {weekList.map(({ weekKey, weekStart, assigned }, i) => (
              <div
                key={weekKey}
                ref={i === todayIndex ? scrollRef : null}
                style={{
                  background: "var(--card-bg)",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  boxShadow: i === todayIndex
                    ? "0 0 10px 2px rgba(96,165,250,0.8), inset 0 0 6px rgba(96,165,250,0.4)"
                    : "0 2px 5px var(--card-shadow)",
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
                        color: "#1a1a1a",
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
        ) : (
          <DiagnosticHub />
        )}
      </div>
    </div>
  );
}