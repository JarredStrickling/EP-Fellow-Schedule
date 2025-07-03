import { useState, useEffect, useRef } from "react";
import { format, addWeeks, parseISO, isAfter } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const SUPABASE_URL = "https://ekrraibgkgntafarxoni.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...";  // full key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fellows = ["JS", "TD", "MS"];
const attendings = ["AG", "TM", "MB", "FS", "PK"];

const fellowColors = {
  JS: "#bfdbfe",
  TD: "#bbf7d0",
  MS: "#fecaca",
};

const attendingColors = {
  AG: "#fde68a",
  TM: "#fcd34d",
  MB: "#fdba74",
  FS: "#fca5a5",
  PK: "#c4b5fd",
};

const roleLabels = {
  lab_d: "Lab D",
  lab_f: "Lab F",
  rex_hbh: "Rex/HBH",
};

const clinicScheduleLink =
  "https://unchcs-my.sharepoint.com/:x:/r/personal/u324188_unch_unc_edu/Documents/Attachments/EP%20schedule%202025%20JUN-DEC.xlsx?d=w7e639e8a3f3a4636bfc019a3e39f7f1c&csf=1&web=1&e=dw3UBA";

export default function App() {
  const [schedule, setSchedule] = useState({});
  const [clinicData, setClinicData] = useState({});
  const [visibleClinic, setVisibleClinic] = useState(null);
  const [visibleConf, setVisibleConf] = useState(null);

  const [startDate] = useState(parseISO("2025-06-30"));
  const [weeksToShow] = useState(52);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem("unc_ep_pw") === "uncep");
  const [enteredPw, setEnteredPw] = useState("");

  const fetchSchedule = async () => {
    const { data, error } = await supabase.from("schedule").select();
    if (error) console.error("Error fetching schedule:", error);
    else {
      const mapped = {};
      data.forEach((row) => {
        mapped[row.week_key] = {
          lab_d: row.lab_d,
          lab_f: row.lab_f,
          rex_hbh: row.rex_hbh,
          tues_am_ecg: row.tues_am_ecg,
          thurs_am_ep: row.thurs_am_ep,
          monday: row.monday,
          tuesday: row.tuesday,
          wednesday: row.wednesday,
          thursday: row.thursday,
          friday: row.friday,
        };
      });
      setSchedule(mapped);
      setLoading(false);
    }
  };

  const saveAssignment = async (weekKey, updatedWeek) => {
    const { error } = await supabase
      .from("schedule")
      .upsert({ week_key: weekKey, ...updatedWeek });
    if (error) console.error("Error saving assignment:", error);
  };

  const handleTap = (weekKey, role, list, colors) => {
    setSchedule((prev) => {
      const currentWeek = prev[weekKey] || {};
      const current = currentWeek[role];
      const next = list[(list.indexOf(current) + 1) % list.length];
      const updatedWeek = { ...currentWeek, [role]: next };
      const updated = { ...prev, [weekKey]: updatedWeek };
      saveAssignment(weekKey, updatedWeek);
      return updated;
    });
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

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

  const tally = fellows.reduce((acc, name) => {
    acc[name] = { lab_d: 0, lab_f: 0, rex_hbh: 0, total: 0 };
    weekList.forEach(({ assigned }) => {
      Object.keys(roleLabels).forEach((role) => {
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
        <div style={{ display: "flex", gap: "1rem" }}>
          {fellows.map((name) => (
            <div key={name} style={{ background: fellowColors[name], padding: "0.5rem", borderRadius: "0.5rem" }}>
              <strong>{name}</strong>
              <div>Lab D: {tally[name].lab_d}</div>
              <div>Lab F: {tally[name].lab_f}</div>
              <div>Rex/HBH: {tally[name].rex_hbh}</div>
              <div>Total: {tally[name].total}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
          <a href={clinicScheduleLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem" }}>
            Clinic Schedule
          </a>
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
                  onClick={() => handleTap(weekKey, role, fellows, fellowColors)}
                  style={{
                    display: "inline-block",
                    padding: "0.3rem 0.6rem",
                    background: fellowColors[assigned[role]],
                    borderRadius: "1rem",
                    cursor: "pointer",
                  }}
                >
                  {assigned[role]}
                </div>
                <span style={{ marginLeft: "0.5rem" }}>{roleLabels[role]}</span>
              </div>
            ))}
            <div style={{ marginTop: "0.5rem" }}>
              <div>
                <strong>Tuesday AM ECG:</strong>{" "}
                <span
                  onClick={() => handleTap(weekKey, "tues_am_ecg", attendings, attendingColors)}
                  style={{
                    padding: "0.2rem 0.5rem",
                    background: attendingColors[assigned.tues_am_ecg],
                    borderRadius: "1rem",
                    cursor: "pointer",
                    marginLeft: "0.5rem",
                  }}
                >
                  {assigned.tues_am_ecg}
                </span>
              </div>
              <div>
                <strong>Thursday AM EP Conf:</strong>{" "}
                <span
                  onClick={() => handleTap(weekKey, "thurs_am_ep", attendings, attendingColors)}
                  style={{
                    padding: "0.2rem 0.5rem",
                    background: attendingColors[assigned.thurs_am_ep],
                    borderRadius: "1rem",
                    cursor: "pointer",
                    marginLeft: "0.5rem",
                  }}
                >
                  {assigned.thurs_am_ep}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
