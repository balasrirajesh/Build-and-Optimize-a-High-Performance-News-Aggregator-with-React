import React, { useMemo } from 'react';

// Single DateTimeFormat instance created ONCE outside component
// (Optimization: avoids creating a new Intl object on every render)
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * ArticleItem - Optimized article card component.
 *
 * Optimizations applied:
 * 1. Wrapped in React.memo to prevent re-renders when props haven't changed
 * 2. Date formatting uses a single shared Intl.DateTimeFormat instance
 * 3. Expensive per-item date computation is memoized with useMemo
 */
const ArticleItem = React.memo(({ article }) => {
  if (!article) return null;

  // useMemo ensures this runs only when article.time changes, not on parent re-renders
  const formattedDate = useMemo(() => {
    if (!article.time) return 'Unknown';
    return dateFormatter.format(new Date(article.time * 1000));
  }, [article.time]);

  return (
    <div className="article-item" data-testid="article-item">
      <h3 className="article-title">
        <a
          href={article.url || `https://news.ycombinator.com/item?id=${article.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="article-link"
        >
          {article.title}
        </a>
      </h3>
      <div className="article-meta">
        <span className="meta-badge meta-badge--score" title="Score">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          {article.score ?? 0}
        </span>
        <span className="meta-badge" title="Author">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          {article.by ?? 'unknown'}
        </span>
        <span className="meta-badge meta-badge--time" title="Posted time">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z"/>
          </svg>
          {formattedDate}
        </span>
      </div>
    </div>
  );
});

ArticleItem.displayName = 'ArticleItem';

export default ArticleItem;
