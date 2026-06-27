import React from 'react';
import Badge from './Badge';
import { Calendar, User } from 'lucide-react';

const COLUMNS = ['To Do', 'In Progress', 'Completed'];

export default function KanbanBoard({ 
  tasks = [], 
  onStatusChange, 
  onTaskClick 
}) {
  
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onStatusChange) {
      onStatusChange(taskId, targetStatus);
    }
  };

  const getPriorityColor = (p) => {
    switch (p?.toLowerCase()) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="kanban-board-container">
      {COLUMNS.map(col => {
        const columnTasks = tasks.filter(t => t.status === col);
        
        return (
          <div 
            key={col} 
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="kanban-column-header">
              <div className="kanban-column-title">
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: col === 'To Do' ? '#6366f1' : col === 'In Progress' ? '#f59e0b' : '#10b981',
                  display: 'inline-block'
                }}></span>
                {col}
              </div>
              <span className="kanban-column-count">{columnTasks.length}</span>
            </div>

            <div className="kanban-cards-wrapper">
              {columnTasks.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100px', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)',
                  border: '1px dashed rgba(74, 144, 226, 0.15)',
                  borderRadius: '8px'
                }}>
                  Drop tasks here
                </div>
              ) : (
                columnTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="kanban-task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onTaskClick && onTaskClick(task)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div className="kanban-task-title">{task.title}</div>
                      <span 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: getPriorityColor(task.priority),
                          flexShrink: 0,
                          marginTop: '4px'
                        }}
                        title={`Priority: ${task.priority}`}
                      ></span>
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {task.description}
                      </p>
                    )}

                    <div className="kanban-task-meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>{task.dueDate || 'No due date'}</span>
                      </div>
                      
                      {task.assignee ? (
                        <div 
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                            border: '1px solid var(--primary-accent)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            color: 'var(--text-primary)'
                          }}
                          title={task.assignee.name}
                        >
                          {task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                          <User size={12} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
