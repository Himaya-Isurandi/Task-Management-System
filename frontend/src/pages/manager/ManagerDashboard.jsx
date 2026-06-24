import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Modal from '../../components/ui/Modal';
import showToast from '../../components/ui/Toast';
import api from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { useQuickAction } from '../../hooks/useQuickAction';
import { 
  Users, 
  ShieldAlert, 
  Briefcase, 
  UserRoundCheck, 
  UserX,
  FolderPlus, 
  PlusCircle, 
  UserPlus, 
  FileSpreadsheet,
  TrendingUp,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function ManagerDashboard() {
  const [projectFilter, setProjectFilter] = useState('all');
  const [deadlineSearch, setDeadlineSearch] = useState('');
  const [deadlinePriority, setDeadlinePriority] = useState('');
  const [projects, setProjects] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick actions modal state
  const { activeModal, openModal, closeModal } = useQuickAction();

  // Tasks state for Assign Task select dropdown
  const [tasksList, setTasksList] = useState([]);

  // Create Task form state
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tProjId, setTProjId] = useState('');
  const [tAssigneeId, setTAssigneeId] = useState('');
  const [tPriority, setTPriority] = useState('Medium');
  const [tStatus, setTStatus] = useState('To Do');
  const [tDueDate, setTDueDate] = useState('');

  // Assign Task form state
  const [assignTaskId, setAssignTaskId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');

  // Create Project form state
  const [pName, setPName] = useState('');
  const [pPriority, setPPriority] = useState('Medium');
  const [pStatus, setPStatus] = useState('To Do');
  const [pDueDate, setPDueDate] = useState('');

  // Progress Report state
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, usersRes, tasksRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/users'),
        api.get('/api/tasks')
      ]);

      const backendProjects = projectsRes.data.projects || [];
      const backendUsers = usersRes.data.users || [];
      const backendTasks = tasksRes.data.tasks || [];

      setProjects(backendProjects);
      setUsers(backendUsers);

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
          daysRemaining: calculateDaysRemaining(t.dueDate),
          assignee: t.assignee ? t.assignee.name : 'Unassigned'
        };
      });
      setDeadlines(deadlinesMapped);
    } catch (err) {
      console.error('Failed to fetch manager dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWsMessage = useCallback((msg) => {
    if (['task_assigned', 'status_changed', 'comment_added', 'admin_update'].includes(msg.type)) {
      fetchData();
    }
  }, [fetchData]);

  useWebSocket(handleWsMessage);

  // Filter project overview
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

  // Donut values
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (averageProgress / 100) * circumference;

  // Filter deadlines list
  const filteredDeadlines = deadlines.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(deadlineSearch.toLowerCase()) || 
                          d.project.toLowerCase().includes(deadlineSearch.toLowerCase());
    const matchesPriority = deadlinePriority ? d.priority === deadlinePriority : true;
    return matchesSearch && matchesPriority;
  });

  const handleOpenModal = async (name) => {
    openModal(name);
    if (name === 'assignTask') {
      try {
        const { data } = await api.get('/api/tasks?limit=1000');
        setTasksList(data.tasks || []);
      } catch (err) {
        showToast.error('Failed to load tasks list');
      }
    } else if (name === 'progressReport') {
      setReportLoading(true);
      try {
        const [projRes, taskRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/tasks?limit=1000')
        ]);
        const prjs = projRes.data.projects || [];
        const tsks = taskRes.data.tasks || [];
        
        const totalProjects = prjs.length;
        const activeProjects = prjs.filter(p => p.status === 'In Progress').length;
        const completedProjects = prjs.filter(p => p.status === 'Completed').length;
        
        const totalTasks = tsks.length;
        const todoTasks = tsks.filter(t => t.status === 'To Do').length;
        const progressTasks = tsks.filter(t => t.status === 'In Progress').length;
        const completedTasks = tsks.filter(t => t.status === 'Completed').length;
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const overdueTasks = tsks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'Completed').length;
        
        const projectBreakdown = prjs.map(p => {
          const projectTasks = tsks.filter(t => t.projectId === p.id);
          const total = projectTasks.length;
          const completed = projectTasks.filter(t => t.status === 'Completed').length;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          return {
            id: p.id,
            name: p.name,
            total,
            progress
          };
        });
        
        setReportData({
          totalProjects, activeProjects, completedProjects,
          totalTasks, todoTasks, progressTasks, completedTasks,
          overdueTasks, projectBreakdown
        });
      } catch (err) {
        showToast.error('Failed to load report data');
      } finally {
        setReportLoading(false);
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!tTitle || !tProjId || !tDueDate) {
      showToast.error('Task Title, Project, and Due Date are required');
      return;
    }
    try {
      const payload = {
        title: tTitle,
        description: tDesc,
        projectId: parseInt(tProjId),
        priority: tPriority,
        status: tStatus,
        dueDate: tDueDate
      };
      if (tAssigneeId) {
        payload.assignedTo = parseInt(tAssigneeId);
      }
      await api.post('/api/tasks', payload);
      showToast.success('Task created successfully');
      setTTitle('');
      setTDesc('');
      setTProjId('');
      setTAssigneeId('');
      setTPriority('Medium');
      setTStatus('To Do');
      setTDueDate('');
      closeModal();
      fetchData();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!assignTaskId || !assignUserId) {
      showToast.error('Please select both a Task and a User');
      return;
    }
    try {
      const userObj = users.find(u => u.id === parseInt(assignUserId));
      await api.put(`/api/tasks/${assignTaskId}`, {
        assignedTo: parseInt(assignUserId)
      });
      showToast.success(`Task assigned to ${userObj ? userObj.name : 'user'}`);
      setAssignTaskId('');
      setAssignUserId('');
      closeModal();
      fetchData();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to assign task');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!pName || !pDueDate) {
      showToast.error('Project Name and Due Date are required');
      return;
    }
    try {
      await api.post('/api/projects', {
        name: pName,
        status: pStatus,
        priority: pPriority,
        startDate: new Date().toISOString().split('T')[0],
        endDate: pDueDate
      });
      showToast.success('Project created');
      setPName('');
      setPPriority('Medium');
      setPStatus('To Do');
      setPDueDate('');
      closeModal();
      fetchData();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* SECTION A: PROJECTS OVERVIEW (Same as Admin) */}
      <Card style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Projects Overview</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>System status of active deliverables and milestones</p>
          </div>

          <div className="tabs-header" style={{ marginBottom: 0 }}>
            <button className={`tab-btn ${projectFilter === 'all' ? 'active' : ''}`} onClick={() => setProjectFilter('all')}>
              All ({projects.length})
            </button>
            <button className={`tab-btn ${projectFilter === 'completed' ? 'active' : ''}`} onClick={() => setProjectFilter('completed')}>
              Completed ({completedProjects})
            </button>
            <button className={`tab-btn ${projectFilter === 'active' ? 'active' : ''}`} onClick={() => setProjectFilter('active')}>
              In Progress ({projects.filter(p => p.progress < 100 && p.progress > 0).length})
            </button>
          </div>
        </div>

        <div className="grid-2col" style={{ gridTemplateColumns: '1.3fr 0.7fr' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredProjects.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Badge type={p.progress === 100 ? 'success' : 'medium'}>{p.status}</Badge>
                    <Badge type={p.priority.toLowerCase() === 'high' ? 'danger' : 'medium'}>{p.priority}</Badge>
                  </div>
                </div>
                <ProgressBar value={p.progress} height="6px" />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(74, 144, 226, 0.15)', paddingLeft: '20px' }}>
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg width="150" height="150" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8" />
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="url(#chart-grad)" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 212, 255, 0.4))' }} />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{averageProgress}%</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600 }}>Completion</span>
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <TrendingUp size={14} style={{ color: 'var(--secondary-accent)' }} />
              <span>Overall progress across all initiatives</span>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION B: Same 6-card User Stats grid */}
      <div>
        <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px' }}>
          Team Operations Metrics
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          <StatCard label="Total Users" value={users.length.toString()} icon={Users} iconColor="#4A90E2" trend="12% vs last month" sparklinePoints="0,15 10,12 20,18 30,10 40,8 50,5 60,2" />
          <StatCard label="Admins" value={users.filter(u => u.role === 'Admin').length.toString()} icon={ShieldAlert} iconColor="#c084fc" trend="Constant" sparklinePoints="0,10 10,10 20,10 30,10 40,10 50,10 60,10" />
          <StatCard label="Project Managers" value={users.filter(u => u.role === 'Project Manager').length.toString()} icon={Briefcase} iconColor="#00D4FF" trend="2 new this quarter" sparklinePoints="0,15 10,15 20,12 30,12 40,10 50,8 60,6" />
          <StatCard label="Collaborators" value={users.filter(u => u.role === 'Collaborator').length.toString()} icon={Users} iconColor="#10D9A0" trend="8% increase" sparklinePoints="0,18 10,14 20,16 30,12 40,9 50,6 60,2" />
          <StatCard label="Active Users" value={users.filter(u => u.isActive).length.toString()} icon={UserRoundCheck} iconColor="#10D9A0" trend="92% activity rate" trendType="active" sparklinePoints="0,15 10,13 20,10 30,14 40,8 50,6 60,4" />
          <StatCard label="Inactive Users" value={users.filter(u => !u.isActive).length.toString()} icon={UserX} iconColor="#FFB347" trend="4% decrease" trendType="down" sparklinePoints="0,6 10,9 20,7 30,12 40,15 50,18 60,19" />
        </div>
      </div>

      {/* SECTION C: QUICK ACTIONS (4 Cards) */}
      <div>
        <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px' }}>
          Quick Actions Wizard
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { label: 'Create Project', icon: FolderPlus, desc: 'Setup new timeline & budget' },
            { label: 'Create Task', icon: PlusCircle, desc: 'Add deliverables to board' },
            { label: 'Assign Task', icon: UserPlus, desc: 'Delegate tasks to team member' },
            { label: 'Generate Report', icon: FileSpreadsheet, desc: 'Export milestone progress' }
          ].map((act, index) => {
            const Icon = act.icon;
            return (
              <Card 
                key={index} 
                className="glass-card-interactive" 
                hoverable 
                onClick={() => {
                  if (act.label === 'Create Project') openModal('createProject');
                  if (act.label === 'Create Task') openModal('createTask');
                  if (act.label === 'Assign Task') handleOpenModal('assignTask');
                  if (act.label === 'Generate Report') handleOpenModal('progressReport');
                }}
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
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(0, 212, 255, 0.1)', 
                  border: '1px solid var(--secondary-accent)',
                  color: 'var(--secondary-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  boxShadow: '0 0 10px rgba(0, 212, 255, 0.1)'
                }}>
                  <Icon size={24} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {act.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {act.desc}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION D: UPCOMING DEADLINES */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Upcoming Deadlines Checklist
          </h4>
          <div style={{ width: '480px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <SearchBar 
              placeholder="Search task or project..." 
              value={deadlineSearch}
              onChange={(val) => setDeadlineSearch(val)}
            />
            <select 
              className="input-field" 
              style={{ width: '150px', padding: '10px 12px' }}
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
                  <th>Project Initiative</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Time Remaining</th>
                  <th>Assigned Specialist</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeadlines.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      No deadline deliverables match your query.
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
                        <td style={{ fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isOverdue && <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />}
                            {d.title}
                          </div>
                        </td>
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
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar name={d.assignee} size="sm" />
                            <span>{d.assignee}</span>
                          </div>
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

      {/* MODAL 1: CREATE TASK */}
      <Modal isOpen={activeModal === 'createTask'} onClose={closeModal} title="Create New Task">
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <span className="input-label">Task Title *</span>
            <input className="input-field" value={tTitle} onChange={e => setTTitle(e.target.value)} required placeholder="e.g. Design Login UI" />
          </div>
          <div className="input-group">
            <span className="input-label">Description</span>
            <textarea className="input-field" rows={3} value={tDesc} onChange={e => setTDesc(e.target.value)} placeholder="Provide task requirements..." />
          </div>
          <div className="input-group">
            <span className="input-label">Associated Project *</span>
            <select className="input-field" value={tProjId} onChange={e => setTProjId(e.target.value)} required>
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">Assign To (Optional)</span>
            <select className="input-field" value={tAssigneeId} onChange={e => setTAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">Priority *</span>
            <select className="input-field" value={tPriority} onChange={e => setTPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">Status *</span>
            <select className="input-field" value={tStatus} onChange={e => setTStatus(e.target.value)}>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">Due Date *</span>
            <input className="input-field" type="date" min={new Date().toISOString().split('T')[0]} value={tDueDate} onChange={e => setTDueDate(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary">Create Task</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ASSIGN TASK */}
      <Modal isOpen={activeModal === 'assignTask'} onClose={closeModal} title="Assign Specialist to Task">
        <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <span className="input-label">Select Task *</span>
            <select className="input-field" value={assignTaskId} onChange={e => setAssignTaskId(e.target.value)} required>
              <option value="">Select Task</option>
              {tasksList.filter(t => t.status !== 'Completed').map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">Assign To *</span>
            <select className="input-field" value={assignUserId} onChange={e => setAssignUserId(e.target.value)} required>
              <option value="">Select Team Member</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary">Assign Task</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: NEW PROJECT */}
      <Modal isOpen={activeModal === 'createProject'} onClose={closeModal} title="Create New Project">
        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <span className="input-label">Project Name *</span>
            <input className="input-field" value={pName} onChange={e => setPName(e.target.value)} required placeholder="e.g. Apollo Website Redesign" />
          </div>
          <div className="input-group">
            <span className="input-label">Priority *</span>
            <select className="input-field" value={pPriority} onChange={e => setPPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">Status *</span>
            <select className="input-field" value={pStatus} onChange={e => setPStatus(e.target.value)}>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">Due Date *</span>
            <input className="input-field" type="date" min={new Date().toISOString().split('T')[0]} value={pDueDate} onChange={e => setPDueDate(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary">Create Project</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: PROGRESS REPORT */}
      <Modal isOpen={activeModal === 'progressReport'} onClose={closeModal} title="Manager Progress Report">
        {reportLoading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading report intelligence...</div>
        ) : reportData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
            
            {/* PROJECTS STATS */}
            <div>
              <h5 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.875rem' }}>Projects Performance</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{reportData.totalProjects}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Initiatives</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary-accent)' }}>{reportData.activeProjects}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Active Stage</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>{reportData.completedProjects}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Completed</div>
                </div>
              </div>
            </div>

            {/* TASKS METRICS */}
            <div>
              <h5 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.875rem' }}>Tasks Distribution</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{reportData.totalTasks}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Total Tasks</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>{reportData.todoTasks}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>To Do</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--secondary-accent)' }}>{reportData.progressTasks}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>In Progress</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>{reportData.completedTasks}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Completed</div>
                </div>
              </div>
            </div>

            {/* OVERDUE METRICS */}
            <div style={{ background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.15)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)' }}>Overdue Deliverables Checklist</span>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0 }}>Tasks requiring immediate management escalations</p>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>{reportData.overdueTasks}</span>
            </div>

            {/* PROJECT BREAKDOWN LIST */}
            <div>
              <h5 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', fontSize: '0.875rem' }}>Project Initiatives Progress</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reportData.projectBreakdown.map(p => (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{p.progress}% ({p.total} tasks)</span>
                    </div>
                    <ProgressBar value={p.progress} height="5px" />
                  </div>
                ))}
              </div>
            </div>

            <Button variant="secondary" onClick={closeModal} style={{ alignSelf: 'flex-end', marginTop: '10px' }}>Close Report</Button>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No report data.</div>
        )}
      </Modal>

    </div>
  );
}
