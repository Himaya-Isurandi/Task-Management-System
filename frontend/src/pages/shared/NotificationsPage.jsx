import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import showToast from '../../components/ui/Toast';
import { sanitizeNotificationMessage } from '../../utils/notificationText';
import { 
  Bell, 
  Folder, 
  CheckSquare, 
  Cpu, 
  Check, 
  MailOpen, 
  Inbox, 
  Trash2 
} from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'projects', 'tasks', 'system'

  // Mock Notification logs
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'system', message: '🚀 Welcome to TaskNova! Your role-based dashboard has been provisioned successfully.', timestamp: '10 mins ago', project: 'Global', isRead: false },
    { id: 2, type: 'project', message: '⚠️ Project "Apollo Launchpad Portal" deadline is approaching. Review final telemetry tasks.', timestamp: '2 hours ago', project: 'Apollo Portal', isRead: false },
    { id: 3, type: 'task', message: '💬 Alex Rivera commented on: "Stress test connection throttling" - "I have set up the simulation script."', timestamp: '5 hours ago', project: 'Apollo Portal', isRead: false },
    { id: 4, type: 'task', message: '✅ James Carter completed task: "Set up automated backups on RDS".', timestamp: '1 day ago', project: 'Apollo Portal', isRead: true },
    { id: 5, type: 'project', message: '🚀 Project "Athena Core Microservices" stage changed to "Completed".', timestamp: '2 days ago', project: 'Athena Core', isRead: true },
    { id: 6, type: 'system', message: '🔑 Security Warning: New active login detected from Chrome Browser (Windows 11).', timestamp: '3 days ago', project: 'Security', isRead: true }
  ]);

  // Filter logic
  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'projects') return n.type === 'project';
    if (activeTab === 'tasks') return n.type === 'task';
    if (activeTab === 'system') return n.type === 'system';
    return true; // 'all'
  });

  const getIcon = (type) => {
    switch (type) {
      case 'project': return <Folder size={18} style={{ color: 'var(--secondary-accent)' }} />;
      case 'task': return <CheckSquare size={18} style={{ color: 'var(--warning)' }} />;
      case 'system': return <Cpu size={18} style={{ color: 'var(--primary-accent)' }} />;
      default: return <Bell size={18} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const handleMarkRead = (id) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        showToast.success("Notification marked as read.");
        return { ...n, isRead: true };
      }
      return n;
    }));
  };

  const handleMarkAllRead = () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) {
      showToast.info("All notifications are already read.");
      return;
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast.success("All notifications marked as read!");
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    showToast.success("Notifications feed cleared.");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Notification Hub</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Review security alerts, comment logs, and project milestones</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleMarkAllRead} variant="secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            <MailOpen size={14} /> Mark All Read
          </Button>
          {notifications.length > 0 && (
            <Button onClick={handleDeleteAll} variant="danger" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              <Trash2 size={14} /> Clear All
            </Button>
          )}
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="tabs-header" style={{ marginBottom: 0, alignSelf: 'flex-start' }}>
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: `Unread (${notifications.filter(n => !n.isRead).length})` },
          { id: 'projects', label: 'Projects' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'system', label: 'System' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* NOTIFICATION FEED */}
      <Card style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredNotifs.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            gap: '12px'
          }}>
            <Inbox size={42} style={{ color: 'var(--card-border)' }} />
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>No Alerts Found</span>
              <span style={{ fontSize: '0.75rem' }}>Your notification feed is currently empty.</span>
            </div>
          </div>
        ) : (
          filteredNotifs.map(n => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '12px',
                background: n.isRead ? 'rgba(255, 255, 255, 0.01)' : 'rgba(26, 58, 107, 0.25)',
                border: '1px solid var(--card-border)',
                borderLeft: n.isRead ? '3px solid transparent' : '3px solid var(--secondary-accent)',
                boxShadow: n.isRead ? 'none' : '0 4px 15px rgba(0, 212, 255, 0.05)',
                transition: 'all 0.2s',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Category Icon */}
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getIcon(n.type)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontWeight: n.isRead ? '400' : '600',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {sanitizeNotificationMessage(n.message)}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{n.timestamp}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--card-border)' }} />
                    <span style={{ color: 'var(--secondary-accent)', fontWeight: 600 }}>#{n.project}</span>
                  </div>
                </div>
              </div>

              {/* Single Mark Read Trigger */}
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  title="Mark as Read"
                  style={{
                    background: 'rgba(16, 217, 160, 0.1)',
                    border: '1px solid rgba(16, 217, 160, 0.2)',
                    color: 'var(--success)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--success)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 217, 160, 0.1)'; e.currentTarget.style.color = 'var(--success)'; }}
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </Card>

    </div>
  );
}
