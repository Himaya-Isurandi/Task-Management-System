import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { Bell, Search, User, Settings, LogOut, CheckCircle } from 'lucide-react';
import { sanitizeNotificationMessage } from '../../utils/notificationText';

export default function Navbar({ 
  onSearchChange,
  notificationCount = 3,
  notifications = [],
  onMarkAllRead
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/users')) return 'User Directory';
    if (path.startsWith('/projects')) return user?.role === 'Collaborator' ? 'My Assigned Projects' : 'Projects Directory';
    if (path.startsWith('/calendar')) return 'Calendar Timeline';
    if (path.startsWith('/notifications')) return 'Notification Hub';
    if (path.startsWith('/profile')) return 'Account Profile';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'TaskNova';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{
      height: 'var(--navbar-height)',
      background: 'rgba(10, 22, 40, 0.45)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--card-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Left Title */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
          {getPageTitle()}
        </h2>
      </div>

      {/* Center Search */}
      <div style={{ width: '320px', display: 'flex', alignItems: 'center' }}>
        <div className="input-field-prefixed" style={{ padding: '2px 0' }}>
          <span className="input-prefix" style={{ borderRight: 'none', display: 'flex', alignItems: 'center', padding: '0 8px 0 12px' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search projects, tasks, comments..." 
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '8px 10px' }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.2)',
              color: 'var(--text-primary)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--secondary-accent)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.2)'}
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="notif-badge" style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--secondary-accent)',
                color: '#0A1628',
                borderRadius: '50%',
                fontSize: '0.65rem',
                fontWeight: '800',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px var(--secondary-accent)'
              }}>
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '320px',
              background: '#0D1F3C',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '16px',
              zIndex: 50,
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(74, 144, 226, 0.15)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Recent Alerts</span>
                {notificationCount > 0 && onMarkAllRead && (
                  <button 
                    onClick={() => { onMarkAllRead(); setShowNotifications(false); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--secondary-accent)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <CheckCircle size={12} /> Mark all read
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    No unread notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        background: 'rgba(26, 58, 107, 0.3)', 
                        borderLeft: '3px solid var(--secondary-accent)',
                        fontSize: '0.75rem'
                      }}
                    >
                      <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '500' }}>{sanitizeNotificationMessage(n.message)}</p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{n.time}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ borderTop: '1px solid rgba(74, 144, 226, 0.15)', paddingTop: '10px', marginTop: '10px', textAlign: 'center' }}>
                <Link to="/notifications" onClick={() => setShowNotifications(false)} style={{ fontSize: '0.75rem', color: 'var(--primary-accent)', textDecoration: 'none', fontWeight: '600' }}>
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Trigger */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Avatar name={user?.name} size="md" glow />
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '180px',
              background: '#0D1F3C',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '6px',
              zIndex: 50,
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <Link 
                to="/profile" 
                onClick={() => setShowProfileDropdown(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '10px 12px', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                className="dropdown-link-hover"
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <User size={14} /> My Profile
              </Link>
              <Link 
                to="/settings" 
                onClick={() => setShowProfileDropdown(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '10px 12px', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Settings size={14} /> Settings
              </Link>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(74, 144, 226, 0.15)', margin: '4px 0' }} />
              <button 
                onClick={handleLogout}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '10px 12px', 
                  fontSize: '0.8rem', 
                  color: 'var(--danger)', 
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
