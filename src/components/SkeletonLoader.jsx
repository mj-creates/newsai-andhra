const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-item skeleton-tag"></div>
      <div className="skeleton-item skeleton-headline"></div>
      <div className="skeleton-item skeleton-headline sub"></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div className="skeleton-item skeleton-bullet"></div>
        <div className="skeleton-item skeleton-bullet short"></div>
        <div className="skeleton-item skeleton-bullet"></div>
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-item skeleton-source"></div>
        <div className="skeleton-item skeleton-link"></div>
      </div>
    </div>
  );
};

const SkeletonLoader = ({ count = 3 }) => {
  return (
    <div className="news-grid">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
