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
  tues_am_ecg: "Tues AM ECG",
  thurs_am_ep: "Thurs AM EP",
};

const attendings = ["AG", "TM", "MB", "FS", "PK", "N/A"];

const clinicScheduleLink =
  "https://unchcs-my.sharepoint.com/:x:/r/personal/u324188_unch_unc_edu/Documents/Attachments/EP%20schedule%202025%20JUN-DEC.xlsx?d=w7e639e8a3f3a4636bfc019a3e39f7f1c&csf=1&web=1&e=dw3UBA";

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
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <h2>Enter Password</h2>
        <input type="password" value={enteredPw} onChange={(e) => setEnteredPw(e.target.value)} />
        <button
          onClick={() => {
            if (enteredPw === "uncep") {
              localStorage.setItem("unc_ep_pw", "uncep");
              setUnlocked(true);
            } else {
              alert("Wrong password");
            }
          }}
        >
          Unlock
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ position: "sticky", top: 0, background: "white", paddingBottom: "1rem", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>EP Schedule</h2>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
            <a href={clinicScheduleLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem" }}>
              Clinic Schedule
            </a>
            <a href={ecgConfLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              ECG/EP Conference Zoom
            </a>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        {weekList.map(({ weekKey, weekStart, assigned }, i) => (
          <div
            key={weekKey}
            ref={i === todayIndex ? scrollRef : null}
            style={{ background: "#f9f9f9", padding: "1rem", borderRadius: "0.75rem", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}
          >
            <div><strong>Week of {format(weekStart, "MMM d, yyyy")}</strong></div>
            {Object.keys(roleLabels).map((role) => (
              <div key={role} style={{ marginTop: "0.5rem" }}>
                <div
                  onClick={(e) => handleTap(weekKey, role, e)}
                  style={{ display: "inline-block", padding: "0.3rem 0.6rem", background: fellowColors[assigned[role]] || "#e5e7eb", borderRadius: "1rem", cursor: "pointer" }}
                >
                  {assigned[role]}
                </div>
                <span style={{ marginLeft: "0.5rem" }}>{roleLabels[role]}</span>
              </div>
            ))}
            <button
  style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}
  onClick={() => setVisibleClinic(visibleClinic === weekKey ? null : weekKey)}
>
  {visibleClinic === weekKey ? "Hide Clinic" : "View Clinic"}
</button>

{visibleClinic === weekKey && (
  <div style={{ marginTop: "0.5rem" }}>
    {!clinicData[weekKey] ? (
      <div style={{ fontStyle: "italic", color: "#666" }}>
        No clinic data available for this week.
      </div>
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
