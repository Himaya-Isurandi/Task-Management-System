import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Calendar as CalendarIcon, Clock, Filter, ListCollapse } from 'lucide-react';

export default function CalendarPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pmFilter, setPmFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-06-20'); // Default to current date (Metadata)

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // June 2026 Calendar Mock Database
  const [events] = useState([
    { id: 'e1', date: '2026-06-10', type: 'task', title: 'Verify liquid fuel telemetry API', project: 'Apollo Launchpad Portal', priority: 'High', time: '14:00', manager: 'Sarah Jenkins' },
    { id: 'e2', date: '2026-06-15', type: 'task', title: 'Audit SSL cert expiration dates', project: 'Apollo Launchpad Portal', priority: 'High', time: '10:00', manager: 'Sarah Jenkins' },
    { id: 'e3', date: '2026-06-18', type: 'task', title: 'Write unit tests for dispatch routing', project: 'Hermes Logistics Engine', priority: 'High', time: '17:00', manager: 'Elena Rostova' },
    { id: 'e4', date: '2026-06-25', type: 'task', title: 'Stress test connection throttling', project: 'Apollo Launchpad Portal', priority: 'High', time: '12:00', manager: 'Sarah Jenkins' },
    { id: 'e5', date: '2026-06-25', type: 'project', title: 'Hermes Milestone Core Review', project: 'Hermes Logistics Engine', priority: 'Medium', time: '09:00', manager: 'Elena Rostova' },
    { id: 'e6', date: '2026-06-30', type: 'project', title: 'Apollo Project Launch Due Date', project: 'Apollo Launchpad Portal', priority: 'High', time: '23:59', manager: 'Sarah Jenkins' }
  ]);

  // Calendar dates generation helper (June 2026)
  // June 2026 starts on a Monday (1) and has 30 days.
  // We will build an array representing the 5-week grid.
  const calendarDays = [
    // Previous Month padding (May 31 - Sun)
    { dateStr: '2026-05-31', dayNum: 31, isCurrentMonth: false },
    // June
    ...Array.from({ length: 30 }).map((_, i) => {
      const day = i + 1;
      const dayStr = `2026-06-${day.toString().padStart(2, '0')}`;
      return {
        dateStr: dayStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dayStr === '2026-06-20' // Reference current local time: 2026-06-20
      };
    }),
    // Next Month padding (July 1 to July 4)
    { dateStr: '2026-07-01', dayNum: 1, isCurrentMonth: false },
    { dateStr: '2026-07-02', dayNum: 2, isCurrentMonth: false },
    { dateStr: '2026-07-03', dayNum: 3, isCurrentMonth: false },
    { dateStr: '2026-07-04', dayNum: 4, isCurrentMonth: false }
  ];

  // Filtering Events
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPM = pmFilter ? e.manager === pmFilter : true;
    const matchesPriority = priorityFilter ? e.priority === priorityFilter : true;
    return matchesSearch && matchesPM && matchesPriority;
  });

  const getEventsForDate = (dateStr) => {
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const handleCellClick = (dateStr) => {
    setSelectedDate(dateStr);
    const dateEvents = getEventsForDate(dateStr);
    if (dateEvents.length > 0) {
      // If single event, display detail popup
      if (dateEvents.length === 1) {
        setSelectedEvent(dateEvents[0]);
        setIsEventModalOpen(true);
      }
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
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Calendar Timeline</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Audit project and task deadlines on a monthly calendar grid</p>
      </div>

      {/* SEARCH / FILTERS */}
      <Card style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <SearchBar 
              placeholder="Search deadlines..." 
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
        </div>
      </Card>

      {/* CALENDAR BODY & SIDEBAR CONTAINER */}
      <div className="grid-2col" style={{ gridTemplateColumns: '1.4fr 0.6fr', alignItems: 'stretch' }}>
        
        {/* LEFT side: Month View Calendar */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Calendar header: Month selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              June 2026
            </h4>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="calendar-dot calendar-dot-project" style={{ display: 'inline-block' }} /> Project Milestones
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="calendar-dot calendar-dot-task" style={{ display: 'inline-block' }} /> Task Deadlines
              </span>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="calendar-grid">
            {weekdays.map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}

            {/* Calendar Cells */}
            {calendarDays.map((cell, index) => {
              const dayEvents = getEventsForDate(cell.dateStr);
              const isSelected = selectedDate === cell.dateStr;

              let cellStyle = {};
              if (isSelected) {
                cellStyle = { border: '2px solid var(--secondary-accent)', background: 'rgba(0, 212, 255, 0.08)' };
              }

              return (
                <div 
                  key={index} 
                  className={`calendar-cell ${!cell.isCurrentMonth ? 'inactive' : ''} ${cell.isToday ? 'today' : ''}`}
                  style={cellStyle}
                  onClick={() => handleCellClick(cell.dateStr)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span className="calendar-day-num" style={{ color: cell.isToday ? 'var(--secondary-accent)' : 'inherit' }}>
                      {cell.dayNum}
                    </span>
                    {cell.isToday && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', background: 'var(--secondary-accent)', color: '#0A1628' }}>
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Colored dot indicators */}
                  {dayEvents.length > 0 && (
                    <div className="calendar-dot-container">
                      {dayEvents.map(ev => (
                        <span 
                          key={ev.id} 
                          className={`calendar-dot ${ev.type === 'project' ? 'calendar-dot-project animate-pulse-cyan' : 'calendar-dot-task'}`}
                          title={`${ev.type.toUpperCase()}: ${ev.title}`}
                          style={{
                            boxShadow: ev.type === 'project' ? '0 0 6px var(--secondary-accent)' : '0 0 6px var(--warning)'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* RIGHT side: Sidebar Upcoming events panel */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListCollapse size={18} style={{ color: 'var(--secondary-accent)' }} />
              Deadlines for: {selectedDate.replace('2026-06-', 'June ')}
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Click calendar cells to inspect dates</p>
          </div>

          <div style={{
            height: '1px',
            background: 'rgba(74, 144, 226, 0.15)'
          }} />

          {/* Event items list for the selected date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {selectedDateEvents.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 10px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                border: '1px dashed rgba(74, 144, 226, 0.12)',
                borderRadius: '8px'
              }}>
                No deadlines scheduled for this date.
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
                    border: `1px solid ${ev.type === 'project' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(74, 144, 226, 0.2)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--secondary-accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = ev.type === 'project' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(74, 144, 226, 0.2)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      color: ev.type === 'project' ? 'var(--secondary-accent)' : 'var(--warning)',
                      letterSpacing: '0.04em'
                    }}>
                      {ev.type}
                    </span>
                    <Badge type={ev.priority}>{ev.priority}</Badge>
                  </div>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {ev.title}
                  </h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <span>Project: <strong>{ev.project}</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} />{ev.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{
            borderTop: '1px solid rgba(74, 144, 226, 0.15)',
            paddingTop: '16px'
          }}>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Full Month Calendar Agenda
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
              {filteredEvents.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                    <strong>June {e.date.split('-')[2]}</strong> — {e.title}
                  </span>
                  <span style={{ color: e.type === 'project' ? 'var(--secondary-accent)' : 'var(--warning)' }}>
                    {e.type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </Card>
      </div>

      {/* EVENT POPUP MODAL */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={selectedEvent?.type === 'project' ? 'Project Milestone Review' : 'Task Deadline Details'}
        width="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Event Name</span>
            <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedEvent?.title}</h4>
          </div>

          <div>
            <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Project Context</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedEvent?.project}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Event Date</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{selectedEvent?.date}</span>
            </div>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Due Time</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{selectedEvent?.time}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Priority Level</span>
              <Badge type={selectedEvent?.priority} style={{ alignSelf: 'flex-start' }}>{selectedEvent?.priority}</Badge>
            </div>
            <div>
              <span className="input-label" style={{ display: 'block', marginBottom: '2px' }}>Project Owner / PM</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{selectedEvent?.manager}</span>
            </div>
          </div>

          <Button 
            onClick={() => setIsEventModalOpen(false)} 
            variant="primary" 
            style={{ width: '100%', marginTop: '12px' }}
          >
            Acknowledge Deadline
          </Button>
        </div>
      </Modal>

    </div>
  );
}
