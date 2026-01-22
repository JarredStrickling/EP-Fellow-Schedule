import { useState, useEffect } from "react";
import { supabase } from "./App";

export default function DiagnosticHub() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // For the "Zoom" view
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    const { data, error } = await supabase.from("diagnostic_cards").select("*");
    if (error) console.error(error);
    else setItems(data);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading Tracings...</div>;

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <h3 style={{ fontSize: "0.9rem", color: "#64748b", textTransform: "uppercase", marginBottom: "1rem" }}>
        EGM Training Gallery
      </h3>

      {/* 1. Image Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => { setSelectedItem(item); setShowExplanation(false); }}
            style={{ 
              aspectRatio: "1", 
              background: "#000", 
              borderRadius: "8px", 
              overflow: "hidden", 
              position: "relative",
              cursor: "pointer",
              border: "1px solid var(--card-shadow)"
            }}
          >
            <img 
              src={item.image_url} 
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} 
              alt="EGM Tracing"
            />
            <div style={{ position: "absolute", bottom: "5px", left: "5px", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.6rem", color: "white" }}>
              {item.category}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Full-Screen Modal Overlay */}
      {selectedItem && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "#000", zIndex: 2000, display: "flex", flexDirection: "column"
        }}>
          {/* Close Button */}
          <button 
            onClick={() => setSelectedItem(null)}
            style={{ position: "absolute", top: "40px", right: "20px", background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: "40px", height: "40px", color: "white", zIndex: 2001 }}
          >✕</button>

          {/* Main Image (Zoomable/Scrollable) */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: "10px" }}>
            <img 
              src={selectedItem.image_url} 
              style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} 
            />
          </div>

          {/* Reveal Panel */}
          <div style={{ 
            background: "#1a1a1a", padding: "20px", color: "white", 
            borderTopLeftRadius: "20px", borderTopRightRadius: "20px",
            boxShadow: "0 -5px 20px rgba(0,0,0,0.5)"
          }}>
            {!showExplanation ? (
              <button 
                onClick={() => setShowExplanation(true)}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#3b82f6", color: "white", fontWeight: "bold" }}
              >
                Reveal Diagnosis & Explanation
              </button>
            ) : (
              <div>
                <h2 style={{ color: "#3b82f6", margin: "0 0 10px 0" }}>{selectedItem.correct_answer}</h2>
                <p style={{ fontSize: "0.95rem", lineHeight: "1.4" }}>{selectedItem.rationale}</p>
                <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "#888" }}>
                  Category: {selectedItem.category}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}