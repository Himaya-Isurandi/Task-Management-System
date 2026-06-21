import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import ProgressBar from '../../components/ui/ProgressBar';
import Avatar from '../../components/ui/Avatar';
import KanbanBoard from '../../components/ui/KanbanBoard';
import Modal from '../../components/ui/Modal';
import showToast from '../../components/ui/Toast';
import api from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { Calendar, User, ChevronDown, ChevronUp, CheckCircle, ClipboardList, Target, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ManagerProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pmFilter, setPmFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Accordion expanded state mapping
  const [expandedProjects, setExpandedProjects] = useState({});

  // Main expanded sub-tabs state (tasks, team, performance)
  const [projectTabs, setProjectTabs] = useState({});

  // Tasks sub-filter (All, To Do, In Progress, Completed, Overdue)
  const [taskSubFilter, setTaskSubFilter] = useState('all');

  // Task Drawer states for detailed inspection
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/api/projects');
      const mapped = (data.projects || []).map((proj, idx) => {
        if (idx === 0 && Object.keys(expandedProjects).length === 0) {
          setExpandedProjects({ [proj.id]: true });
        }
        return {
          ...proj,
          tasks: (proj.tasks || []).map(t => ({
            ...t,
            assignee: t.assignee ? { name: t.assignee.name, role: t.assignee.role || 'Collaborator' } : null
          }))
        };
      });
      setProjects(mapped);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [expandedProjects]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleWsMessage = useCallback((msg) => {
    if (['task_assigned', 'status_changed', 'comment_added', 'admin_update'].includes(msg.type)) {
      fetchData();
    }
  }, [fetchData]);

  useWebSocket(handleWsMessage);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPM = pmFilter ? p.manager === pmFilter : true;
    const matchesPriority = priorityFilter ? p.priority === priorityFilter : true;
    const matchesStage = stageFilter ? p.stage === stageFilter : true;
    return matchesSearch && matchesPM && matchesPriority && matchesStage;
  });

  const toggleExpand = (id) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTabChange = (projId, tab) => {
    setProjectTabs(prev => ({ ...prev, [projId]: tab }));
  };

  // Drag-and-drop state modifier calling real backend API
  const handleKanbanStatusChange = async (projectId, taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      showToast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskDrawerOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER ROW */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Projects Sandbox</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Modify task positions, manage sprints, and analyze team stats</p>
      </div>

      {/* FILTER BAR */}
      <Card style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <SearchBar 
              placeholder="Search project name..." 
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
            />
          </div>
          <select 
            className="input-field" 
            style={{ width: '180px', padding: '10px 12px' }}
            value={pmFilter}
            onChange={(e) => setPmFilter(e.target.value)}
          >
            <option value="">All Managers</option>
            <option value="Sarah Jenkins">Sarah Jenkins</option>
            <option value="Elena Rostova">Elena Rostova</option>
          </select>
          <select 
            className="input-field" 
            style={{ width: '150px', padding: '10px 12px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select 
            className="input-field" 
            style={{ width: '160px', padding: '10px 12px' }}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">All Stages</option>
            <option value="Planning">Planning</option>
            <option value="Execution">Execution</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </Card>

      {/* PROJECT ACCORDIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredProjects.map(proj => {
          const isExpanded = expandedProjects[proj.id];
          const activeTab = projectTabs[proj.id] || 'tasks';

          // Sub-metrics computation
          const totalTasks = proj.tasks.length;
          const completedCount = proj.tasks.filter(t => t.status === 'Completed').length;
          const progressCount = proj.tasks.filter(t => t.status === 'In Progress').length;
          const todoCount = proj.tasks.filter(t => t.status === 'To Do').length;

          // Compute overdue tasks count based on custom due date checking
          const todayStr = '2026-06-20'; // Reference time from metadata
          const overdueCount = proj.tasks.filter(t => t.status !== 'Completed' && t.dueDate < todayStr).length;

          // Filter tasks according to sub-tab selection (All, To Do, In Progress, Completed, Overdue)
          const getFilteredTasksList = () => {
            if (taskSubFilter === 'todo') return proj.tasks.filter(t => t.status === 'To Do');
            if (taskSubFilter === 'progress') return proj.tasks.filter(t => t.status === 'In Progress');
            if (taskSubFilter === 'completed') return proj.tasks.filter(t => t.status === 'Completed');
            if (taskSubFilter === 'overdue') return proj.tasks.filter(t => t.status !== 'Completed' && t.dueDate < todayStr);
            return proj.tasks; // 'all'
          };

          return (
            <Card key={proj.id} style={{ padding: '0', overflow: 'hidden' }}>
              
              {/* HEADER CONTAINER */}
              <div 
                onClick={() => toggleExpand(proj.id)}
                style={{ 
                  padding: '24px 30px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  background: 'rgba(26, 58, 107, 0.2)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, marginRight: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{proj.name}</h4>
                    <Badge type={proj.priority.toLowerCase() === 'high' ? 'danger' : 'medium'}>{proj.priority}</Badge>
                    <Badge type={proj.stage === 'Completed' ? 'success' : 'medium'}>{proj.stage}</Badge>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Manager: <strong>{proj.manager}</strong></span>
                    <span>Timeline: <strong>{proj.startDate}</strong> to <strong>{proj.endDate}</strong></span>
                  </div>
                </div>

                <div style={{ width: '220px', marginRight: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ProgressBar value={proj.progress} height="6px" />
                </div>

                <div style={{ color: 'var(--text-secondary)' }}>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* ACCORDION CONTENT */}
              {isExpanded && (
                <div style={{ padding: '30px', borderTop: '1px solid rgba(74, 144, 226, 0.15)' }}>
                  
                  {/* EXPANDED MENU TABS */}
                  <div className="tabs-header" style={{ marginBottom: '24px' }}>
                    <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => handleTabChange(proj.id, 'tasks')}>
                      Tasks
                    </button>
                    <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => handleTabChange(proj.id, 'team')}>
                      Team Members
                    </button>
                    <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => handleTabChange(proj.id, 'performance')}>
                      Team Performance
                    </button>
                  </div>

                  {/* TAB CONTENT: TASKS KANBAN */}
                  {activeTab === 'tasks' && (
                    <div>
                      {/* STAT ROW */}
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <div onClick={() => setTaskSubFilter('all')} style={{ cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', background: taskSubFilter === 'all' ? 'rgba(74, 144, 226, 0.15)' : 'rgba(74, 144, 226, 0.04)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Tasks</span>
                          <span style={{ padding: '2px 8px', borderRadius: '99px', background: 'rgba(74,144,226,0.2)', fontSize: '0.8rem', fontWeight: 700 }}>{totalTasks}</span>
                        </div>
                        <div onClick={() => setTaskSubFilter('todo')} style={{ cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', background: taskSubFilter === 'todo' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(74, 144, 226, 0.04)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8' }}>To Do</span>
                          <span style={{ padding: '2px 8px', borderRadius: '99px', background: 'rgba(99, 102, 241, 0.3)', fontSize: '0.8rem', fontWeight: 700, color: '#c7d2fe' }}>{todoCount}</span>
                        </div>
                        <div onClick={() => setTaskSubFilter('progress')} style={{ cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', background: taskSubFilter === 'progress' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(74, 144, 226, 0.04)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)' }}>In Progress</span>
                          <span style={{ padding: '2px 8px', borderRadius: '99px', background: 'rgba(245, 158, 11, 0.3)', fontSize: '0.8rem', fontWeight: 700, color: '#fde68a' }}>{progressCount}</span>
                        </div>
                        <div onClick={() => setTaskSubFilter('completed')} style={{ cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', background: taskSubFilter === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(74, 144, 226, 0.04)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>Completed</span>
                          <span style={{ padding: '2px 8px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.3)', fontSize: '0.8rem', fontWeight: 700, color: '#a7f3d0' }}>{completedCount}</span>
                        </div>
                        <div onClick={() => setTaskSubFilter('overdue')} style={{ cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', background: taskSubFilter === 'overdue' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(74, 144, 226, 0.04)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger)' }}>Overdue</span>
                          <span style={{ padding: '2px 8px', borderRadius: '99px', background: 'rgba(255, 107, 107, 0.3)', fontSize: '0.8rem', fontWeight: 700, color: '#fecaca' }}>{overdueCount}</span>
                        </div>
                      </div>

                      {/* Render Interactive Kanban Board */}
                      <KanbanBoard 
                        tasks={getFilteredTasksList()}
                        onStatusChange={(taskId, status) => handleKanbanStatusChange(proj.id, taskId, status)}
                        onTaskClick={handleTaskClick}
                      />
                    </div>
                  )}

                  {/* TAB CONTENT: TEAM MEMBERS */}
                  {activeTab === 'team' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                      {proj.team.map(member => (
                        <Card key={member.id} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <Avatar name={member.name} size="lg" glow />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{member.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.role}</span>
                            <Badge type="low" style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: '4px', alignSelf: 'flex-start' }}>
                              {member.tasksAssigned} tasks assigned
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* TAB CONTENT: TEAM PERFORMANCE */}
                  {activeTab === 'performance' && (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Team Member</th>
                            <th>Tasks Assigned</th>
                            <th>Completed</th>
                            <th>In Progress</th>
                            <th>On-Time Rate</th>
                            <th style={{ width: '200px' }}>Productivity Ratio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proj.team.map(member => {
                            const completedPct = member.tasksAssigned > 0 
                              ? Math.round((member.completed / member.tasksAssigned) * 100) 
                              : 0;

                            return (
                              <tr key={member.id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Avatar name={member.name} size="sm" />
                                    <span style={{ fontWeight: 600 }}>{member.name}</span>
                                  </div>
                                </td>
                                <td className="mono-font">{member.tasksAssigned}</td>
                                <td className="mono-font" style={{ color: 'var(--success)' }}>{member.completed}</td>
                                <td className="mono-font" style={{ color: 'var(--warning)' }}>{member.inProgress}</td>
                                <td className="mono-font" style={{ fontWeight: 700, color: member.onTimePct >= 80 ? 'var(--success)' : member.onTimePct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                                  {member.onTimePct}%
                                </td>
                                <td>
                                  {/* Custom Inline Bar Chart using Vanilla CSS */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                      <div style={{ 
                                        height: '100%', 
                                        background: 'linear-gradient(90deg, var(--primary-accent), var(--secondary-accent))', 
                                        width: `${completedPct || 2}%`,
                                        borderRadius: '4px'
                                      }}></div>
                                    </div>
                                    <span className="mono-font" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      {completedPct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* TASK INSPECTION DRAWER */}
      <Modal
        isOpen={isTaskDrawerOpen}
        onClose={() => setIsTaskDrawerOpen(false)}
        title={selectedTask ? `Inspect: ${selectedTask.title}` : 'Task Details'}
        variant="drawer"
        width="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Task Title</span>
            <h4 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{selectedTask?.title}</h4>
          </div>

          <div>
            <span className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Description</span>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {selectedTask?.description || 'No description provided.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Status</span>
              <Badge type={selectedTask?.status === 'Completed' ? 'success' : 'medium'}>
                {selectedTask?.status}
              </Badge>
            </div>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Priority</span>
              <Badge type={selectedTask?.priority}>
                {selectedTask?.priority}
              </Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Due Date</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                <Calendar size={14} />
                <span>{selectedTask?.dueDate}</span>
              </div>
            </div>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Specialist Assigned</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar name={selectedTask?.assignee?.name} size="sm" />
                <span style={{ fontSize: '0.9rem' }}>{selectedTask?.assignee?.name}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(74, 144, 226, 0.15)', paddingTop: '20px', marginTop: '10px' }}>
            <span className="input-label" style={{ display: 'block', marginBottom: '12px' }}>Audit History Log</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div>• Task created by <strong>Sarah Jenkins</strong> on 2026-06-01</div>
              <div>• Assigned to specialist <strong>{selectedTask?.assignee?.name}</strong></div>
              <div>• Status modified to <strong>{selectedTask?.status}</strong></div>
            </div>
          </div>

          <Button 
            onClick={() => setIsTaskDrawerOpen(false)} 
            variant="secondary"
            style={{ width: '100%', marginTop: '20px' }}
          >
            Close Details
          </Button>
        </div>
      </Modal>

    </div>
  );
}
