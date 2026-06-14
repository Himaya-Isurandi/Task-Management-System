/**
 * TaskMaster Pro - Manager Dashboard Script
 * Implements dynamic rendering of dashboard stats, lists, upcoming deadlines, team rankings,
 * mobile drawer toggle, and fully interactive Quick Action modals with simulated animations.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // INITIAL DUMMY DATA STATE
    // ==========================================
    let projects = [
        { name: "SaaS Platform Migration", percentage: 88, theme: "blue" },
        { name: "Mobile App Development", percentage: 45, theme: "purple" },
        { name: "SEO Strategy & Audit", percentage: 15, theme: "indigo" },
        { name: "Security Infrastructure", percentage: 95, theme: "green" },
        { name: "Marketing Website Update", percentage: 60, theme: "blue" }
    ];

    let tasks = [
        { id: 1, title: "Refactor API Gateway Router", assignee: "Jane D.", priority: "High", status: "In Progress", dueDate: "2026-06-18" },
        { id: 2, title: "Design Landing Page Mockups", assignee: "Sarah C.", priority: "Medium", status: "Completed", dueDate: "2026-06-14" },
        { id: 3, title: "Draft Security Audit Brief", assignee: "Alex M.", priority: "Low", status: "To Do", dueDate: "2026-06-22" },
        { id: 4, title: "Fix Database Migration Queries", assignee: "Mike K.", priority: "High", status: "Overdue", dueDate: "2026-06-11" },
        { id: 5, title: "QA Login Integration Route", assignee: "Jane D.", priority: "Medium", status: "In Progress", dueDate: "2026-06-16" }
    ];

    let deadlines = [
        { month: "Jun", day: "15", title: "Review Website Mockups", project: "Marketing Website Update", daysLeft: 1, criticality: "critical" },
        { month: "Jun", day: "18", title: "API Gateway Deploy", project: "SaaS Platform Migration", daysLeft: 4, criticality: "warn" },
        { month: "Jun", day: "22", title: "Audit Report Submission", project: "SEO Strategy & Audit", daysLeft: 8, criticality: "normal" }
    ];

    let teamMembers = [
        { name: "Jane Doe", role: "Backend Dev", completed: 12, pending: 3, initials: "JD", bgClass: "bg-1" },
        { name: "Mike Kowalski", role: "Database Architect", completed: 8, pending: 4, initials: "MK", bgClass: "bg-2" },
        { name: "Sarah Connor", role: "UI/UX Designer", completed: 14, pending: 2, initials: "SC", bgClass: "bg-3" },
        { name: "Alex Mercer", role: "Project Manager", completed: 20, pending: 1, initials: "AM", bgClass: "bg-4" }
    ];

    // ==========================================
    // DOM ELEMENT SELECTORS
    // ==========================================
    // Sidebar responsive toggle elements
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const logoutLink = document.getElementById('logout-link');

    // List rendering targets
    const projectListContainer = document.getElementById('project-progress-list');
    const recentTasksContainer = document.getElementById('recent-tasks-list');
    const upcomingDeadlinesContainer = document.getElementById('upcoming-deadlines-list');
    const teamPerformanceContainer = document.getElementById('team-performance-list');

    // Modal selectors
    const modalCreateProject = document.getElementById('modal-create-project');
    const modalCreateTask = document.getElementById('modal-create-task');
    const modalAssignTask = document.getElementById('modal-assign-task');
    const modalGenerateReport = document.getElementById('modal-generate-report');

    // Form element selectors
    const formCreateProject = document.getElementById('form-create-project');
    const formCreateTask = document.getElementById('form-create-task');
    const formAssignTask = document.getElementById('form-assign-task');

    // Quick Action button triggers
    const btnTriggerCreateProject = document.getElementById('action-btn-create-project');
    const btnTriggerCreateTask = document.getElementById('action-btn-create-task');
    const btnTriggerAssignTask = document.getElementById('action-btn-assign-task');
    const btnTriggerGenerateReport = document.getElementById('action-btn-generate-report');

    // Report generation variables
    const btnStartReport = document.getElementById('btn-start-report');
    const reportFormContent = document.getElementById('report-form-content');
    const reportGeneratingContent = document.getElementById('report-generating-content');
    const reportStatusText = document.getElementById('report-status-text');
    const reportFill = document.getElementById('report-fill');
    const reportFooterActions = document.getElementById('report-footer-actions');

    // Statistics selectors
    const statTotalProjects = document.getElementById('stat-total-projects');
    const statActiveProjects = document.getElementById('stat-active-projects');
    const statTotalTasks = document.getElementById('stat-total-tasks');
    const statCompletedTasks = document.getElementById('stat-completed-tasks');
    const statOverdueTasks = document.getElementById('stat-overdue-tasks');
    const statTeamMembers = document.getElementById('stat-team-members');

    // Name customizers
    const managerNameDisplay = document.getElementById('manager-name');
    const avatarInitialsDisplay = document.getElementById('avatar-initials');

    // ==========================================
    // INITIALIZATION & SESSION LOAD
    // ==========================================
    function init() {
        loadSessionUser();
        renderDashboard();
        setupEventListeners();
    }

    // Attempt to pull credentials from login session to show user profile details
    function loadSessionUser() {
        const loggedInEmail = localStorage.getItem('taskmaster_user_email') || 
                              sessionStorage.getItem('taskmaster_user_email');
        if (loggedInEmail) {
            const prefix = loggedInEmail.split('@')[0];
            const formattedName = prefix.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            // Extract initials
            const initialsMatches = formattedName.match(/\b\w/g) || [];
            const initials = ((initialsMatches.shift() || '') + (initialsMatches.pop() || '')).toUpperCase();
            
            if (managerNameDisplay) managerNameDisplay.textContent = formattedName;
            if (avatarInitialsDisplay && initials) avatarInitialsDisplay.textContent = initials;
        }
    }

    // ==========================================
    // RENDERING PIPELINES
    // ==========================================
    function renderDashboard() {
        renderProjects();
        renderTasks();
        renderDeadlines();
        renderTeam();
        calculateAndSetStats();
    }

    function renderProjects() {
        if (!projectListContainer) return;
        projectListContainer.innerHTML = projects.map(proj => `
            <div class="project-item">
                <div class="project-info">
                    <span class="project-name">${proj.name}</span>
                    <span class="project-percentage">${proj.percentage}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar ${proj.theme}" style="width: ${proj.percentage}%"></div>
                </div>
            </div>
        `).join('');

        // Also update Project Options in Task creation selectors
        const taskProjectSelect = document.getElementById('task-project');
        if (taskProjectSelect) {
            taskProjectSelect.innerHTML = projects.map(proj => `
                <option value="${proj.name}">${proj.name}</option>
            `).join('');
        }
    }

    function renderTasks() {
        if (!recentTasksContainer) return;
        recentTasksContainer.innerHTML = tasks.map(task => `
            <tr>
                <td class="task-title-cell">${task.title}</td>
                <td>
                    <div class="user-cell">
                        <span class="user-avatar-small">${task.assignee.substring(0,2)}</span>
                        <span>${task.assignee}</span>
                    </div>
                </td>
                <td><span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                <td><span class="badge status-${task.status.replace(/\s+/g, '').toLowerCase()}">${task.status}</span></td>
                <td style="color: var(--text-secondary); font-weight: 500;">${formatDateString(task.dueDate)}</td>
            </tr>
        `).join('');

        // Also populate Assign Task select options dropdown
        const assignSelectTask = document.getElementById('assign-select-task');
        if (assignSelectTask) {
            assignSelectTask.innerHTML = tasks.map(t => `
                <option value="${t.id}">${t.title} (${t.assignee})</option>
            `).join('');
        }
    }

    function renderDeadlines() {
        if (!upcomingDeadlinesContainer) return;
        upcomingDeadlinesContainer.innerHTML = deadlines.map(dl => `
            <div class="deadline-item">
                <div class="deadline-date-box">
                    <span class="deadline-month">${dl.month}</span>
                    <span class="deadline-day">${dl.day}</span>
                </div>
                <div class="deadline-info">
                    <div class="deadline-title">${dl.title}</div>
                    <div class="deadline-project">${dl.project}</div>
                </div>
                <span class="deadline-days-left ${dl.criticality}">
                    ${dl.daysLeft} ${dl.daysLeft === 1 ? 'day' : 'days'} left
                </span>
            </div>
        `).join('');
    }

    function renderTeam() {
        if (!teamPerformanceContainer) return;
        teamPerformanceContainer.innerHTML = teamMembers.map(member => `
            <div class="team-item">
                <div class="team-member-info">
                    <div class="team-member-avatar ${member.bgClass}">${member.initials}</div>
                    <div>
                        <div class="team-member-name">${member.name}</div>
                        <div class="team-member-role">${member.role}</div>
                    </div>
                </div>
                <div class="team-stats">
                    <div class="team-stat-item" style="margin-right: 12px;">
                        <span class="team-stat-val" style="color: #10B981;">${member.completed}</span>
                        <span class="team-stat-lbl">Done</span>
                    </div>
                    <div class="team-stat-item">
                        <span class="team-stat-val" style="color: var(--primary-purple);">${member.pending}</span>
                        <span class="team-stat-lbl">Work</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function calculateAndSetStats() {
        // Total Projects
        if (statTotalProjects) statTotalProjects.textContent = projects.length;
        
        // Active Projects (completed percentage < 100%)
        const activeProjects = projects.filter(p => p.percentage < 100).length;
        if (statActiveProjects) statActiveProjects.textContent = activeProjects;

        // Total Tasks
        if (statTotalTasks) statTotalTasks.textContent = tasks.length;

        // Completed Tasks
        const completed = tasks.filter(t => t.status === "Completed").length;
        if (statCompletedTasks) statCompletedTasks.textContent = completed;

        // Overdue Tasks
        const overdue = tasks.filter(t => t.status === "Overdue").length;
        if (statOverdueTasks) statOverdueTasks.textContent = overdue;

        // Team members
        if (statTeamMembers) statTeamMembers.textContent = teamMembers.length;
    }

    // ==========================================
    // EVENT LISTENERS & MODAL MANAGEMENT
    // ==========================================
    function setupEventListeners() {
        // Mobile Navigation Drawer toggling
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.add('active');
                sidebarOverlay.classList.add('active');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }

        // Handle Logout clearing credentials
        if (logoutLink) {
            logoutLink.addEventListener('click', () => {
                localStorage.removeItem('taskmaster_logged_in');
                localStorage.removeItem('taskmaster_user_email');
                sessionStorage.removeItem('taskmaster_logged_in');
                sessionStorage.removeItem('taskmaster_user_email');
            });
        }

        // Setup Open Triggers for Modals
        if (btnTriggerCreateProject) {
            btnTriggerCreateProject.addEventListener('click', () => openModal(modalCreateProject));
        }
        if (btnTriggerCreateTask) {
            btnTriggerCreateTask.addEventListener('click', () => openModal(modalCreateTask));
        }
        if (btnTriggerAssignTask) {
            btnTriggerAssignTask.addEventListener('click', () => openModal(modalAssignTask));
        }
        if (btnTriggerGenerateReport) {
            btnTriggerGenerateReport.addEventListener('click', () => openModal(modalGenerateReport));
        }

        // Setup Cancel / Close triggers on all modals
        const modalOverlays = document.querySelectorAll('.modal-overlay');
        modalOverlays.forEach(overlay => {
            // Close when clicking outside of container card
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(overlay);
            });

            // Close when clicking Close Header button
            const closeBtn = overlay.querySelector('.modal-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeModal(overlay));
            }

            // Close when clicking Cancel Footer button
            const cancelBtn = overlay.querySelector('.modal-cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => closeModal(overlay));
            }
        });

        // ==========================================
        // FORM SUBMIT HANDLERS
        // ==========================================
        // Create Project Form
        if (formCreateProject) {
            formCreateProject.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('project-name').value.trim();
                const lead = document.getElementById('project-lead');
                const leadName = lead.options[lead.selectedIndex].text;
                const startingPct = parseInt(document.getElementById('project-percentage-input').value) || 0;

                const newProj = {
                    name: name,
                    percentage: startingPct,
                    theme: getRandomTheme()
                };

                projects.push(newProj);
                renderProjects();
                calculateAndSetStats();
                closeModal(modalCreateProject);
                formCreateProject.reset();

                // Add corresponding deadline element for realism
                const randomDays = Math.floor(Math.random() * 12) + 2;
                deadlines.unshift({
                    month: "Jul",
                    day: String(14 + randomDays),
                    title: `Milestone Deliverable`,
                    project: name,
                    daysLeft: randomDays,
                    criticality: randomDays <= 3 ? "critical" : (randomDays <= 6 ? "warn" : "normal")
                });
                renderDeadlines();
            });
        }

        // Create Task Form
        if (formCreateTask) {
            formCreateTask.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('task-title').value.trim();
                const projName = document.getElementById('task-project').value;
                const assignee = document.getElementById('task-assignee').value;
                const priority = document.getElementById('task-priority').value;
                const dueDate = document.getElementById('task-due-date').value;

                // Simple check for overdue
                const taskDate = new Date(dueDate);
                const today = new Date();
                let status = "To Do";
                if (taskDate < today) {
                    status = "Overdue";
                } else if (Math.random() > 0.5) {
                    status = "In Progress";
                }

                const newTask = {
                    id: tasks.length + 1,
                    title: title,
                    assignee: assignee,
                    priority: priority,
                    status: status,
                    dueDate: dueDate
                };

                tasks.unshift(newTask);
                renderTasks();
                calculateAndSetStats();
                closeModal(modalCreateTask);
                formCreateTask.reset();
            });
        }

        // Assign Task Form
        if (formAssignTask) {
            formAssignTask.addEventListener('submit', (e) => {
                e.preventDefault();
                const taskId = parseInt(document.getElementById('assign-select-task').value);
                const assigneeName = document.getElementById('assign-select-member').value;

                // Find task and reassign
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex].assignee = assigneeName;
                    
                    // Increment the assignee's team performance workload stats for realism
                    const teamIndex = teamMembers.findIndex(m => m.name.startsWith(assigneeName.split(' ')[0]));
                    if (teamIndex !== -1) {
                        teamMembers[teamIndex].pending += 1;
                        renderTeam();
                    }
                }

                renderTasks();
                closeModal(modalAssignTask);
                formAssignTask.reset();
            });
        }

        // Generate Report Button Handler
        if (btnStartReport) {
            btnStartReport.addEventListener('click', () => {
                // Hide input selection form
                reportFormContent.classList.add('hidden');
                reportFooterActions.classList.add('hidden');
                
                // Show loading simulation progress bar
                reportGeneratingContent.classList.remove('hidden');

                // Animate progress percentage
                let percentage = 0;
                reportFill.style.width = '0%';
                
                const progressTexts = [
                    "Querying board tasks...",
                    "Calculating developer velocities...",
                    "Assembling graphs and charts...",
                    "Finalizing document export..."
                ];

                const interval = setInterval(() => {
                    percentage += 10;
                    reportFill.style.width = `${percentage}%`;

                    // Cycle status messages
                    if (percentage < 30) {
                        reportStatusText.textContent = progressTexts[0];
                    } else if (percentage < 60) {
                        reportStatusText.textContent = progressTexts[1];
                    } else if (percentage < 85) {
                        reportStatusText.textContent = progressTexts[2];
                    } else {
                        reportStatusText.textContent = progressTexts[3];
                    }

                    if (percentage >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            // Finish Report Download Action
                            reportGeneratingContent.innerHTML = `
                                <div class="report-progress-container" style="padding: 10px 0;">
                                    <div style="background-color: var(--status-completed-bg); color: #10B981; border: 1.5px solid #6EE7B7; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                    </div>
                                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Report Successfully Generated</h4>
                                    <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 20px;">Your compilation is ready for download in format selected.</p>
                                    <button class="btn btn-primary" id="btn-download-file" style="width: 100%; max-width: 200px;">Download Document</button>
                                </div>
                            `;

                            // Add closing listener to generated button
                            document.getElementById('btn-download-file').addEventListener('click', () => {
                                closeModal(modalGenerateReport);
                                // Reset modal status back for subsequent generations
                                setTimeout(resetReportModal, 300);
                            });
                        }, 500);
                    }
                }, 250);
            });
        }
    }

    // Modal Display Functions
    function openModal(modalElement) {
        if (!modalElement) return;
        modalElement.classList.add('active');
    }

    function closeModal(modalElement) {
        if (!modalElement) return;
        modalElement.classList.remove('active');
    }

    // Restore Generate Report Modal states
    function resetReportModal() {
        reportGeneratingContent.classList.add('hidden');
        reportGeneratingContent.innerHTML = `
            <div class="report-progress-container">
                <p id="report-status-text">Compiling task databases...</p>
                <div class="report-loading-bar">
                    <div class="report-loading-fill" id="report-fill"></div>
                </div>
                <p style="font-size: 13px; color: var(--text-secondary)">This will take just a few seconds.</p>
            </div>
        `;
        reportFormContent.classList.remove('hidden');
        reportFooterActions.classList.remove('hidden');
        
        // Re-get variables since DOM was updated
        const newReportFill = document.getElementById('report-fill');
        const newStatusText = document.getElementById('report-status-text');
        
        reportFill.style.width = '0%';
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    function formatDateString(dateStr) {
        if (!dateStr) return '';
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return dateStr;
        
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    }

    function getRandomTheme() {
        const themes = ["blue", "purple", "indigo", "green"];
        return themes[Math.floor(Math.random() * themes.length)];
    }

    // Trigger initialization
    init();
});
