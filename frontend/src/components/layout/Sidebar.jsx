import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

// Inline TaskNova SVG logo
export function TaskNovaLogo({ size = 32, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.4))' }}>
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A90E2" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
        {/* Hexagon/Shield Base */}
        <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="#0A1628" stroke="url(#logo-grad)" strokeWidth="2.5" />
        {/* Constellation Nodes "N" */}
        <circle cx="20" cy="42" r="4" fill="#E8F4FD" />
        <circle cx="20" cy="22" r="3" fill="#E8F4FD" />
        <circle cx="32" cy="32" r="5" fill="#00D4FF" />
        <circle cx="44" cy="42" r="3" fill="#E8F4FD" />
        <circle cx="44" cy="22" r="4" fill="#E8F4FD" />
        {/* Connecting Lines */}
        <line x1="20" y1="42" x2="20" y2="22" stroke="url(#logo-grad)" strokeWidth="2" />
        <line x1="20" y1="22" x2="32" y2="32" stroke="url(#logo-grad)" strokeWidth="2" />
        <line x1="32" y1="32" x2="44" y2="42" stroke="url(#logo-grad)" strokeWidth="2" />
        <line x1="44" y1="42" x2="44" y2="22" stroke="url(#logo-grad)" strokeWidth="2" />
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


export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Sidebar navigation mapping per role
  const getNavLinks = () => {
    const role = user?.role || 'Collaborator';
    const baseLinks = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/projects', label: role === 'Collaborator' ? 'My Projects' : 'Projects', icon: Briefcase },
      { to: '/calendar', label: 'Tasks', icon: Calendar, roleRestrict: ['Project Manager', 'Collaborator'] },
      { to: '/users', label: 'Users', icon: Users, roleRestrict: ['Admin'] },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: Settings }
    ];

    return baseLinks.filter(link => {
      if (link.roleRestrict) {
        return link.roleRestrict.includes(role);
      }
      return true;
    });
  };

  const navLinks = getNavLinks();

  const sidebarWidth = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)';

  return (
    <aside 
      className="app-sidebar-fixed" 
      style={{
        width: sidebarWidth,
        background: 'rgba(26, 58, 107, 0.45)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        transition: 'width var(--transition-normal)'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-nav-link {
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '12px'};
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          padding: 12px 14px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary) !important;
          background: transparent;
          border-left: 3px solid transparent;
          transition: all var(--transition-fast);
          height: 48px; /* Consistent height for all sidebar buttons */
          box-sizing: border-box;
        }
        .sidebar-nav-link:hover {
          color: var(--secondary-accent) !important;
          background: rgba(0, 212, 255, 0.04);
        }
        .sidebar-nav-link.active {
          font-weight: 600;
          color: var(--secondary-accent) !important;
          background: rgba(0, 212, 255, 0.08);
          border-left: 3px solid var(--secondary-accent);
        }
        .sidebar-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        .sidebar-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}} />

      {/* Top Header */}
      <div>
        <div style={{ 
          height: 'var(--navbar-height)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid rgba(74, 144, 226, 0.15)'
        }}>
          <TaskNovaLogo showText={!collapsed} size={collapsed ? 36 : 30} />
          
          {!collapsed && (
            <button 
              onClick={() => setCollapsed(true)} 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navLinks.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className="sidebar-nav-link"
              >
                <span className="sidebar-icon-wrapper">
                  <Icon size={20} />
                </span>
                {!collapsed && <span className="sidebar-label">{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Area */}
      <div style={{ borderTop: '1px solid rgba(74, 144, 226, 0.15)' }}>
        {/* Collapse trigger for collapsed state */}
        {collapsed && (
          <button 
            onClick={() => setCollapsed(false)} 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '100%',
              padding: '12px 0',
              display: 'flex',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(74, 144, 226, 0.1)'
            }}
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div style={{ 
          padding: collapsed ? '15px 0' : '20px 15px', 
          display: 'flex', 
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center', 
          gap: '12px',
          justifyContent: collapsed ? 'center' : 'space-between'
        }}>
          {/* Avatar and name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <Avatar name={user?.name} size={collapsed ? 'sm' : 'md'} glow />
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: '0' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name || 'Anonymous'}
                </span>
                <Badge type={user?.role} style={{ padding: '1px 6px', fontSize: '0.65rem', alignSelf: 'flex-start', marginTop: '2px' }}>
                  {user?.role === 'Project Manager' ? 'Manager' : user?.role || 'User'}
                </Badge>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout} 
            title="Log Out"
            style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.2)',
              color: 'var(--danger)',
              cursor: 'pointer',
              padding: '0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
              height: '40px',
              width: '40px',
              flexShrink: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
