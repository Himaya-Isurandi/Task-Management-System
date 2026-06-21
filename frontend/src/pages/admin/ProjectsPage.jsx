import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import ProgressBar from '../../components/ui/ProgressBar';
import Avatar from '../../components/ui/Avatar';
import api from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { Calendar, User, ChevronDown, ChevronUp, CheckCircle, ClipboardList, Clock, Users as UsersIcon } from 'lucide-react';

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pmFilter, setPmFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Accordion open state map
  const [expandedProjects, setExpandedProjects] = useState({});

  // Tab state per project (To Do, In Progress, Completed, Team)
  const [projectTabs, setProjectTabs] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/api/projects');
      const mapped = (data.projects || []).map((proj, idx) => {
        // Expand the first project by default on first load
        if (idx === 0 && Object.keys(expandedProjects).length === 0) {
          setExpandedProjects({ [proj.id]: true });
        }
        return {
          ...proj,
          tasks: (proj.tasks || []).map(t => ({
            ...t,
            assignee: t.assignee ? t.assignee.name : '—'
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

  // Filtering Logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPM = pmFilter ? p.manager === pmFilter : true;
    const matchesPriority = priorityFilter ? p.priority === priorityFilter : true;
    const matchesStage = stageFilter ? p.stage === stageFilter : true;

    return matchesSearch && matchesPM && matchesPriority && matchesStage;
  });

  const toggleExpand = (id) => {
    setExpandedProjects(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTabChange = (projId, tab) => {
    setProjectTabs(prev => ({
      ...prev,
      [projId]: tab
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER ROW */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Projects Directory</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full access control and roadmap audit for administrators</p>
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

          {/* Project Manager Filter */}
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

          {/* Priority Filter */}
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

          {/* Stage Filter */}
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

          {/* Reset Filters */}
          {(searchQuery || pmFilter || priorityFilter || stageFilter) && (
            <Button 
              variant="text" 
              onClick={() => { setSearchQuery(''); setPmFilter(''); setPriorityFilter(''); setStageFilter(''); }}
              style={{ fontSize: '0.8rem', padding: '8px 12px' }}
            >
              Reset
            </Button>
          )}

        </div>
      </Card>

      {/* EXPANDABLE ACCORDION PROJECT LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredProjects.length === 0 ? (
          <Card style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No projects found matching the filter criteria.
          </Card>
        ) : (
          filteredProjects.map(proj => {
            const isExpanded = expandedProjects[proj.id];
            const activeTab = projectTabs[proj.id] || 'todo';

            // Filter tasks based on columns
            const todoTasks = proj.tasks.filter(t => t.status === 'To Do');
            const inProgressTasks = proj.tasks.filter(t => t.status === 'In Progress');
            const completedTasks = proj.tasks.filter(t => t.status === 'Completed');

            return (
              <Card key={proj.id} style={{ padding: '0', overflow: 'hidden' }}>
                
                {/* ACCORDION HEADER */}
                <div 
                  onClick={() => toggleExpand(proj.id)}
                  style={{ 
                    padding: '24px 30px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    background: 'rgba(26, 58, 107, 0.2)',
                    transition: 'background var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26, 58, 107, 0.35)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(26, 58, 107, 0.2)'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, marginRight: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{proj.name}</h4>
                      <Badge type={proj.priority.toLowerCase() === 'high' ? 'danger' : 'medium'}>{proj.priority}</Badge>
                      <Badge type={proj.stage === 'Completed' ? 'success' : 'medium'}>{proj.stage}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span>Manager: <strong>{proj.manager}</strong></span>
                      <span>Timeline: <strong>{proj.startDate}</strong> to <strong>{proj.endDate}</strong></span>
                    </div>
                  </div>

                  {/* Horizontal progress bar inside header */}
                  <div style={{ width: '220px', marginRight: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={proj.progress} height="6px" />
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* EXPANDED ACCORDION CONTENT */}
                {isExpanded && (
                  <div style={{ padding: '30px', borderTop: '1px solid rgba(74, 144, 226, 0.15)' }}>
                    
                    {/* ACCORDION SUB-TABS */}
                    <div className="tabs-header" style={{ marginBottom: '24px' }}>
                      <button 
                        className={`tab-btn ${activeTab === 'todo' ? 'active' : ''}`}
                        onClick={() => handleTabChange(proj.id, 'todo')}
                      >
                        To Do ({todoTasks.length})
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
                        onClick={() => handleTabChange(proj.id, 'progress')}
                      >
                        In Progress ({inProgressTasks.length})
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => handleTabChange(proj.id, 'completed')}
                      >
                        Completed ({completedTasks.length})
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                        onClick={() => handleTabChange(proj.id, 'team')}
                      >
                        Team Members ({proj.team.length})
                      </button>
                    </div>

                    {/* TAB VIEWS */}
                    {activeTab === 'todo' && (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Task ID</th>
                              <th>Title</th>
                              <th>Due Date</th>
                              <th>Priority</th>
                              <th>Assignee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todoTasks.length === 0 ? (
                              <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No To-Do tasks in this project.</td>
                              </tr>
                            ) : (
                              todoTasks.map(t => (
                                <tr key={t.id}>
                                  <td className="mono-font" style={{ color: 'var(--text-muted)' }}>#{t.id}</td>
                                  <td style={{ fontWeight: '500' }}>{t.title}</td>
                                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} />{t.dueDate}</div></td>
                                  <td><Badge type={t.priority}>{t.priority}</Badge></td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Avatar name={t.assignee} size="sm" />
                                      <span>{t.assignee}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === 'progress' && (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Task ID</th>
                              <th>Title</th>
                              <th>Due Date</th>
                              <th>Priority</th>
                              <th>Assignee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inProgressTasks.length === 0 ? (
                              <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No tasks currently in progress.</td>
                              </tr>
                            ) : (
                              inProgressTasks.map(t => (
                                <tr key={t.id}>
                                  <td className="mono-font" style={{ color: 'var(--text-muted)' }}>#{t.id}</td>
                                  <td style={{ fontWeight: '500' }}>{t.title}</td>
                                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} />{t.dueDate}</div></td>
                                  <td><Badge type={t.priority}>{t.priority}</Badge></td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Avatar name={t.assignee} size="sm" />
                                      <span>{t.assignee}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === 'completed' && (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Task ID</th>
                              <th>Title</th>
                              <th>Completion Date</th>
                              <th>Priority</th>
                              <th>Assignee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completedTasks.length === 0 ? (
                              <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No completed tasks.</td>
                              </tr>
                            ) : (
                              completedTasks.map(t => (
                                <tr key={t.id}>
                                  <td className="mono-font" style={{ color: 'var(--text-muted)' }}>#{t.id}</td>
                                  <td style={{ fontWeight: '500', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{t.title}</td>
                                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}><CheckCircle size={14} />{t.dueDate}</div></td>
                                  <td><Badge type={t.priority}>{t.priority}</Badge></td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Avatar name={t.assignee} size="sm" />
                                      <span>{t.assignee}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === 'team' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {proj.team.map(m => (
                          <div key={m.id} style={{ 
                            padding: '12px 16px', 
                            borderRadius: '10px', 
                            background: 'rgba(74, 144, 226, 0.05)', 
                            border: '1px solid var(--card-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <Avatar name={m.name} size="sm" glow={m.status === 'Active'} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{m.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
}
