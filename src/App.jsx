import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from 'react';
// Optimization: cherry-picked imports instead of full lodash
import orderBy from 'lodash/orderBy';
import filter from 'lodash/filter';
import { useVirtualizer } from '@tanstack/react-virtual';
import './App.css';
import ArticleItem from './ArticleItem';

// Optimization: React.lazy for code splitting
// StatsPanel is loaded on-demand into a separate JS chunk
const StatsPanel = lazy(() => import('./StatsPanel'));

const HN_API = 'https://hacker-news.firebaseio.com/v0';
const STORY_LIMIT = 500;
const ITEM_HEIGHT = 110; // px - fixed height for each article row (enables virtualization)

function App() {
  const [articles, setArticles] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('none');
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [error, setError] = useState(null);

  // Ref for the scrollable container used by the virtualizer
  const parentRef = React.useRef(null);

  useEffect(() => {
    const fetchAllStories = async () => {
      setLoading(true);
      setError(null);
      try {
        // Step 1: Fetch the list of top story IDs
        const response = await fetch(`${HN_API}/topstories.json`);
        const storyIds = await response.json();
        const ids = storyIds.slice(0, STORY_LIMIT);

        // Optimization: Parallel fetching with Promise.all
        // All 500 requests are fired concurrently instead of sequentially.
        // This dramatically reduces total data-fetching time from O(n) serial
        // round-trips to roughly the time of the single slowest request.
        const BATCH_SIZE = 50; // Fire in batches to avoid overwhelming the browser
        const stories = [];

        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batch = ids.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(id =>
            fetch(`${HN_API}/item/${id}.json`).then(r => r.json())
          );
          const batchResults = await Promise.all(batchPromises);
          stories.push(...batchResults.filter(Boolean));
          setLoadingProgress(Math.round(((i + BATCH_SIZE) / ids.length) * 100));
        }

        setArticles(stories);
      } catch (err) {
        console.error('Error fetching stories:', err);
        setError('Failed to load stories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStories();
  }, []);

  // Optimization: Memoized filter + sort computation
  // This only re-runs when the articles array, filterQuery, or sortOrder changes.
  // Previously this ran on EVERY render, causing expensive recomputation during
  // unrelated state updates.
  const displayedArticles = useMemo(() => {
    let result = articles;

    if (filterQuery.trim()) {
      const query = filterQuery.toLowerCase();
      result = filter(result, article =>
        article.title && article.title.toLowerCase().includes(query)
      );
    }

    if (sortOrder !== 'none') {
      result = orderBy(result, ['score'], [sortOrder]);
    }

    return result;
  }, [articles, filterQuery, sortOrder]);

  // Optimization: stable callback reference avoids re-renders of child components
  const handleFilterChange = useCallback((e) => {
    setFilterQuery(e.target.value);
  }, []);

  const handleSort = useCallback(() => {
    setSortOrder(prev => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  }, []);

  const handleToggleStats = useCallback(() => {
    setShowStats(prev => !prev);
  }, []);

  // Optimization: List Virtualization via @tanstack/react-virtual
  // Instead of rendering 500 DOM nodes, this only renders the ~10-15 items
  // currently visible in the viewport plus a small buffer.
  // This keeps DOM size small, reduces memory usage, and makes interactions
  // like filtering/sorting dramatically faster (better INP score).
  const rowVirtualizer = useVirtualizer({
    count: displayedArticles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5, // Render 5 extra items above and below the visible area
  });

  const sortLabel = sortOrder === 'none' ? 'Sort by Score' : sortOrder === 'desc' ? '↓ Score (High→Low)' : '↑ Score (Low→High)';

  return (
    <div className="App">
      {/* SEO-friendly heading */}
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <svg className="header-logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#ff6600"/>
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">Y</text>
            </svg>
            <h1 className="header-title">HackerPulse</h1>
          </div>
          <p className="header-subtitle">Top {STORY_LIMIT} stories from Hacker News, live</p>
        </div>
      </header>

      {/* Optimization: Hero image with width, height, and srcset attributes
          - width/height prevent CLS by reserving space before image loads
          - srcset lets the browser pick the most efficient resolution
          - fetchpriority="high" signals to browser this is the LCP element */}
      <div className="hero-section">
        <img
          src="/hero-optimized.png"
          srcSet="/hero-optimized.png 1600w, /hero-optimized.png 800w"
          sizes="(max-width: 768px) 100vw, 1200px"
          width="1600"
          height="500"
          alt="Abstract visualization of global news network connections"
          className="hero-image"
          data-testid="hero-image"
          fetchpriority="high"
        />
        <div className="hero-overlay">
          <p className="hero-tagline">Real-time aggregation. Zero noise.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="search-wrapper">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            id="filter-input"
            type="text"
            placeholder="Filter stories by title…"
            value={filterQuery}
            onChange={handleFilterChange}
            className="filter-input"
            aria-label="Filter stories by title"
          />
          {filterQuery && (
            <button
              className="clear-btn"
              onClick={() => setFilterQuery('')}
              aria-label="Clear filter"
            >×</button>
          )}
        </div>

        <button id="sort-button" onClick={handleSort} className="sort-button" aria-pressed={sortOrder !== 'none'}>
          {sortLabel}
        </button>

        <button id="stats-button" onClick={handleToggleStats} className="stats-toggle-button" aria-expanded={showStats}>
          {showStats ? 'Hide Stats' : '📊 Show Stats'}
        </button>
      </div>

      {/* Lazy-loaded StatsPanel for code splitting demonstration */}
      {showStats && (
        <Suspense fallback={<div className="stats-loading">Loading statistics…</div>}>
          <StatsPanel articles={articles} />
        </Suspense>
      )}

      {/* Article count badge */}
      {!loading && (
        <div className="results-bar">
          <span className="results-count">
            {displayedArticles.length.toLocaleString()} {displayedArticles.length === 1 ? 'story' : 'stories'}
            {filterQuery && ` matching "${filterQuery}"`}
          </span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" aria-label="Loading"></div>
          <p className="loading-text">
            Fetching top stories… {loadingProgress > 0 ? `${Math.min(loadingProgress, 100)}%` : ''}
          </p>
          <div className="progress-bar" role="progressbar" aria-valuenow={loadingProgress} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-fill" style={{ width: `${Math.min(loadingProgress, 100)}%` }}></div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-container" role="alert">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Virtualized article list */}
      {!loading && !error && (
        <div
          className="article-list-container"
          ref={parentRef}
          data-testid="article-list"
          style={{ height: '700px', overflowY: 'auto' }}
        >
          {/* The total height of all items — virtualizer stretches the inner container to the correct size
              so the scrollbar represents the full list length */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: '0 0 8px 0',
                  boxSizing: 'border-box',
                }}
              >
                <ArticleItem article={displayedArticles[virtualRow.index]} />
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Data sourced from the <a href="https://github.com/HackerNews/API" target="_blank" rel="noopener noreferrer">HackerNews Firebase API</a>. Built with React + Vite.</p>
      </footer>
    </div>
  );
}

export default App;
