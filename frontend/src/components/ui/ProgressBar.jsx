import React from 'react';

export default function ProgressBar({ value = 0, className = '', height = '8px' }) {
  const roundedValue = Math.min(Math.max(Math.round(value), 0), 100);

  return (
    <div className={`progress-wrapper ${className}`} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
        <span>Progress</span>
        <span>{roundedValue}%</span>
      </div>
      <div className="progress-bar-container" style={{ height }}>
        <div 
          className="progress-bar-fill" 
          style={{ width: `${roundedValue}%` }}
        />
      </div>
    </div>
  );
}
