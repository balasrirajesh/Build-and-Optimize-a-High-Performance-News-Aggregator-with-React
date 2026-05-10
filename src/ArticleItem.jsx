import React from 'react';

// Anti-pattern: Expensive date formatting calculation on every render without memoization
const formatDate = (timestamp) => {
  // Simulating an expensive operation
  let result = new Date(timestamp * 1000).toLocaleString();
  for (let i = 0; i < 10000; i++) {
    result = new Date(timestamp * 1000).toLocaleString();
  }
  return result;
};

const ArticleItem = ({ article }) => {
  if (!article) return null;

  return (
    <div className="article-item" data-testid="article-item">
      <h3>
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          {article.title}
        </a>
      </h3>
      <div className="article-meta">
        <span>Score: {article.score}</span>
        <span>By: {article.by}</span>
        <span>Time: {formatDate(article.time)}</span>
      </div>
    </div>
  );
};

export default ArticleItem;
