import React from 'react';
import Card from './Card';

export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = '#4A90E2', 
  trend = '', 
  trendType = 'up', // 'up', 'down', 'active', 'inactive'
  sparklinePoints = '0,18 10,12 20,15 30,5 40,10 50,2 60,8' // default mini-trend points
}) {
  const isUp = trendType === 'up' || trendType === 'active';
  const strokeColor = isUp ? 'var(--success)' : 'var(--danger)';
  const glowId = `glow-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Card className="glass-card-interactive" hoverable style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {label}
        </span>
        {Icon && (
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: `${iconColor}20`, // low opacity bg
            border: `1px solid ${iconColor}40`,
            color: iconColor 
          }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
          {value}
        </h2>
        {trend && (
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            color: isUp ? 'var(--success)' : 'var(--danger)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {isUp ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>

      {/* Embedded glowing SVG sparkline */}
      <div style={{ width: '100%', height: '24px', marginTop: '8px' }}>
        <svg width="100%" height="100%" viewBox="0 0 70 20" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <defs>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={sparklinePoints}
            filter={`url(#${glowId})`}
          />
        </svg>
      </div>
    </Card>
  );
}
