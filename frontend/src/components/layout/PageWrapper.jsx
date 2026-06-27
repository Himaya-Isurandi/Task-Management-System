import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

export default function PageWrapper({ children, onSearch }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  // Standard mock notifications list that can be triggered/read
  const [notifications, setNotifications] = useState([
    { id: 'n1', message: '🚀 Welcome to TaskNova! Your role-based dashboard is active.', time: 'Just now', isRead: false },
    { id: 'n2', message: '⚠️ Project "Apollo Constellation" due date is approaching (2 days remaining).', time: '10m ago', isRead: false },
    { id: 'n3', message: '💬 Alex Rivera left a comment on task "Integrate WebSockets".', time: '1h ago', isRead: false }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const paddingLeft = sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)';

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex' }}>
      
      {/* Sidebar - fixed left */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area - shifts based on sidebar collapse */}
      <div 
        className="app-content-wrapper" 
        style={{ 
          flex: 1, 
          paddingLeft: paddingLeft, 
          transition: 'padding-left var(--transition-normal)',
          minWidth: 0 // Prevents grid overflow issues
        }}
      >
        {/* Navbar */}
        <Navbar 
          onSearchChange={onSearch} 
          notificationCount={unreadCount} 
          notifications={notifications.filter(n => !n.isRead)} 
          onMarkAllRead={handleMarkAllRead} 
        />

        {/* Dynamic Page Content */}
        <main className="app-page-main">
          {children}
        </main>
      </div>
    </div>
  );
}
