import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ekrraibgkgntafarxoni.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnJhaWJna2dudGFmYXJ4b25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzI5MTMsImV4cCI6MjA2MDk0ODkxM30.a6KwZbxSCql1AjhKG9PMPjh6ctU9nnFzwgGerMOVmBI"
);

export default function CreateSchedule() {
  const [scheduleName, setScheduleName] = useState("");
  const [rotationUnit, setRotationUnit] = useState("week");
  const [participants, setParticipants] = useState("");
  const [assignments, setAssignments] = useState("");
  const [startDate, setStartDate] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);

  const handleCreateSchedule = async () => {
    const newSchedule = {
      name: scheduleName,
      rotation_unit: rotationUnit,
      participants,
      assignments,
      start_date: startDate,
      auto_rotate: autoRotate,
    };

    const { error } = await supabase.from("custom_schedules").insert([newSchedule]);

    if (error) {
      console.error("Insert error:", error);
      alert("Failed to save schedule");
    } else {
      alert("Schedule created!");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Create Your Schedule</h1>

      <label>Schedule Name</label>
      <input value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} />

      <label>Rotate By</label>
      <select value={rotationUnit} onChange={(e) => setRotationUnit(e.target.value)}>
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>

      <label>Participants (comma separated)</label>
      <input value={participants} onChange={(e) => setParticipants(e.target.value)} />

      <label>Assignments (comma separated)</label>
      <input value={assignments} onChange={(e) => setAssignments(e.target.value)} />

      <label>Start Date</label>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

      <label>Auto-Rotate?</label>
      <input type="checkbox" checked={autoRotate} onChange={() => setAutoRotate(!autoRotate)} />

      <button onClick={handleCreateSchedule} style={{ marginTop: "1rem" }}>
        Create Schedule
      </button>
    </div>
  );
}
