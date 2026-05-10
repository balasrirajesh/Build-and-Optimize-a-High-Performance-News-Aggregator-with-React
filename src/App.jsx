import React, { useState, useEffect } from 'react';
import _ from 'lodash'; // Anti-pattern: importing entire lodash library
import './App.css';
import ArticleItem from './ArticleItem';

// Unoptimized large image
import heroImage from './assets/hero.jpg';

function App() {
  const [articles, setArticles] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllStories = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const storyIds = await response.json();
        const stories = [];
        
        // Anti-pattern: sequential fetching in a loop causing network waterfall
        for (const id of storyIds.slice(0, 500)) {
          const storyResp = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          const storyData = await storyResp.json();
          if (storyData) {
            stories.push(storyData);
          }
        }
        setArticles(stories);
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

  // Anti-pattern: Expensive operation on every render due to lodash and rendering all items
  let displayedArticles = articles;

  if (filterQuery) {
    displayedArticles = _.filter(displayedArticles, article => 
      article.title && article.title.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }

  if (sortOrder !== 'none') {
    displayedArticles = _.orderBy(displayedArticles, ['score'], [sortOrder]);
  }

  return (
    <div className="App">
      <header className="header">
        <h1>HackerNews Aggregator</h1>
      </header>
      
      {/* Anti-pattern: Unoptimized image missing attributes */}
      <div className="hero-section">
        <img src={heroImage} alt="Hero" className="hero-image" data-testid="hero-image" />
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
        <p className="loading">Loading 500 articles... This will take a while.</p>
      ) : (
        <div className="article-list" data-testid="article-list">
          {/* Anti-pattern: Rendering 500 elements without virtualization */}
          {displayedArticles.map(article => (
            <ArticleItem key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
