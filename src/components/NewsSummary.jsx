import { useState } from "react";

const NewsSummary = ({ summary, region }) => {
  const [activeTab, setActiveTab] = useState("english");

  if (!summary) return null;

  // Fallbacks if data structure is unexpected
  const englishSummary = Array.isArray(summary.english) 
    ? summary.english 
    : [summary.english];
    
  const teluguSummary = Array.isArray(summary.telugu) 
    ? summary.telugu 
    : [summary.telugu];

  const currentSummary = activeTab === "english" ? englishSummary : teluguSummary;

  return (
    <div className="summary-container">
      <div className="summary-header">
        <div className="summary-header-left">
          <span className="summary-badge">AI Regional Overview</span>
          <h2>{region} District Summary</h2>
        </div>
        
        <div className="summary-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === "english" ? "active" : ""}`}
            onClick={() => setActiveTab("english")}
          >
            English
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "telugu" ? "active" : ""}`}
            onClick={() => setActiveTab("telugu")}
          >
            తెలుగు
          </button>
        </div>
      </div>
      
      <div className="summary-content">
        <ul className="news-card-bullets">
          {currentSummary.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NewsSummary;