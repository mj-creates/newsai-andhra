import { useState } from "react";

const districts = [
  "Anantapur", "Bapatla", "Chittoor", "East Godavari",
  "Eluru", "Guntur", "Kadapa", "Kakinada", "Konaseema",
  "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu",
  "Parvathipuram Manyam", "Prakasam", "Sri Balaji",
  "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam",
  "Vizianagaram", "West Godavari"
];

const RegionSearch = ({ onSearch, loading }) => {
  const [district, setDistrict] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (district) onSearch(district);
  };

  return (
    <div className="card">
      <h2>Search by District</h2>
      <p>Select an Andhra Pradesh district to fetch and summarize regional news feed.</p>
      <form onSubmit={handleSubmit}>
        <div className="search-row">
          <div className="select-wrapper">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={loading}
              aria-label="Select a district"
            >
              <option value="">Select a district...</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading || !district}>
            {loading ? "Fetching News..." : "Get News Feed"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegionSearch;