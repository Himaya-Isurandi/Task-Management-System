import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Avatar from '../../components/ui/Avatar';
import showToast from '../../components/ui/Toast';
import api from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { 
  CheckSquare, 
  MessageSquare, 
  Paperclip, 
  FolderOpen,
  Calendar,
  Clock,
  TrendingUp,
  Inbox
} from 'lucide-react';

export default function CollabDashboard() {
  const [deadlineSearch, setDeadlineSearch] = useState('');
  const [deadlinePriority, setDeadlinePriority] = useState('');
  const [projects, setProjects] = useState([]);
  const [myDeadlines, setMyDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/tasks')
      ]);

      const backendProjects = projectsRes.data.projects || [];
      const backendTasks = tasksRes.data.tasks || [];

      // Compute deadlines
      const calculateDaysRemaining = (dueDateStr) => {
        const due = new Date(dueDateStr);
        due.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      };

      const incompleteTasks = backendTasks.filter(t => t.dueDate && t.status !== 'Completed');
      const deadlinesMapped = incompleteTasks.map(t => {
        const project = backendProjects.find(p => p.id === t.projectId);
        return {
          id: t.id,
          title: t.title,
          project: project ? project.name : 'No Project',
          dueDate: t.dueDate,
          priority: t.priority,
          daysRemaining: calculateDaysRemaining(t.dueDate)
        };
      });
      setMyDeadlines(deadlinesMapped);

      // Compute project participation
      const projectsMapped = backendProjects.map(proj => {
        const projectTasks = backendTasks.filter(t => t.projectId === proj.id);
        const todo = projectTasks.filter(t => t.status === 'To Do').length;
        const progressCount = projectTasks.filter(t => t.status === 'In Progress').length;
        const done = projectTasks.filter(t => t.status === 'Completed').length;
        const total = todo + progressCount + done;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

        return {
          id: proj.id,
          name: proj.name,
          role: 'Collaborator',
          progress,
          todo,
          progressCount,
          done
        };
      });

      setProjects(projectsMapped.filter(p => p.todo > 0 || p.progressCount > 0 || p.done > 0));
    } catch (err) {
      console.error('Failed to fetch collaborator dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWsMessage = useCallback((msg) => {
    if (['task_assigned', 'status_changed', 'comment_added'].includes(msg.type)) {
      fetchData();
    }
  }, [fetchData]);

  useWebSocket(handleWsMessage);

  const handleQuickAction = (actionName) => {
    showToast.info(`Action: "${actionName}". Simulating collaborator dashboard workflow.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* SECTION A: QUICK ACTIONS (4 Cards) */}
      <div>
        <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px' }}>
          Collaborator Quick Desk
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[
            { label: 'Update Status', icon: CheckSquare, desc: 'Drag tasks or select status inline' },
            { label: 'Add Comment', icon: MessageSquare, desc: 'Write replies to task notes' },
            { label: 'Upload Attachment', icon: Paperclip, desc: 'Add files or mock screenshots' },
            { label: 'View Project', icon: FolderOpen, desc: 'See roadmaps & active specialists' }
          ].map((act, index) => {
            const Icon = act.icon;
            return (
              <Card 
                key={index} 
                className="glass-card-interactive" 
                hoverable 
                onClick={() => handleQuickAction(act.label)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '24px', 
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(0, 212, 255, 0.1)', 
                  border: '1px solid var(--secondary-accent)',
                  color: 'var(--secondary-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  boxShadow: '0 0 10px rgba(0, 212, 255, 0.15)'
                }}>
                  <Icon size={20} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {act.label}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {act.desc}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION B: UPCOMING DEADLINES (SCOPED TO SELF) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700 }}>
            My Assigned Deadlines
          </h4>
          <div style={{ width: '400px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <SearchBar 
              placeholder="Search my tasks..." 
              value={deadlineSearch}
              onChange={(val) => setDeadlineSearch(val)}
            />
            <select 
              className="input-field" 
              style={{ width: '140px', padding: '10px 12px' }}
              value={deadlinePriority}
              onChange={(e) => setDeadlinePriority(e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Project</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Time Remaining</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeadlines.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      No assigned deadlines match your query.
                    </td>
                  </tr>
                ) : (
                  filteredDeadlines.map(d => {
                    const isOverdue = d.daysRemaining < 0;
                    return (
                      <tr 
                        key={d.id}
                        style={{
                          background: isOverdue ? 'rgba(255, 107, 107, 0.04)' : 'transparent',
                        }}
                      >
                        <td style={{ fontWeight: '600' }}>{d.title}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{d.project}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                            <Calendar size={14} />
                            {d.dueDate}
                          </div>
                        </td>
                        <td><Badge type={d.priority}>{d.priority}</Badge></td>
                        <td>
                          <span style={{ 
                            fontWeight: '700', 
                            color: isOverdue ? 'var(--danger)' : d.daysRemaining <= 5 ? 'var(--warning)' : 'var(--success)'
                          }}>
                            {isOverdue ? `Overdue by ${Math.abs(d.daysRemaining)} days` : `${d.daysRemaining} days left`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION C: PROJECT PARTICIPATION (Visual Cards Grid) */}
      <div>
        <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px' }}>
          My Active Assignments
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {projects.map(proj => {
            // Circular progress calculations
            const r = 24;
            const circ = 2 * Math.PI * r;
            const offset = circ - (proj.progress / 100) * circ;

            return (
              <Card key={proj.id} className="glass-card-interactive" hoverable style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                
                {/* Left side circular progress */}
                <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
                  <svg width="70" height="70" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="30" cy="30" r={r} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle cx="30" cy="30" r={r} fill="transparent" stroke="var(--secondary-accent)" strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px var(--secondary-accent))' }} />
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {proj.progress}%
                  </div>
                </div>

                {/* Right side stats details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {proj.name}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Role: <strong>{proj.role}</strong>
                  </span>
                  
                  {/* Task sub counters */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
                      To Do: <strong>{proj.todo}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                      In Progress: <strong>{proj.progressCount}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      Done: <strong>{proj.done}</strong>
                    </span>
                  </div>
                </div>

              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}
