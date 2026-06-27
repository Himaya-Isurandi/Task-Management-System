import React from 'react';

export default function Badge({ type = '', children, className = '' }) {
  let badgeClass = 'badge ';

  switch (type.toLowerCase()) {
    case 'high':
    case 'priority-high':
    case 'danger':
      badgeClass += 'badge-high';
      break;
    case 'medium':
    case 'priority-medium':
    case 'warning':
      badgeClass += 'badge-medium';
      break;
    case 'low':
    case 'priority-low':
    case 'success':
      badgeClass += 'badge-low';
      break;
    case 'admin':
      badgeClass += 'badge-role-admin';
      break;
    case 'project manager':
    case 'manager':
      badgeClass += 'badge-role-manager';
      break;
    case 'collaborator':
    case 'collab':
      badgeClass += 'badge-role-collab';
      break;
    case 'active':
      return (
        <span className={`badge badge-status-active ${className}`}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', marginRight: '6px' }}></span>
          {children || 'Active'}
        </span>
      );
    case 'inactive':
      return (
        <span className={`badge badge-status-inactive ${className}`}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--danger)', display: 'inline-block', marginRight: '6px' }}></span>
          {children || 'Inactive'}
        </span>
      );
    default:
      // Custom stage badges or default pill
      badgeClass += 'badge-low';
      break;
  }

  return (
    <span className={`${badgeClass} ${className}`}>
      {children}
    </span>
  );
}
