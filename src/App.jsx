import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import filter from 'lodash/filter'; // Cherry-picked import
import orderBy from 'lodash/orderBy'; // Cherry-picked import
import { useVirtualizer } from '@tanstack/react-virtual';
import './App.css';

// Lazy load the ArticleItem component
const ArticleItem = React.lazy(() => import('./ArticleItem'));

import heroImage from './assets/hero.jpg';

function App() {
  const [articles, setArticles] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('none');
  const [loading, setLoading] = useState(true);

  // Reference for the scrolling container
  const parentRef = useRef(null);

  useEffect(() => {
    const fetchAllStories = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const storyIds = await response.json();
        
        // Optimization: Parallel network requests using Promise.all
        const fetches = storyIds.slice(0, 500).map(id => 
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
        );
        
        const stories = await Promise.all(fetches);
        // Filter out any null responses
        setArticles(stories.filter(Boolean));
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStories();
  }, []);

  const handleFilterChange = (e) => {
    setFilterQuery(e.target.value);
  };

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Optimization: Memoize the filtered and sorted list
  const displayedArticles = useMemo(() => {
    let result = articles;
    if (filterQuery) {
      result = filter(result, article => 
        article.title && article.title.toLowerCase().includes(filterQuery.toLowerCase())
      );
    }
    if (sortOrder !== 'none') {
      result = orderBy(result, ['score'], [sortOrder]);
    }
    return result;
  }, [articles, filterQuery, sortOrder]);

  // Optimization: Virtualization setup
  const virtualizer = useVirtualizer({
    count: displayedArticles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height of each item
    overscan: 5,
  });

  return (
    <div className="App">
      <header className="header">
        <h1>HackerNews Aggregator</h1>
      </header>
      
      {/* Optimization: Add explicit dimensions and srcset to hero image */}
      <div className="hero-section">
        <img 
          src={heroImage} 
          alt="News Hero" 
          className="hero-image" 
          data-testid="hero-image"
          width="1200"
          height="800"
          srcSet={`${heroImage} 1200w`}
          sizes="100vw"
          loading="eager" // Hero image should be eager, but off-screen images should be lazy
          fetchpriority="high"
        />
      </div>

      <div className="controls">
        <input 
          type="text" 
          placeholder="Filter by title..." 
          value={filterQuery} 
          onChange={handleFilterChange}
          className="filter-input"
        />
        <button onClick={handleSort} className="sort-button">
          Sort by Score ({sortOrder})
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading 500 articles in parallel...</p>
      ) : (
        <div 
          ref={parentRef} 
          className="article-list-container" 
          style={{ height: '600px', overflow: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}
        >
          <div 
            className="article-list" 
            data-testid="article-list"
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <Suspense fallback={<div>Loading component...</div>}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const article = displayedArticles[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <ArticleItem article={article} />
                  </div>
                );
              })}
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
