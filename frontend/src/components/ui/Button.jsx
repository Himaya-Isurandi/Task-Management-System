import React from 'react';

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  className = '',
  style = {},
  iconOnly = false
}) {
  let buttonClass = 'btn ';
  
  if (iconOnly) buttonClass += 'btn-icon ';

  switch (variant) {
    case 'primary':   buttonClass += 'btn-primary'; break;
    case 'secondary': buttonClass += 'btn-secondary'; break;
    case 'danger':    buttonClass += 'btn-danger'; break;
    case 'text':      buttonClass += 'btn-text'; break;
    default:          buttonClass += 'btn-primary'; break;
  }

  return (
    <button 
      type={type} 
      className={`${buttonClass} ${className}`} 
      onClick={onClick}
      disabled={disabled}
      style={{ ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}), ...style }}
    >
      {children}
    </button>
  );
}
