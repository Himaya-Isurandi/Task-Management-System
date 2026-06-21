import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import showToast from '../../components/ui/Toast';
import api from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import { Calendar, User, MessageSquare, Paperclip, Upload, Send } from 'lucide-react';

export default function MyProjectsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [pmFilter, setPmFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Comment Drawer states
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [newComment, setNewComment] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/api/projects');
      const mapped = (data.projects || []).map(proj => ({
        ...proj,
        tasks: (proj.tasks || []).map(t => ({
          ...t,
          comments: []
        }))
      }));
      setProjects(mapped);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
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

  // Filters logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPM = pmFilter ? p.manager === pmFilter : true;
    const matchesPriority = priorityFilter ? p.priority === priorityFilter : true;
    const matchesStage = stageFilter ? p.stage === stageFilter : true;
    return matchesSearch && matchesPM && matchesPriority && matchesStage;
  });

  // Inline status toggle handler
  const handleStatusChange = async (projectId, taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      showToast.success(`Status updated to "${newStatus}"`);
      fetchData();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Real file upload handler
  const handleFileUpload = async (taskId, taskTitle, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/api/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast.success(`Successfully uploaded "${file.name}" to task "${taskTitle}"!`);
      fetchData();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to upload attachment');
    }
  };

  const handleOpenComments = async (task) => {
    try {
      const { data } = await api.get(`/api/tasks/${task.id}`);
      const commentsMapped = (data.task.Comments || []).map(c => ({
        id: c.id,
        user: c.User ? c.User.name : 'Unknown',
        text: c.content,
        time: new Date(c.createdAt).toLocaleDateString() + ' ' + new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setActiveTask({
        ...data.task,
        comments: commentsMapped
      });
      setNewComment('');
      setIsCommentDrawerOpen(true);
    } catch (err) {
      showToast.error('Failed to load task comments');
    }
  };

  // Submit comment handler
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(`/api/tasks/${activeTask.id}/comments`, { content: newComment });
      showToast.success('Comment added!');
      setNewComment('');

      const { data } = await api.get(`/api/tasks/${activeTask.id}`);
      const commentsMapped = (data.task.Comments || []).map(c => ({
        id: c.id,
        user: c.User ? c.User.name : 'Unknown',
        text: c.content,
        time: new Date(c.createdAt).toLocaleDateString() + ' ' + new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setActiveTask({
        ...data.task,
        comments: commentsMapped
      });
      fetchData();
    } catch (err) {
      showToast.error('Failed to add comment');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {/* HEADER ROW */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>My Assigned Projects</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track milestones, upload deliverables, and collaborate on project boards</p>
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

      {/* PROJECT ASSIGNMENT LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {loading ? (
          <Card style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading projects...
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No assigned projects found matching filters.
          </Card>
        ) : (
          filteredProjects.map(proj => {
            const todoCount = proj.tasks.filter(t => t.status === 'To Do').length;
            const progressCount = proj.tasks.filter(t => t.status === 'In Progress').length;
            const completedCount = proj.tasks.filter(t => t.status === 'Completed').length;

            return (
              <Card key={proj.id} style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* PROJECT SUMMARY CARD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {proj.name}
                    </h4>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Manager: <strong>{proj.manager}</strong></span>
                      <span>Target Date: <strong>{proj.endDate}</strong></span>
                      <Badge type={proj.priority?.toLowerCase() === 'high' ? 'danger' : 'medium'}>{proj.priority}</Badge>
                    </div>
                  </div>

                  {/* Task counts badges row */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.2)' }}>
                      📋 To Do: {todoCount}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', color: '#fde68a', border: '1px solid rgba(245,158,11,0.2)' }}>
                      ⚡ In Progress: {progressCount}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0', border: '1px solid rgba(16,185,129,0.2)' }}>
                      ✅ Completed: {completedCount}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <ProgressBar value={proj.progress} height="8px" />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(74, 144, 226, 0.15)', margin: '10px 0' }} />

                {/* MY TASK MANAGEMENT SECTION */}
                <div>
                  <h5 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px' }}>
                    My Task Management
                  </h5>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Task Title</th>
                          <th>Due Date</th>
                          <th>Priority</th>
                          <th>Status Progress</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proj.tasks.map(task => (
                          <tr key={task.id}>
                            <td style={{ fontWeight: '600' }}>{task.title}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} />
                                <span>{task.dueDate}</span>
                              </div>
                            </td>
                            <td><Badge type={task.priority}>{task.priority}</Badge></td>
                            <td>
                              {/* Status update dropdown selector */}
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(proj.id, task.id, e.target.value)}
                                className="input-field"
                                style={{
                                  width: '140px',
                                  padding: '6px 10px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  borderColor: task.status === 'Completed' ? 'var(--success)' : task.status === 'In Progress' ? 'var(--warning)' : 'var(--card-border)',
                                  color: task.status === 'Completed' ? 'var(--success)' : task.status === 'In Progress' ? 'var(--warning)' : 'inherit'
                                }}
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>

                                {/* Comment button */}
                                <Button
                                  variant="secondary"
                                  onClick={() => handleOpenComments(task)}
                                  style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                                >
                                  <MessageSquare size={13} /> Comments
                                  {task.comments?.length > 0 && (
                                    <span style={{ background: 'var(--secondary-accent)', color: '#0A1628', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
                                      {task.comments.length}
                                    </span>
                                  )}
                                </Button>

                                {/* Attachment upload button */}
                                <label style={{
                                  background: 'rgba(74, 144, 226, 0.1)',
                                  border: '1px solid rgba(74, 144, 226, 0.2)',
                                  color: 'var(--primary-accent)',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}>
                                  <Upload size={13} /> Deliverable
                                  <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload(task.id, task.title, e)}
                                  />
                                </label>

                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </Card>
            );
          })
        )}
      </div>

      {/* COMMENTS SIDE DRAWER */}
      <Modal
        isOpen={isCommentDrawerOpen}
        onClose={() => setIsCommentDrawerOpen(false)}
        title={`Task Thread: ${activeTask?.title}`}
        variant="drawer"
        width="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Comments List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', paddingRight: '4px' }}>
            {(!activeTask?.comments || activeTask.comments.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No comments on this task yet. Type below to start the discussion!
              </div>
            ) : (
              activeTask.comments.map(c => {
                const isMe = c.user === user?.name;
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '12px',
                      borderRadius: '12px',
                      background: isMe ? 'rgba(0, 212, 255, 0.08)' : 'rgba(74, 144, 226, 0.05)',
                      border: `1px solid ${isMe ? 'rgba(0, 212, 255, 0.2)' : 'var(--card-border)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '20px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isMe ? 'var(--secondary-accent)' : 'var(--text-primary)' }}>
                        {c.user}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.time}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {c.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Comment Form input */}
          <form onSubmit={handleAddComment} style={{ borderTop: '1px solid rgba(74, 144, 226, 0.15)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type your message here..."
                className="input-field"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                required
              />
              <Button type="submit" variant="primary" style={{ padding: '10px 14px' }}>
                <Send size={15} />
              </Button>
            </div>
          </form>

        </div>
      </Modal>

    </div>
  );
}
