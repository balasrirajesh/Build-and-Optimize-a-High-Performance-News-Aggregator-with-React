import React, { memo } from 'react';


const dateFormatter = new Intl.DateTimeFormat('default', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
});

const ArticleItem = memo(({ article }) => {
  if (!article) return null;

  return (
    <div className="article-item" data-testid="article-item" style={{ height: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          {article.title}
        </a>
      </h3>
      <div className="article-meta" style={{ display: 'flex', gap: '15px', fontSize: '0.9em', color: '#666' }}>
        <span>Score: {article.score}</span>
        <span>By: {article.by}</span>
        
        <span>Time: {dateFormatter.format(new Date(article.time * 1000))}</span>
      </div>
    </div>
  );
});

ArticleItem.displayName = 'ArticleItem';

export default ArticleItem;
