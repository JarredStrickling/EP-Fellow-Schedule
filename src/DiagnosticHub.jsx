import { useState, useEffect } from "react";
import { supabase } from "./App";

export default function DiagnosticHub() 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); 
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

  if (loading) return <div style={{ padding: "2rem", color: "white" }}>Loading Tracings...</div>;

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <h3 style={{ fontSize: "0.9rem", color: "#64748b", textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "1px" }}>
        EGM Training Gallery
      </h3>

      {/* 1. Image Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => { setSelectedItem(item); setShowExplanation(false); }}
            style={{ 
              aspectRatio: "1", 
              background: "#000", 
              borderRadius: "12px", 
              overflow: "hidden", 
              position: "relative",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
            }}
          >
            <img 
              src={item.image_url} 
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} 
              alt="EGM Tracing"
            />
            <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.65rem", color: "white", fontWeight: "bold" }}>
              {item.category}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Full-Screen Modal Overlay */}
      {selectedItem && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.96)", z_index: 2000, display: "flex", flexDirection: "column",
          backdropFilter: "blur(15px)"
        }}>
          {/* Close Button */}
          <button 
            onClick={() => setSelectedItem(null)}
            style={{ position: "absolute", top: "50px", right: "25px", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "44px", height: "44px", color: "white", zIndex: 2001, fontSize: "1.2rem", cursor: "pointer" }}
          >✕</button>

          {/* Main Content Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "auto", padding: "20px", marginTop: "60px" }}>
            
            {/* The Question/Context Text */}
            {selectedItem.question && (
              <div style={{ 
                color: "#e2e8f0", 
                marginBottom: "24px", 
                textAlign: "center", 
                maxWidth: "600px",
                fontSize: "1.1rem",
                fontWeight: "400",
                lineHeight: "1.5",
                padding: "0 10px"
              }}>
                {selectedItem.question}
              </div>
            )}

            <img 
              src={selectedItem.image_url} 
              style={{ maxWidth: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 20px 50px rgba(0,0,0,0.9)" }} 
            />
          </div>

          {/* Reveal Panel */}
          {/* Reveal Panel */}
          <div style={{ 
            background: "#111", padding: "30px", color: "white", 
            borderTopLeftRadius: "30px", borderTopRightRadius: "30px",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.8)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingBottom: "40px" // Extra space for thumb reach
          }}>
            {!showExplanation ? (
              <button 
                onClick={() => setShowExplanation(true)}
                style={{ width: "100%", padding: "18px", borderRadius: "14px", background: "#3b82f6", color: "white", fontWeight: "bold", fontSize: "1.1rem", border: "none", cursor: "pointer" }}
              >
                Reveal Diagnosis & Logic
              </button>
            ) : (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ color: "#3b82f6", margin: 0, fontSize: "1.4rem" }}>{selectedItem.correct_answer}</h2>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", border: "1px solid #334155", padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase" }}>{selectedItem.category}</span>
                </div>
                <p style={{ fontSize: "1.05rem", lineHeight: "1.6", color: "#cbd5e1", marginBottom: "24px", fontWeight: "300" }}>{selectedItem.rationale}</p>
                
                {/* NEW: Back Button inside the revealed state */}
                <button 
                  onClick={() => setSelectedItem(null)}
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    borderRadius: "10px", 
                    background: "rgba(255,255,255,0.05)", 
                    color: "#94a3b8", 
                    border: "1px solid #334155", 
                    fontWeight: "600",
                    cursor: "pointer" 
                  }}
                >
                  ← Back to Gallery
                </button>
              </div>
            )}
        </div>    


      {/* Basic FadeIn Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}