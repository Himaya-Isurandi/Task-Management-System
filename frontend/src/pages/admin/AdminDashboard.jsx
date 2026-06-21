import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import api from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { 
  Users, 
  ShieldAlert, 
  Briefcase, 
  UserCheck, 
  UserX, 
  UserRoundCheck,
  TrendingUp
} from 'lucide-react';

export default function AdminDashboard() {
  const [projectFilter, setProjectFilter] = useState('all'); // 'all', 'completed', 'active'
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/users')
      ]);
      setProjects(projectsRes.data.projects || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWsMessage = useCallback((msg) => {
    if (['task_assigned', 'status_changed', 'admin_update'].includes(msg.type)) {
      fetchData();
    }
  }, [fetchData]);

  useWebSocket(handleWsMessage);

  // Compute stats
  const filteredProjects = projects.filter(p => {
    if (projectFilter === 'completed') return p.progress === 100;
    if (projectFilter === 'active') return p.progress < 100 && p.progress > 0;
    return true;
  });

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.progress === 100).length;
  const averageProgress = totalProjects > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects) 
    : 0;

  // Donut chart math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (averageProgress / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* SECTION A: PROJECTS OVERVIEW (Full Width Card) */}
      <Card style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Projects Overview</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>System status of active deliverables and milestones</p>
          </div>

          {/* Pill style filter tabs */}
          <div className="tabs-header" style={{ marginBottom: 0 }}>
            <button 
              className={`tab-btn ${projectFilter === 'all' ? 'active' : ''}`}
              onClick={() => setProjectFilter('all')}
            >
              All ({projects.length})
            </button>
            <button 
              className={`tab-btn ${projectFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setProjectFilter('completed')}
            >
              Completed ({completedProjects})
            </button>
            <button 
              className={`tab-btn ${projectFilter === 'active' ? 'active' : ''}`}
              onClick={() => setProjectFilter('active')}
            >
              In Progress ({projects.filter(p => p.progress < 100 && p.progress > 0).length})
            </button>
          </div>
        </div>

        <div className="grid-2col" style={{ gridTemplateColumns: '1.3fr 0.7fr' }}>
          {/* Projects progress list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredProjects.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Badge type={p.progress === 100 ? 'success' : 'medium'}>
                      {p.status}
                    </Badge>
                    <Badge type={p.priority.toLowerCase() === 'high' ? 'danger' : 'medium'}>
                      {p.priority}
                    </Badge>
                  </div>
                </div>
                <ProgressBar value={p.progress} height="6px" />
              </div>
            ))}
          </div>

          {/* Overall completion Donut chart (Right side) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            borderLeft: '1px solid rgba(74, 144, 226, 0.15)',
            paddingLeft: '20px'
          }}>
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg width="150" height="150" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary-accent)" />
                    <stop offset="100%" stopColor="var(--secondary-accent)" />
                  </linearGradient>
                  <filter id="donut-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* Background Ring */}
                <circle 
                  cx="60" 
                  cy="60" 
                  r={radius} 
                  fill="transparent" 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="8" 
                />
                {/* Glowing Progress Arc */}
                <circle 
                  cx="60" 
                  cy="60" 
                  r={radius} 
                  fill="transparent" 
                  stroke="url(#chart-grad)" 
                  strokeWidth="8" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  filter="url(#donut-glow)"
                />
              </svg>
              {/* Centered percentage label */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {averageProgress}%
                </span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Completion
                </span>
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <TrendingUp size={14} style={{ color: 'var(--secondary-accent)' }} />
              <span>Overall progress across all initiatives</span>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION B: USER STATS (Grid of 6 stat cards) */}
      <div>
        <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px' }}>
          User Directory Intelligence
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          <StatCard 
            label="Total Users" 
            value={users.length.toString()} 
            icon={Users} 
            iconColor="#4A90E2" 
            trend="12% vs last month"
            trendType="up"
            sparklinePoints="0,15 10,12 20,18 30,10 40,8 50,5 60,2"
          />
          <StatCard 
            label="Admins" 
            value={users.filter(u => u.role === 'Admin').length.toString()} 
            icon={ShieldAlert} 
            iconColor="#c084fc" 
            trend="Constant"
            trendType="up"
            sparklinePoints="0,10 10,10 20,10 30,10 40,10 50,10 60,10"
          />
          <StatCard 
            label="Project Managers" 
            value={users.filter(u => u.role === 'Project Manager').length.toString()} 
            icon={Briefcase} 
            iconColor="#00D4FF" 
            trend="2 new this quarter"
            trendType="up"
            sparklinePoints="0,15 10,15 20,12 30,12 40,10 50,8 60,6"
          />
          <StatCard 
            label="Collaborators" 
            value={users.filter(u => u.role === 'Collaborator').length.toString()} 
            icon={Users} 
            iconColor="#10D9A0" 
            trend="8% increase"
            trendType="up"
            sparklinePoints="0,18 10,14 20,16 30,12 40,9 50,6 60,2"
          />
          <StatCard 
            label="Active Users" 
            value={users.filter(u => u.isActive).length.toString()} 
            icon={UserRoundCheck} 
            iconColor="#10D9A0" 
            trend="92% activity rate"
            trendType="active"
            sparklinePoints="0,15 10,13 20,10 30,14 40,8 50,6 60,4"
          />
          <StatCard 
            label="Inactive Users" 
            value={users.filter(u => !u.isActive).length.toString()} 
            icon={UserX} 
            iconColor="#FFB347" 
            trend="4% decrease"
            trendType="down"
            sparklinePoints="0,6 10,9 20,7 30,12 40,15 50,18 60,19"
          />
        </div>
      </div>

    </div>
  );
}
