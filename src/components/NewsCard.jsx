import { useMemo } from "react";

const getRelativeTime = (dateString) => {
  if (!dateString) {
    // Fallback relative time for presentation
    return "10m ago";
  }
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Safety check for future dates
    if (date > now) return "Just now";
    
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return "10m ago";
  }
};

const NewsCard = ({ article }) => {
  const relativeTime = useMemo(() => {
    return getRelativeTime(article.publishedAt);
  }, [article.publishedAt]);

  const category = article.category || "General";
  const sourceName = typeof article.source === "object" ? article.source.name : article.source;

  return (
    <div className="news-card">
      {/* Optional Card Image if provided (e.g. for custom uploads with images) */}
      {article.urlToImage && (
        <div className="news-card-img-wrapper">
          <img src={article.urlToImage} alt={article.title} />
        </div>
      )}
      
      <div className="news-card-content">
        {/* Card Meta Tag and Timestamp */}
        <div className="news-card-meta">
          <span className="news-card-tag">{category}</span>
          <span>{relativeTime}</span>
        </div>

        {/* Authoritative Headline */}
        <h3 className="news-card-headline">{article.title}</h3>

        {/* AI-Generated Bullet Summary */}
        <ul className="news-card-bullets">
          {Array.isArray(article.summary) && article.summary.length > 0 ? (
            article.summary.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))
          ) : (
            <li>{article.description || "No article description or summary was provided."}</li>
          )}
        </ul>

        {/* Card Footer with Source Info and Link */}
        <div className="news-card-footer">
          <span className="news-card-source">{sourceName || "Local News"}</span>
          {article.url && (
            <a 
              className="news-card-link" 
              href={article.url} 
              target="_blank" 
              rel="noreferrer"
            >
              Read Original Source ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;