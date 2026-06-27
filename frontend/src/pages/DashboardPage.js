import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import useWebSocket from '../hooks/useWebSocket';
import { sanitizeNotificationMessage } from '../utils/notificationText';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });

  const loadTasks = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      const { data } = await api.get('/api/tasks', { params });
      setTasks(data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Real-time: refresh tasks when a WS event arrives
  const handleWsMessage = useCallback((msg) => {
    if (['task_assigned', 'status_changed'].includes(msg.type)) {
      loadTasks();
      toast.info(sanitizeNotificationMessage(msg.notification?.message || 'Task updated'));
    }
  }, [loadTasks]);

  useWebSocket(handleWsMessage);

  const statusColor = (s) => ({ 'To Do': '#6366f1', 'In Progress': '#f59e0b', 'Completed': '#10b981' }[s] || '#888');
  const priorityColor = (p) => ({ Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }[p] || '#888');

  const columns = ['To Do', 'In Progress', 'Completed'];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back, <strong>{user?.name}</strong> ({user?.role})</p>
      </div>

      {/* Filters */}
      <div className="filters">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option>To Do</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      {/* Kanban Board */}
      {loading ? <p>Loading tasks...</p> : (
        <div className="kanban-board">
          {columns.map(col => (
            <div key={col} className="kanban-column">
              <div className="kanban-col-header" style={{ borderTopColor: statusColor(col) }}>
                <span>{col}</span>
                <span className="badge">{tasks.filter(t => t.status === col).length}</span>
              </div>
              <div className="kanban-cards">
                {tasks.filter(t => t.status === col).map(task => (
                  <div key={task.id} className="kanban-card">
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description.slice(0, 80)}...</div>}
                    <div className="task-meta">
                      <span className="tag" style={{ background: priorityColor(task.priority) }}>
                        {task.priority}
                      </span>
                      {task.assignee && <span className="assignee">👤 {task.assignee.name}</span>}
                      {task.dueDate && <span className="due">📅 {task.dueDate}</span>}
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === col).length === 0 && (
                  <p className="empty-col">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
