import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Calendar as CalendarIcon, Clock, ListCollapse } from 'lucide-react';

export default function CollabCalendarPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-06-20');

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Scoped Events: Only displays Alex Rivera's tasks
  const [events] = useState([
    { id: 'e1', date: '2026-06-15', type: 'task', title: 'Audit SSL cert expiration dates', project: 'Apollo Launchpad Portal', priority: 'High', time: '10:00', manager: 'Sarah Jenkins' },
    { id: 'e2', date: '2026-06-18', type: 'task', title: 'Implement JWT refresh token interceptors', project: 'Apollo Launchpad Portal', priority: 'Medium', time: '17:00', manager: 'Sarah Jenkins' },
    { id: 'e3', date: '2026-06-25', type: 'task', title: 'Stress test connection throttling', project: 'Apollo Launchpad Portal', priority: 'High', time: '12:00', manager: 'Sarah Jenkins' },
    { id: 'e4', date: '2026-07-28', type: 'task', title: 'Optimize Google Maps Geocoding calls', project: 'Hermes Logistics Engine', priority: 'Medium', time: '09:00', manager: 'Elena Rostova' }
  ]);

  // June 2026 Grid Dates
  const calendarDays = [
    { dateStr: '2026-05-31', dayNum: 31, isCurrentMonth: false },
    ...Array.from({ length: 30 }).map((_, i) => {
      const day = i + 1;
      const dayStr = `2026-06-${day.toString().padStart(2, '0')}`;
      return {
        dateStr: dayStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dayStr === '2026-06-20'
      };
    }),
    { dateStr: '2026-07-01', dayNum: 1, isCurrentMonth: false },
    { dateStr: '2026-07-02', dayNum: 2, isCurrentMonth: false },
    { dateStr: '2026-07-03', dayNum: 3, isCurrentMonth: false },
    { dateStr: '2026-07-04', dayNum: 4, isCurrentMonth: false }
  ];

  // Filters (no PM filter)
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter ? e.priority === priorityFilter : true;
    return matchesSearch && matchesPriority;
  });

  const getEventsForDate = (dateStr) => {
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const handleCellClick = (dateStr) => {
    setSelectedDate(dateStr);
    const dateEvents = getEventsForDate(dateStr);
    if (dateEvents.length === 1) {
      setSelectedEvent(dateEvents[0]);
      setIsEventModalOpen(true);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER TITLE */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>My Calendar Schedule</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View task schedules assigned specifically to you</p>
      </div>

      {/* FILTER BAR */}
      <Card style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <SearchBar 
              placeholder="Search my deadlines..." 
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
            />
          </div>
          <select 
            className="input-field" 
            style={{ width: '180px', padding: '10px 12px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </Card>

      {/* GRID LAYOUT */}
      <div className="grid-2col" style={{ gridTemplateColumns: '1.4fr 0.6fr', alignItems: 'stretch' }}>
        
        {/* Calendar Grid */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>June 2026</h4>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="calendar-dot calendar-dot-task" style={{ display: 'inline-block' }} /> My Deadlines
              </span>
            </div>
          </div>

          <div className="calendar-grid">
            {weekdays.map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}

            {calendarDays.map((cell, index) => {
              const dayEvents = getEventsForDate(cell.dateStr);
              const isSelected = selectedDate === cell.dateStr;

              return (
                <div 
                  key={index} 
                  className={`calendar-cell ${!cell.isCurrentMonth ? 'inactive' : ''} ${cell.isToday ? 'today' : ''}`}
                  style={isSelected ? { border: '2px solid var(--secondary-accent)', background: 'rgba(0, 212, 255, 0.08)' } : {}}
                  onClick={() => handleCellClick(cell.dateStr)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span className="calendar-day-num">{cell.dayNum}</span>
                    {cell.isToday && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', background: 'var(--secondary-accent)', color: '#0A1628' }}>TODAY</span>
                    )}
                  </div>

                  {dayEvents.length > 0 && (
                    <div className="calendar-dot-container">
                      {dayEvents.map(ev => (
                        <span 
                          key={ev.id} 
                          className="calendar-dot calendar-dot-task"
                          title={ev.title}
                          style={{ boxShadow: '0 0 6px var(--warning)' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sidebar Schedule */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListCollapse size={18} style={{ color: 'var(--secondary-accent)' }} />
              My Agenda: {selectedDate.replace('2026-06-', 'June ')}
            </h4>
          </div>

          <div style={{ height: '1px', background: 'rgba(74, 144, 226, 0.15)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {selectedDateEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px dashed rgba(74, 144, 226, 0.12)', borderRadius: '8px' }}>
                No task deadlines scheduled for you on this date.
              </div>
            ) : (
              selectedDateEvents.map(ev => (
                <div 
                  key={ev.id}
                  onClick={() => handleEventClick(ev)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(74, 144, 226, 0.05)',
                    border: '1px solid rgba(74, 144, 226, 0.2)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', letterSpacing: '0.04em' }}>Task</span>
                    <Badge type={ev.priority}>{ev.priority}</Badge>
                  </div>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{ev.title}</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <span>Project: <strong>{ev.project}</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} />{ev.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

      {/* MODAL */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="My Assigned Task Deadline"
        width="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Task Name</span>
            <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedEvent?.title}</h4>
          </div>

          <div>
            <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Project</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedEvent?.project}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Due Date</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{selectedEvent?.date}</span>
            </div>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Due Time</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{selectedEvent?.time}</span>
            </div>
          </div>

          <div>
            <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Project Manager / Reporter</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{selectedEvent?.manager}</span>
          </div>

          <Button onClick={() => setIsEventModalOpen(false)} variant="primary" style={{ width: '100%', marginTop: '12px' }}>
            Close Details
          </Button>
        </div>
      </Modal>

    </div>
  );
}
