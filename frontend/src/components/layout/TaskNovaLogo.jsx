import React from 'react';

export default function TaskNovaLogo({ size = 32, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.4))' }}>
        <defs>
          <linearGradient id="logo-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A90E2" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
        <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="#0A1628" stroke="url(#logo-grad-main)" strokeWidth="2.5" />
        <circle cx="20" cy="42" r="4" fill="#E8F4FD" />
        <circle cx="20" cy="22" r="3" fill="#E8F4FD" />
        <circle cx="32" cy="32" r="5" fill="#00D4FF" />
        <circle cx="44" cy="42" r="3" fill="#E8F4FD" />
        <circle cx="44" cy="22" r="4" fill="#E8F4FD" />
        <line x1="20" y1="42" x2="20" y2="22" stroke="url(#logo-grad-main)" strokeWidth="2" />
        <line x1="20" y1="22" x2="32" y2="32" stroke="url(#logo-grad-main)" strokeWidth="2" />
        <line x1="32" y1="32" x2="44" y2="42" stroke="url(#logo-grad-main)" strokeWidth="2" />
        <line x1="44" y1="42" x2="44" y2="22" stroke="url(#logo-grad-main)" strokeWidth="2" />
      </svg>
      {showText && (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '700' }}>
          <span style={{ color: '#ffffff' }}>Task</span>
          <span style={{ color: 'var(--secondary-accent)', textShadow: '0 0 10px rgba(0, 212, 255, 0.4)' }}>Nova</span>
        </span>
      )}
    </div>
  );
}
