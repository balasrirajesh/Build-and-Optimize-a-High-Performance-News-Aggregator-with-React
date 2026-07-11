import React, { useMemo } from 'react';
import './StatsPanel.css';

/**
 * StatsPanel - A lazily-loaded component for code splitting demonstration.
 * This component is loaded only when the user explicitly requests it,
 * reducing the initial JavaScript bundle size.
 */
const StatsPanel = ({ articles }) => {
  const stats = useMemo(() => {
    if (!articles || articles.length === 0) {
      return { total: 0, avgScore: 0, maxScore: 0, topAuthor: 'N/A', topDomain: 'N/A' };
    }

    const total = articles.length;
    const totalScore = articles.reduce((sum, a) => sum + (a.score || 0), 0);
    const avgScore = Math.round(totalScore / total);
    const maxScore = Math.max(...articles.map(a => a.score || 0));

    // Calculate top author by number of stories
    const authorCounts = {};
    articles.forEach(a => {
      if (a.by) authorCounts[a.by] = (authorCounts[a.by] || 0) + 1;
    });
    const topAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate top domain
    const domainCounts = {};
    articles.forEach(a => {
      if (a.url) {
        try {
          const domain = new URL(a.url).hostname.replace('www.', '');
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        } catch {}
      }
    });
    const topDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total, avgScore, maxScore, topAuthor, topDomain };
  }, [articles]);

  return (
    <div className="stats-panel" role="region" aria-label="Article statistics">
      <h2 className="stats-title">📊 Aggregated Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.total.toLocaleString()}</span>
          <span className="stat-label">Total Stories</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.avgScore.toLocaleString()}</span>
          <span className="stat-label">Avg. Score</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.maxScore.toLocaleString()}</span>
          <span className="stat-label">Top Score</span>
        </div>
        <div className="stat-card">
          <span className="stat-value stat-value--small">{stats.topAuthor}</span>
          <span className="stat-label">Most Active Author</span>
        </div>
        <div className="stat-card">
          <span className="stat-value stat-value--small">{stats.topDomain}</span>
          <span className="stat-label">Top Source</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
