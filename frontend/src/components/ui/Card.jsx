import React from 'react';

export default function Card({ children, className = '', hoverable = false, style = {}, onClick }) {
  const baseClass = hoverable ? 'glass-card glass-card-interactive' : 'glass-card';
  return (
    <div 
      className={`${baseClass} ${className}`} 
      style={style} 
      onClick={onClick}
    >
      {children}
    </div>
  );
}
