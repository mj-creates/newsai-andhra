import { useState, useEffect, useCallback, useRef } from "react";
import LoginPage from "./components/LoginPage";
import RegionSearch from "./components/RegionSearch";
import NewsSummary from "./components/NewsSummary";
import NewsCard from "./components/NewsCard";
import RegionMap from "./components/RegionMap";
import SkeletonLoader from "./components/SkeletonLoader";
import Toast from "./components/Toast";
import { fetchNewsByRegion } from "./services/newsApi";
import { summarizeNews, summarizeCustomArticle } from "./services/geminiApi";
import { API_BASE_URL } from "./config";
import "./App.css";

const App = () => {
  // Session State
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("user"));
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  
  // Navigation: "district" or "custom"
  const [activeTab, setActiveTab] = useState("district");
  
  // District Mode States
  const [region, setRegion] = useState("");
  const [districtSummary, setDistrictSummary] = useState(null);
  const [districtArticles, setDistrictArticles] = useState([]);
  
  // Custom Mode States
  const [customInputTab, setCustomInputTab] = useState("link"); // "link" or "text"
  const [articleUrl, setArticleUrl] = useState("");
  const [articleText, setArticleText] = useState("");
  
  // Combined Feed of Summarized Articles
  const [summarizedFeed, setSummarizedFeed] = useState([]);
  
  // Cache to store news per district to bypass rate limits when switching fast
  const districtCacheRef = useRef({});
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Toast Notification State
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("user");
    showToast("Logged out successfully.", "info");
  };

  // District Search & Summary Batch call
  const handleDistrictSearch = useCallback(async (selectedRegion) => {
    setLoading(true);
    setError("");
    setDistrictSummary(null);
    setDistrictArticles([]);
    setSummarizedFeed([]); // Clear old feed immediately to avoid stale cards on error
    setRegion(selectedRegion);
    localStorage.setItem("preferredDistrict", selectedRegion);

    // Check frontend session cache first to prevent rate limiting
    if (districtCacheRef.current[selectedRegion]) {
      const cached = districtCacheRef.current[selectedRegion];
      setDistrictArticles(cached.articles);
      setDistrictSummary(cached.summary);
      setSummarizedFeed(cached.feed);
      setLoading(false);
      showToast(`Latest news for ${selectedRegion} loaded from cache.`, "success");
      return;
    }

    let fetchedArticles = [];
    try {
      fetchedArticles = await fetchNewsByRegion(selectedRegion);

      if (!fetchedArticles || fetchedArticles.length === 0) {
        const msg = "No news found for this region. Try a different one!";
        setError(msg);
        showToast(msg, "error");
        setLoading(false);
        return;
      }

      setDistrictArticles(fetchedArticles);
    } catch (fetchErr) {
      const errMsg = "Failed to retrieve local news feed from backend.";
      setError(errMsg);
      showToast(errMsg, "error");
      setLoading(false);
      return;
    }

    try {
      // Perform AI batch summary
      const batchResult = await summarizeNews(fetchedArticles, selectedRegion);
      
      const summaryData = batchResult.districtSummary || null;
      const feedData = batchResult.summarizedArticles || [];

      setDistrictSummary(summaryData);
      setSummarizedFeed(feedData);

      // Save to cache
      districtCacheRef.current[selectedRegion] = {
        articles: fetchedArticles,
        summary: summaryData,
        feed: feedData
      };

      showToast(`Latest news for ${selectedRegion} summarized successfully!`, "success");
    } catch (aiErr) {
      console.error("AI Summarization failed:", aiErr);
      showToast("AI Summarizer is currently busy. Displaying raw articles instead.", "info");
      
      // Fallback to displaying raw articles
      const rawArticles = fetchedArticles.slice(0, 8).map((art) => ({
        title: art.title,
        category: "News",
        summary: [art.description || "Read original source for full details."],
        source: art.source?.name || art.source || "Local News",
        url: art.url,
        publishedAt: art.publishedAt
      }));
      
      setSummarizedFeed(rawArticles);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load preferred district on login
  useEffect(() => {
    if (isLoggedIn && activeTab === "district") {
      const savedDistrict = localStorage.getItem("preferredDistrict") || "Guntur";
      setRegion(savedDistrict);
      handleDistrictSearch(savedDistrict);
    }
  }, [isLoggedIn, activeTab, handleDistrictSearch]);

  // Custom link or text summarizer call
  const handleCustomSummarize = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let textToSummarize = articleText;
      let sourceUrl = "";

      if (customInputTab === "link") {
        if (!articleUrl.trim()) {
          setError("Please provide a valid article link.");
          showToast("Invalid URL provided.", "error");
          setLoading(false);
          return;
        }

        sourceUrl = articleUrl;
        
        // Call backend scraping endpoint
        const scrapeResponse = await fetch(`${API_BASE_URL}/scrape`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: articleUrl })
        });

        if (!scrapeResponse.ok) {
          const errData = await scrapeResponse.json();
          throw new Error(errData.error || "Failed to scrape the webpage.");
        }

        const scrapeData = await scrapeResponse.json();
        textToSummarize = scrapeData.text;
      } else {
        if (!articleText.trim() || articleText.trim().length < 100) {
          const msg = "Please enter raw article text of at least 100 characters.";
          setError(msg);
          showToast(msg, "error");
          setLoading(false);
          return;
        }
      }

      const summaryResult = await summarizeCustomArticle(textToSummarize, sourceUrl);
      
      // Add new summary to the top of the feed
      setSummarizedFeed((prevFeed) => [summaryResult, ...prevFeed]);
      
      // Reset inputs
      setArticleUrl("");
      setArticleText("");
      showToast("Article summarized successfully!", "success");
    } catch (err) {
      setError(err.message || "Failed to generate AI summary.");
      showToast(err.message || "Failed to generate summary.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFeed = () => {
    setSummarizedFeed([]);
    showToast("Summarized feed cleared.", "info");
  };

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <>
      {/* Toast Alert Container */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: "", type: "success" })} 
      />

      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} showToast={showToast} />
      ) : (
        <div className="app-container">
          {/* Sticky Header Nav */}
          <nav className="navbar">
            <a href="/" className="navbar-brand" onClick={(e) => e.preventDefault()}>
              🌍 <span>News<span>AI Andhra</span></span>
            </a>
            
            <div className="navbar-actions">
              <span className="user-profile">
                Welcome, <span className="user-name">{user?.username}</span>
              </span>

              {/* Theme switcher */}
              <div className="theme-switch-wrapper">
                <label className="theme-switch" htmlFor="checkbox">
                  <input 
                    type="checkbox" 
                    id="checkbox" 
                    checked={theme === "dark"} 
                    onChange={toggleTheme}
                  />
                  <div className="slider">
                    <span className="slider-icon">☀️</span>
                    <span className="slider-icon">🌙</span>
                  </div>
                </label>
              </div>

              <button type="button" className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </nav>

          {/* Main Container */}
          <main className="dashboard-main">
            {/* Navigation Tabs */}
            <div className="console-tabs">
              <button
                type="button"
                className={`console-tab-btn ${activeTab === "district" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("district");
                  setError("");
                  setSummarizedFeed([]);
                }}
              >
                📍 District News Feed
              </button>
              <button
                type="button"
                className={`console-tab-btn ${activeTab === "custom" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("custom");
                  setError("");
                  setSummarizedFeed([]);
                }}
              >
                ⚡ Custom Link / Text
              </button>
            </div>

            {/* Dashboard Grid Layout */}
            <div className="dashboard-grid">
              
              {/* LEFT COLUMN: Controls Panel */}
              <div className="controls-sidebar">
                
                {activeTab === "district" ? (
                  <>
                    <RegionSearch onSearch={handleDistrictSearch} loading={loading} />
                    <RegionMap region={region} theme={theme} />
                  </>
                ) : (
                  <div className="card custom-input-panel">
                    <h2>AI Summarizer Console</h2>
                    <p>Paste an article link or raw text to get crisp, scannable summaries instantly.</p>
                    
                    <div className="input-tab-selectors">
                      <button
                        type="button"
                        className={`input-tab-btn ${customInputTab === "link" ? "active" : ""}`}
                        onClick={() => { setCustomInputTab("link"); setError(""); }}
                      >
                        Paste Link
                      </button>
                      <button
                        type="button"
                        className={`input-tab-btn ${customInputTab === "text" ? "active" : ""}`}
                        onClick={() => { setCustomInputTab("text"); setError(""); }}
                      >
                        Raw Text
                      </button>
                    </div>

                    <form onSubmit={handleCustomSummarize} className="search-row">
                      {customInputTab === "link" ? (
                        <div className="input-group">
                          <label htmlFor="url-input">Article URL</label>
                          <input
                            id="url-input"
                            type="url"
                            className="text-input"
                            placeholder="https://example.com/news-article"
                            value={articleUrl}
                            onChange={(e) => setArticleUrl(e.target.value)}
                            disabled={loading}
                            required
                          />
                        </div>
                      ) : (
                        <div className="input-group">
                          <label htmlFor="text-input-area">Article Content</label>
                          <textarea
                            id="text-input-area"
                            className="text-input textarea-input"
                            placeholder="Paste the raw text of the article here (minimum 100 characters)..."
                            value={articleText}
                            onChange={(e) => setArticleText(e.target.value)}
                            disabled={loading}
                            required
                          />
                        </div>
                      )}
                      
                      <button 
                        type="submit" 
                        className="summarize-action-btn"
                        disabled={loading || (customInputTab === "link" ? !articleUrl : !articleText)}
                      >
                        {loading ? (
                          <>
                            <div className="spinner"></div> Summarizing...
                          </>
                        ) : (
                          "Summarize Article"
                        )}
                      </button>
                    </form>
                  </div>
                )}
                
                {/* Error notifications */}
                {error && (
                  <div className="error-box">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Results / Feeds */}
              <div className="feed-stream">
                
                {/* Region Overview (only for district mode) */}
                {activeTab === "district" && districtSummary && (
                  <NewsSummary summary={districtSummary} region={region} />
                )}

                {/* Feed Header */}
                {summarizedFeed.length > 0 && (
                  <div className="feed-header">
                    <h3>Summarized Articles</h3>
                    <button type="button" className="clear-feed-btn" onClick={handleClearFeed}>
                      Clear Feed
                    </button>
                  </div>
                )}

                {/* Shimmer loading spinner / skeleton loader */}
                {loading ? (
                  <SkeletonLoader count={2} />
                ) : summarizedFeed.length > 0 ? (
                  <div className="news-grid">
                    {summarizedFeed.map((article, index) => (
                      <NewsCard key={index} article={article} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📰</div>
                    <h4>No articles summarized yet</h4>
                    <p>
                      {activeTab === "district" 
                        ? "Select a district on the left to pull and summarize the latest news." 
                        : "Paste a news URL or text and hit Summarize to populate your feed."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
          <footer className="app-footer">
            <p>Created by ~manasWINi MJ</p>
          </footer>
        </div>
      )}
    </>
  );
};

export default App;