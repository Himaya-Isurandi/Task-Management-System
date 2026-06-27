import React from 'react';

const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg, #4A90E2, #00D4FF)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg, #a855f7, #ec4899)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg, #10B981, #059669)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg, #ef4444, #b91c1c)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', text: '#ffffff' }
];

export default function Avatar({ 
  name = '', 
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  glow = false,
  className = '',
  onClick
}) {
  const getInitials = (n) => {
    if (!n) return 'U';
    return n.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  // Consistent color based on name hashing
  const getColorScheme = (n) => {
    if (!n) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  const scheme = getColorScheme(name);
  const initials = getInitials(name);

  let dimension = '36px';
  let fontSize = '0.85rem';

  if (size === 'sm') {
    dimension = '28px';
    fontSize = '0.75rem';
  } else if (size === 'lg') {
    dimension = '48px';
    fontSize = '1.1rem';
  } else if (size === 'xl') {
    dimension = '80px';
    fontSize = '1.8rem';
  }

  const avatarStyle = {
    width: dimension,
    height: dimension,
    borderRadius: '50%',
    background: scheme.bg,
    color: scheme.text,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
    cursor: onClick ? 'pointer' : 'default',
    border: '2px solid rgba(74, 144, 226, 0.4)',
    boxShadow: glow ? '0 0 12px rgba(0, 212, 255, 0.3)' : 'none',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  };

  return (
    <div 
      className={`avatar-circle ${className}`} 
      style={avatarStyle}
      onClick={onClick}
      title={name}
    >
      {initials}
    </div>
  );
}
