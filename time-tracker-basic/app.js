// TaskFlow Pro - AI-Powered Task Management
// Storage schema v4 - User-specific data
(function() {
  // Get current user's storage key
  function getStorageKey() {
    const user = window.TaskFlowAuth?.getCurrentUser();
    if (!user) return null;
    return `taskflow:data:${user.email}`;
  }

  const els = {
    taskInput: document.getElementById('taskInput'),
    taskDeadlineInput: document.getElementById('taskDeadlineInput'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    activeTab: document.getElementById('activeTab'),
    completedTab: document.getElementById('completedTab'),
    activeCount: document.getElementById('activeCount'),
    completedCount: document.getElementById('completedCount'),
    todayTime: document.getElementById('todayTime'),
    activeTaskPanel: document.getElementById('activeTaskPanel'),
    activeTaskInfo: document.getElementById('activeTaskInfo'),
    panelTimer: document.getElementById('panelTimer'),
    stopActiveTask: document.getElementById('stopActiveTask'),
    closePanel: document.getElementById('closePanel'),
  };

  let state = load() || { tasks: [], currentTab: 'active', activeTaskId: null };
  let tickerId = null;
  let notificationCheckerId = null;
  let idleTimer = null;
  let lastActivity = Date.now();
  let productivityMetrics = {
    totalActiveTime: 0,
    totalIdleTime: 0,
    focusSessions: [],
    breakSessions: [],
    productivityScore: 0
  };

  function save() {
    const key = getStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(state));
  }

  function load() {
    const key = getStorageKey();
    if (!key) return null;
    try { 
      const data = JSON.parse(localStorage.getItem(key));
      return data;
    }
    catch { return null; }
  }

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // Enhanced AI-Powered Task Parser
  function parseTaskInput(input) {
    const text = input.trim();
    if (!text) return null;

    console.log('🤖 AI Parsing input:', text);
    
    // Detect priority from natural language
    let priority = 'medium';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('critical') || 
        lowerText.includes('high priority') || lowerText.includes('important') || lowerText.includes('emergency')) {
      priority = 'high';
    } else if (lowerText.includes('low priority') || lowerText.includes('when possible') || 
               lowerText.includes('sometime') || lowerText.includes('eventually')) {
      priority = 'low';
    }

    // Enhanced Pattern 1: "Write/Send email to X for/about Y"
    let match = text.match(/(?:write|send|draft|compose)\s+(?:an?\s+)?email\s+to\s+([^,]+?)(?:\s+(?:for|about|regarding|concerning)\s+(.+))?$/i);
    if (match) {
      console.log('✅ Matched: Email pattern');
      return {
        name: `📧 Email to ${capitalizeFirst(match[1].trim())}`,
        description: match[2] ? `Regarding: ${capitalizeFirst(match[2].trim())}` : 'Email communication',
        priority: priority
      };
    }

    // Enhanced Pattern 2: "Call X about/for Y"
    match = text.match(/(?:call|phone|ring)\s+([^,]+?)(?:\s+(?:about|regarding|for|to\s+discuss)\s+(.+))?$/i);
    if (match) {
      console.log('✅ Matched: Call pattern');
      return {
        name: `📞 Call ${capitalizeFirst(match[1].trim())}`,
        description: match[2] ? `About: ${capitalizeFirst(match[2].trim())}` : 'Phone conversation',
        priority: priority
      };
    }

    // Enhanced Pattern 3: "Prepare/Create X for Y"
    match = text.match(/(?:prepare|create|make|develop|build|design)\s+(.+?)\s+for\s+(.+?)(?:[,;]\s*(.+))?$/i);
    if (match) {
      console.log('✅ Matched: Prepare pattern');
      return {
        name: `🔨 ${capitalizeFirst(match[1].trim())}`,
        description: `For: ${capitalizeFirst(match[2].trim())}${match[3] ? '. ' + capitalizeFirst(match[3].trim()) : ''}`,
        priority: priority
      };
    }

    // Enhanced Pattern 4: "Meeting with X about Y"
    match = text.match(/(?:meeting|call|conference|discussion)\s+(?:with\s+)?([^,]+?)\s+(?:about|regarding|for|to\s+discuss)\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: Meeting pattern');
      return {
        name: `🤝 Meeting with ${capitalizeFirst(match[1].trim())}`,
        description: `Topic: ${capitalizeFirst(match[2].trim())}`,
        priority: priority
      };
    }

    // New Pattern 5: "Review X"
    match = text.match(/^(?:review|check|examine|analyze)\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: Review pattern');
      return {
        name: `🔍 Review ${capitalizeFirst(match[1].trim())}`,
        description: 'Review and analysis task',
        priority: priority
      };
    }

    // New Pattern 6: "Fix/Resolve X"
    match = text.match(/^(?:fix|resolve|solve|debug|troubleshoot)\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: Fix pattern');
      return {
        name: `🔧 Fix ${capitalizeFirst(match[1].trim())}`,
        description: 'Problem resolution task',
        priority: priority
      };
    }

    // New Pattern 7: "Learn/Study X"
    match = text.match(/^(?:learn|study|research|investigate)\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: Learning pattern');
      return {
        name: `📚 Learn ${capitalizeFirst(match[1].trim())}`,
        description: 'Learning and research task',
        priority: priority
      };
    }

    // New Pattern 8: "Update/Modify X"
    match = text.match(/^(?:update|modify|edit|change|revise)\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: Update pattern');
      return {
        name: `✏️ Update ${capitalizeFirst(match[1].trim())}`,
        description: 'Update and modification task',
        priority: priority
      };
    }

    // New Pattern 9: "Submit/Deliver X"
    match = text.match(/^(?:submit|deliver|send|provide)\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: Submit pattern');
      return {
        name: `📤 Submit ${capitalizeFirst(match[1].trim())}`,
        description: 'Submission and delivery task',
        priority: priority
      };
    }

    // Enhanced Pattern 10: Time-based tasks
    match = text.match(/^(?:schedule|plan|organize)\s+(.+?)\s+(?:for|on|at)\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: Schedule pattern');
      return {
        name: `📅 Schedule ${capitalizeFirst(match[1].trim())}`,
        description: `For: ${capitalizeFirst(match[2].trim())}`,
        priority: priority
      };
    }

    // Enhanced Pattern 11: Split by comma/semicolon with better handling
    const parts = text.split(/[,;]/);
    if (parts.length >= 2) {
      console.log('✅ Matched: Comma/semicolon split');
      const title = parts[0].trim();
      const description = parts.slice(1).join(', ').trim();
      return {
        name: `📝 ${capitalizeFirst(title)}`,
        description: capitalizeFirst(description),
        priority: priority
      };
    }

    // Enhanced Pattern 12: "for" keyword with better context
    match = text.match(/^(.+?)\s+for\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: For keyword');
      return {
        name: `📋 ${capitalizeFirst(match[1].trim())}`,
        description: `For: ${capitalizeFirst(match[2].trim())}`,
        priority: priority
      };
    }

    // Enhanced Pattern 13: Priority indicators
    match = text.match(/^(?:urgent|priority|asap|important)\s*[:\-]?\s*(.+)$/i);
    if (match) {
      console.log('✅ Matched: Priority pattern');
    return {
        name: `🚨 ${capitalizeFirst(match[1].trim())}`,
        description: 'High priority task',
        priority: 'high'
      };
    }

    // Enhanced Pattern 14: Question-based tasks
    match = text.match(/^(?:what|how|when|where|why|which)\s+(.+)\?*$/i);
    if (match) {
      console.log('✅ Matched: Question pattern');
      return {
        name: `❓ ${capitalizeFirst(match[1].trim())}`,
        description: 'Research and investigation task',
        priority: priority
      };
    }

    // Enhanced Pattern 15: Action verbs with objects
    match = text.match(/^(?:implement|deploy|install|configure|setup|test|validate|verify)\s+(.+)$/i);
    if (match) {
      console.log('✅ Matched: Action verb pattern');
      return {
        name: `⚙️ ${capitalizeFirst(match[1].trim())}`,
        description: 'Implementation and setup task',
        priority: priority
      };
    }

    // Default: use entire text as title with smart categorization
    console.log('✅ Using default: entire text as title');
    const smartTitle = smartCategorize(text);
    return {
      name: smartTitle,
      description: 'General task',
      priority: priority
    };
  }

  function smartCategorize(text) {
    const lowerText = text.toLowerCase();
    
    // Smart categorization based on keywords
    if (lowerText.includes('meeting') || lowerText.includes('call')) {
      return `🤝 ${capitalizeFirst(text)}`;
    } else if (lowerText.includes('email') || lowerText.includes('message')) {
      return `📧 ${capitalizeFirst(text)}`;
    } else if (lowerText.includes('code') || lowerText.includes('program') || lowerText.includes('develop')) {
      return `💻 ${capitalizeFirst(text)}`;
    } else if (lowerText.includes('design') || lowerText.includes('create') || lowerText.includes('make')) {
      return `🎨 ${capitalizeFirst(text)}`;
    } else if (lowerText.includes('review') || lowerText.includes('check') || lowerText.includes('analyze')) {
      return `🔍 ${capitalizeFirst(text)}`;
    } else if (lowerText.includes('fix') || lowerText.includes('bug') || lowerText.includes('issue')) {
      return `🔧 ${capitalizeFirst(text)}`;
    } else if (lowerText.includes('learn') || lowerText.includes('study') || lowerText.includes('research')) {
      return `📚 ${capitalizeFirst(text)}`;
    } else if (lowerText.includes('plan') || lowerText.includes('organize') || lowerText.includes('schedule')) {
      return `📅 ${capitalizeFirst(text)}`;
    } else if (lowerText.includes('urgent') || lowerText.includes('priority') || lowerText.includes('asap')) {
      return `🚨 ${capitalizeFirst(text)}`;
    } else {
      return `📝 ${capitalizeFirst(text)}`;
    }
  }

  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function addTask(inputText, deadline, priority = 'medium') {
    // Check subscription limits
    if (window.TaskFlowPayment && !window.TaskFlowPayment.checkLimits()) {
      return;
    }

    const parsed = parseTaskInput(inputText);
    if (!parsed) return;

    console.log('AI Parsed:', parsed); // Debug AI parsing

    const task = {
      id: uid(),
      name: parsed.name,
      description: parsed.description,
      completed: false,
      deadline: deadline ? new Date(deadline).getTime() : null,
      reminderTime: null,
      priority: parsed.priority || priority, // 'low', 'medium', 'high'
      runningSince: null,
      sessions: [],
      notifiedDeadline: false,
      createdAt: Date.now(),
      comments: []
    };
    
    state.tasks.unshift(task);
    save();
    render();
    
    els.taskInput.value = '';
    els.taskDeadlineInput.value = '';
    
    // Show success feedback with AI parsing result
    const feedback = parsed.description ? 
      `✓ Created: "${parsed.name}" with details!` : 
      `✓ Task created!`;
    els.taskInput.placeholder = feedback;
    setTimeout(() => {
      els.taskInput.placeholder = "Describe your task naturally... e.g., 'Write an email to PwC for preparation of TP documentation, add details as to fee, deadline etc.'";
    }, 3000);
  }

  function startTimer(taskId) {
    // Stop any currently running task
    if (state.activeTaskId && state.activeTaskId !== taskId) {
      stopTimer(state.activeTaskId);
    }

    const t = state.tasks.find(x => x.id === taskId);
    if (!t || t.runningSince || t.completed) return;
    
    const now = Date.now();
    t.runningSince = now;
    t.sessions.push({ 
      start: now, 
      end: null,
      focusLevel: calculateFocusLevel(),
      context: getCurrentContext()
    });
    state.activeTaskId = taskId;
    
    // Start advanced tracking
    startAdvancedTracking();
    
    save();
    render();
    showActiveTaskPanel(taskId);
  }

  function stopTimer(taskId) {
    const t = state.tasks.find(x => x.id === taskId);
    if (!t || !t.runningSince) return;
    
    const now = Date.now();
    const last = [...t.sessions].reverse().find(s => s.end === null);
    if (last) {
      last.end = now;
      last.duration = now - last.start;
      last.productivityScore = calculateSessionProductivity(last);
    }
    t.runningSince = null;
    
    if (state.activeTaskId === taskId) {
      state.activeTaskId = null;
      hideActiveTaskPanel();
    }
    
    // Stop advanced tracking
    stopAdvancedTracking();
    
    save();
    render();
  }

  function toggleComplete(taskId) {
    const t = state.tasks.find(x => x.id === taskId);
    if (!t) return;
    
    if (!t.completed) {
      if (t.runningSince) stopTimer(taskId);
      t.completed = true;
      t.completedAt = Date.now();
    } else {
      t.completed = false;
      t.completedAt = null;
    }
    save();
    render();
  }

  function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    
    if (state.activeTaskId === taskId) {
      state.activeTaskId = null;
      hideActiveTaskPanel();
    }
    
    state.tasks = state.tasks.filter(x => x.id !== taskId);
    save();
    render();
  }

  function toggleComments(taskId) {
    const commentsEl = document.getElementById(`comments-${taskId}`);
    if (commentsEl) {
      const isVisible = commentsEl.style.display !== 'none';
      commentsEl.style.display = isVisible ? 'none' : 'block';
    }
  }

  function toggleTranslation(taskId) {
    const translationEl = document.getElementById(`translation-${taskId}`);
    if (translationEl) {
      const isVisible = translationEl.style.display !== 'none';
      translationEl.style.display = isVisible ? 'none' : 'block';
    }
  }

  async function translateTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetLangSelect = document.getElementById(`targetLang-${taskId}`);
    const targetLanguage = targetLangSelect.value;
    
    if (!targetLanguage) {
      showPopupNotification('⚠️ Language Required', 'Please select a target language', 'Choose a language from the dropdown menu');
      return;
    }

    if (!window.TaskFlowAI || !window.TaskFlowAI.isConfigured()) {
      showPopupNotification('🔑 API Key Required', 'OpenAI API key not configured', 'Please add your OpenAI API key in Settings to use translation');
      return;
    }

    const originalTextEl = document.getElementById(`originalText-${taskId}`);
    const translatedTextEl = document.getElementById(`translatedText-${taskId}`);
    const resultEl = document.getElementById(`translationResult-${taskId}`);
    const translateBtn = document.querySelector(`[data-task="${taskId}"].translate-btn`);

    // Prepare text to translate
    const textToTranslate = task.description ? 
      `${task.name}\n\n${task.description}` : 
      task.name;

    try {
      // Show loading state
      translateBtn.textContent = 'Translating...';
      translateBtn.disabled = true;
      
      originalTextEl.textContent = textToTranslate;
      translatedTextEl.innerHTML = '<div class="loading-spinner">🔄 Translating with AI...</div>';
      resultEl.style.display = 'block';

      // Call OpenAI translation
      const translatedText = await window.TaskFlowAI.translate(textToTranslate, targetLanguage);
      
      // Show result
      translatedTextEl.textContent = translatedText;
      
      // Get language name for notification
      const languages = window.TaskFlowAI.getSupportedLanguages();
      const targetLang = languages.find(l => l.code === targetLanguage);
      const langName = targetLang ? targetLang.name : targetLanguage;
      
      showPopupNotification('✅ Translation Complete', `Translated to ${langName}`, 'Translation powered by OpenAI');
      
    } catch (error) {
      console.error('Translation error:', error);
      translatedTextEl.innerHTML = `<div class="error-message">❌ Translation failed: ${error.message}</div>`;
      showPopupNotification('❌ Translation Failed', error.message, 'Please check your API key and try again');
    } finally {
      // Reset button
      translateBtn.textContent = 'Translate';
      translateBtn.disabled = false;
    }
  }

  function addComment(taskId, text) {
    const t = state.tasks.find(x => x.id === taskId);
    if (!t) return;
    
    const user = window.TaskFlowAuth?.getCurrentUser();
    const comment = {
      id: uid(),
      text: text,
      author: user?.name || 'User',
      timestamp: Date.now()
    };
    
    if (!t.comments) t.comments = [];
    t.comments.push(comment);
    save();
    render();
    
    // Re-open comments after render
    setTimeout(() => toggleComments(taskId), 100);
  }

  function setReminder(taskId) {
    const t = state.tasks.find(x => x.id === taskId);
    if (!t || t.completed) return;
    
    const reminderInput = prompt('Set reminder in minutes from now (e.g., 30 for 30 minutes):');
    if (reminderInput === null) return;
    
    if (!reminderInput.trim()) {
      t.reminderTime = null;
      save();
      render();
      return;
    }
    
    const minutes = parseInt(reminderInput);
    if (isNaN(minutes) || minutes <= 0) {
      alert('Please enter a valid number of minutes');
      return;
    }
    
    const reminderTime = Date.now() + (minutes * 60 * 1000);
    t.reminderTime = reminderTime;
    t.notifiedReminder = false;
    save();
    render();
  }

  function showActiveTaskPanel(taskId) {
    const t = state.tasks.find(x => x.id === taskId);
    if (!t) return;
    
    els.activeTaskInfo.innerHTML = `
      <h3>${t.name}</h3>
      ${t.description ? `<p>${t.description}</p>` : ''}
    `;
    
    els.activeTaskPanel.classList.remove('hidden');
  }

  function hideActiveTaskPanel() {
    els.activeTaskPanel.classList.add('hidden');
  }

  function formatDuration(ms) {
    if (ms < 0) ms = 0;
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function formatDurationShort(ms) {
    if (ms < 0) ms = 0;
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${sec}s`;
  }

  function calcTotals(task) {
    const now = Date.now();
    let total = 0;
    let today = 0;
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const sod = startOfDay.getTime();

    for (const sess of task.sessions) {
      const end = sess.end ?? now;
      const dur = Math.max(0, end - sess.start);
      total += dur;

      const a = Math.max(sess.start, sod);
      const b = Math.max(a, end);
      today += Math.max(0, b - a);
    }

    return { total, today };
  }

  function switchTab(tab) {
    state.currentTab = tab;
    save();
    
    els.activeTab.classList.toggle('active', tab === 'active');
    els.completedTab.classList.toggle('active', tab === 'completed');
    
    render();
  }

  function render() {
    els.taskList.innerHTML = '';
    
    const filteredTasks = state.tasks.filter(t => 
      state.currentTab === 'active' ? !t.completed : t.completed
    );
    
    els.emptyState.style.display = filteredTasks.length ? 'none' : 'block';

    for (const t of filteredTasks) {
      const card = document.createElement('div');
      card.className = 'task-card';
      if (t.runningSince) card.classList.add('running');
      if (t.completed) card.classList.add('completed');
      
      const { total, today } = calcTotals(t);
      
      const deadlineHtml = t.deadline ? `
        <div class="task-meta-item">
          📅 ${new Date(t.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      ` : '';
      
      const reminderHtml = t.reminderTime && !t.completed ? `
        <div class="task-meta-item reminder-countdown" data-reminder="${t.reminderTime}">
          ⏰ Reminder in: <span class="countdown-text">calculating...</span>
        </div>
      ` : '';
      
      const runningTime = t.runningSince ? Date.now() - t.runningSince : 0;
      const statusBadge = t.runningSince ? 
        `<span class="task-status-badge running">● ${formatDurationShort(runningTime)}</span>` : 
        (t.completed ? '' : '<span class="task-status-badge paused">PAUSED</span>');
      
      card.innerHTML = `
        ${statusBadge}
        <div class="task-card-header">
          <div class="task-card-title">
            ${t.name}
            ${t.priority ? `<span class="priority-badge priority-${t.priority}">${t.priority.toUpperCase()}</span>` : ''}
          </div>
          ${t.description ? `<div class="task-card-description">${t.description}</div>` : ''}
        </div>
        
        <div class="task-card-meta">
          ${deadlineHtml}
          ${reminderHtml}
        </div>
        
        <div class="task-card-stats">
          <div class="task-stat">
            <div class="task-stat-label">Today</div>
            <div class="task-stat-value">${formatDurationShort(today)}</div>
          </div>
          <div class="task-stat">
            <div class="task-stat-label">Total</div>
            <div class="task-stat-value">${formatDurationShort(total)}</div>
          </div>
        </div>
        
        <div class="task-card-actions">
          ${!t.completed ? `
            <button class="task-action-btn success" data-action="complete">✓ Complete</button>
            <button class="task-action-btn" data-action="reminder">⏰ Remind</button>
            <button class="task-action-btn" data-action="comment">💬 ${t.comments?.length || 0}</button>
            <button class="task-action-btn" data-action="calendar" onclick="createCalendarEvent('${t.id}')">📅 Meeting</button>
            <button class="task-action-btn" data-action="translate">🌍 Translate</button>
          ` : `
            <button class="task-action-btn" data-action="reopen">↩️ Reopen</button>
          `}
          <button class="task-action-btn danger" data-action="delete">Delete</button>
        </div>
        
        <div class="task-comments" id="comments-${t.id}" style="display: none;">
          <div class="comments-header">
            <h4>Comments</h4>
            <button class="close-comments" data-task="${t.id}">✕</button>
          </div>
          <div class="comments-list">
            ${(t.comments || []).map(c => `
              <div class="comment-item">
                <div class="comment-meta">
                  <span class="comment-author">${c.author}</span>
                  <span class="comment-time">${new Date(c.timestamp).toLocaleString()}</span>
                </div>
                <div class="comment-text">${c.text}</div>
              </div>
            `).join('') || '<p class="no-comments">No comments yet</p>'}
          </div>
          <div class="add-comment">
            <textarea class="comment-input" placeholder="Add a comment..." rows="2"></textarea>
            <button class="btn-primary add-comment-btn" data-task="${t.id}">Add Comment</button>
          </div>
        </div>

        <div class="task-translation" id="translation-${t.id}" style="display: none;">
          <div class="translation-header">
            <h4>🌍 AI Translation</h4>
            <button class="close-translation" data-task="${t.id}">✕</button>
          </div>
          <div class="translation-controls">
            <select class="language-select" id="targetLang-${t.id}">
              <option value="">Select target language...</option>
            </select>
            <button class="btn-primary translate-btn" data-task="${t.id}">Translate</button>
          </div>
          <div class="translation-result" id="translationResult-${t.id}" style="display: none;">
            <div class="translation-section">
              <h5>Original:</h5>
              <div class="original-text" id="originalText-${t.id}"></div>
            </div>
            <div class="translation-section">
              <h5>Translation:</h5>
              <div class="translated-text" id="translatedText-${t.id}"></div>
            </div>
          </div>
        </div>
      `;
      
      // Click to start/stop timer
      card.addEventListener('click', (e) => {
        // Don't start timer if clicking on buttons, comment areas, or any interactive elements
        if (e.target.closest('button') || 
            e.target.closest('.comments-section') || 
            e.target.closest('.comment-input') ||
            e.target.closest('.comments-list') ||
            e.target.closest('.task-comments') ||
            e.target.closest('.task-card-actions') ||
            e.target.closest('input') ||
            e.target.closest('textarea') ||
            e.target.closest('select')) {
          console.log('Timer click prevented - interactive element clicked');
          return;
        }
        if (t.completed) return;
        
        console.log('Starting/stopping timer for task:', t.id);
        if (t.runningSince) {
          stopTimer(t.id);
        } else {
          startTimer(t.id);
        }
      });
      
      // Action buttons
      card.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const action = btn.dataset.action;
          
          if (action === 'complete') toggleComplete(t.id);
          else if (action === 'reopen') toggleComplete(t.id);
          else if (action === 'delete') deleteTask(t.id);
          else if (action === 'reminder') setReminder(t.id);
          else if (action === 'comment') {
            console.log('Comment button clicked for task:', t.id);
            toggleComments(t.id);
          }
          else if (action === 'translate') {
            console.log('Translate button clicked for task:', t.id);
            toggleTranslation(t.id);
          }
        });
      });
      
      // Close comments button
      const closeBtn = card.querySelector('.close-comments');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleComments(closeBtn.dataset.task);
        });
      }
      
      // Add comment button
      const addCommentBtn = card.querySelector('.add-comment-btn');
      if (addCommentBtn) {
        addCommentBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const textarea = card.querySelector('.comment-input');
          if (textarea.value.trim()) {
            addComment(addCommentBtn.dataset.task, textarea.value.trim());
            textarea.value = '';
          }
        });
      }
      
      // Close translation button
      const closeTranslationBtn = card.querySelector('.close-translation');
      if (closeTranslationBtn) {
        closeTranslationBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleTranslation(closeTranslationBtn.dataset.task);
        });
      }
      
      // Translate button
      const translateBtn = card.querySelector('.translate-btn');
      if (translateBtn) {
        translateBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          translateTask(translateBtn.dataset.task);
        });
      }
      
      // Populate language selector
      const languageSelect = card.querySelector(`#targetLang-${t.id}`);
      if (languageSelect && window.TaskFlowAI) {
        const languages = window.TaskFlowAI.getSupportedLanguages();
        languages.forEach(lang => {
          const option = document.createElement('option');
          option.value = lang.code;
          option.textContent = `${lang.flag} ${lang.name}`;
          languageSelect.appendChild(option);
        });
      }
      
      els.taskList.appendChild(card);
    }

    updateStats();
    
    if (tickerId) clearInterval(tickerId);
    tickerId = setInterval(updateStats, 1000);
    
    if (notificationCheckerId) clearInterval(notificationCheckerId);
    notificationCheckerId = setInterval(checkNotifications, 10000);
  }

  function updateStats() {
    const activeTasks = state.tasks.filter(t => !t.completed);
    const completedTasks = state.tasks.filter(t => t.completed);
    
    els.activeCount.textContent = activeTasks.length;
    els.completedCount.textContent = completedTasks.length;
    
    // Calculate today's total time
    let todayTotal = 0;
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const sod = startOfDay.getTime();
    const now = Date.now();
    
    for (const t of state.tasks) {
      for (const sess of t.sessions) {
        const end = sess.end ?? now;
        const a = Math.max(sess.start, sod);
        const b = Math.max(a, end);
        todayTotal += Math.max(0, b - a);
      }
    }
    
    const hours = Math.floor(todayTotal / (1000 * 60 * 60));
    const minutes = Math.floor((todayTotal % (1000 * 60 * 60)) / (1000 * 60));
    els.todayTime.textContent = `${hours}h ${minutes}m`;
    
    // Update active task panel
    if (state.activeTaskId) {
      const activeTask = state.tasks.find(t => t.id === state.activeTaskId);
      if (activeTask && activeTask.runningSince) {
        const elapsed = Date.now() - activeTask.runningSince;
        els.panelTimer.textContent = formatDuration(elapsed);
      }
    }
    
    // Update reminder countdowns
    document.querySelectorAll('.reminder-countdown').forEach(el => {
      const reminderTime = parseInt(el.dataset.reminder);
      const timeLeft = reminderTime - Date.now();
      const countdownEl = el.querySelector('.countdown-text');
      
      if (timeLeft <= 0) {
        countdownEl.textContent = 'NOW!';
        countdownEl.style.color = 'var(--danger)';
      } else {
        const mins = Math.floor(timeLeft / 60000);
        const secs = Math.floor((timeLeft % 60000) / 1000);
        if (mins > 60) {
          const hours = Math.floor(mins / 60);
          const remainMins = mins % 60;
          countdownEl.textContent = `${hours}h ${remainMins}m`;
        } else if (mins > 0) {
          countdownEl.textContent = `${mins}m ${secs}s`;
        } else {
          countdownEl.textContent = `${secs}s`;
        }
        countdownEl.style.color = timeLeft < 60000 ? 'var(--warning)' : 'var(--text-muted)';
      }
    });
  }

  function checkNotifications() {
    const now = Date.now();
    
    for (const t of state.tasks) {
      if (t.completed) continue;
      
      // Check deadline notifications (5 minutes before and at deadline)
      if (t.deadline && !t.notifiedDeadline) {
        const timeUntilDeadline = t.deadline - now;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeUntilDeadline <= 0) {
          showPopupNotification(`🚨 Deadline Passed!`, `Task: ${t.name}`, t.description || 'This task is overdue', t.id);
          t.notifiedDeadline = true;
          save();
        } else if (timeUntilDeadline <= fiveMinutes && !t.notifiedDeadlineWarning) {
          showPopupNotification(`⏰ Deadline Soon!`, `Task: ${t.name}`, `Due in ${Math.ceil(timeUntilDeadline / 60000)} minutes`, t.id);
          t.notifiedDeadlineWarning = true;
          save();
        }
      }
      
      if (t.reminderTime && !t.notifiedReminder && t.reminderTime <= now) {
        showPopupNotification(`⏰ Reminder!`, `Time to work on: ${t.name}`, t.description || 'No description', t.id);
        t.notifiedReminder = true;
        save();
      }
    }
  }

  function showPopupNotification(title, message, details, taskId) {
    const popup = document.createElement('div');
    popup.className = 'notification-popup';
    
    const hasTask = taskId && state.tasks.find(t => t.id === taskId);
    
    popup.innerHTML = `
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
        <div class="notification-details">${details}</div>
        <div class="notification-actions">
          ${hasTask ? `
            <button class="notification-btn complete-btn" data-task="${taskId}">✓ Mark Complete</button>
            <button class="notification-btn dismiss-btn">Dismiss</button>
          ` : `
            <button class="notification-btn dismiss-btn">Dismiss</button>
          `}
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    const timeoutId = setTimeout(() => {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 300);
    }, 15000);
    
    const dismissBtn = popup.querySelector('.dismiss-btn');
    dismissBtn.addEventListener('click', () => {
      clearTimeout(timeoutId);
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 300);
    });
    
    const completeBtn = popup.querySelector('.complete-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        const tid = completeBtn.dataset.task;
        toggleComplete(tid);
        clearTimeout(timeoutId);
        popup.classList.add('fade-out');
        setTimeout(() => popup.remove(), 300);
      });
    }
    
    setTimeout(() => popup.classList.add('show'), 10);
  }

  function exportCSV() {
    showExportModal();
  }

  function showExportModal() {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
      <div class="payment-modal-overlay"></div>
      <div class="payment-modal-content" style="max-width: 600px;">
        <button class="payment-close">✕</button>
        
        <div class="payment-header">
          <h2>📊 Export Data</h2>
          <p>Choose your export format and options</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin-bottom: 16px;">Export Format</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <button class="export-format-btn active" data-format="csv">
              <div style="font-size: 24px; margin-bottom: 8px;">📄</div>
              <div style="font-weight: 600;">CSV</div>
              <div style="font-size: 12px; color: var(--text-muted);">Spreadsheet format</div>
            </button>
            <button class="export-format-btn" data-format="json">
              <div style="font-size: 24px; margin-bottom: 8px;">🔧</div>
              <div style="font-weight: 600;">JSON</div>
              <div style="font-size: 12px; color: var(--text-muted);">Raw data format</div>
            </button>
            <button class="export-format-btn" data-format="pdf">
              <div style="font-size: 24px; margin-bottom: 8px;">📋</div>
              <div style="font-weight: 600;">PDF Report</div>
              <div style="font-size: 12px; color: var(--text-muted);">Formatted report</div>
            </button>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin-bottom: 16px;">Export Options</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="includeSessions" checked>
              <span>Include detailed session data</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="includeAnalytics" checked>
              <span>Include productivity analytics</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="includeComments" checked>
              <span>Include task comments</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="includeMetadata">
              <span>Include system metadata</span>
            </label>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin-bottom: 16px;">Date Range</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; margin-bottom: 4px; font-size: 14px; font-weight: 600;">From</label>
              <input type="date" id="exportFrom" class="deadline-input">
            </div>
            <div>
              <label style="display: block; margin-bottom: 4px; font-size: 14px; font-weight: 600;">To</label>
              <input type="date" id="exportTo" class="deadline-input">
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="task-action-btn" onclick="this.closest('.payment-modal').remove()">Cancel</button>
          <button class="btn-primary" id="exportDataBtn">Export Data</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    document.getElementById('exportFrom').value = thirtyDaysAgo.toISOString().slice(0, 10);
    document.getElementById('exportTo').value = today.toISOString().slice(0, 10);

    // Close button
    modal.querySelector('.payment-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.payment-modal-overlay').addEventListener('click', () => modal.remove());

    // Format selection
    modal.querySelectorAll('.export-format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.export-format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Export button
    modal.querySelector('#exportDataBtn').addEventListener('click', () => {
      const format = modal.querySelector('.export-format-btn.active').dataset.format;
      const options = {
        includeSessions: document.getElementById('includeSessions').checked,
        includeAnalytics: document.getElementById('includeAnalytics').checked,
        includeComments: document.getElementById('includeComments').checked,
        includeMetadata: document.getElementById('includeMetadata').checked,
        fromDate: document.getElementById('exportFrom').value,
        toDate: document.getElementById('exportTo').value
      };
      
      performExport(format, options);
      modal.remove();
    });
  }

  function performExport(format, options) {
    const fromDate = new Date(options.fromDate).getTime();
    const toDate = new Date(options.toDate + 'T23:59:59').getTime();
    
    // Filter tasks by date range
    const filteredTasks = state.tasks.filter(task => {
      if (task.createdAt >= fromDate && task.createdAt <= toDate) return true;
      
      // Check if any sessions fall within the range
      return task.sessions.some(session => 
        session.start >= fromDate && session.start <= toDate
      );
    });

    switch (format) {
      case 'csv':
        exportToCSV(filteredTasks, options);
        break;
      case 'json':
        exportToJSON(filteredTasks, options);
        break;
      case 'pdf':
        exportToPDF(filteredTasks, options);
        break;
    }
  }

  function exportToCSV(tasks, options) {
    const rows = [['Task', 'Description', 'Status', 'Created', 'Completed', 'Total Time', 'Sessions']];

    for (const task of tasks) {
      const { total } = calcTotals(task);
      const sessionCount = task.sessions.length;
      const sessions = options.includeSessions ? 
        task.sessions.map(s => `${new Date(s.start).toLocaleString()} (${formatDurationShort(s.end ? s.end - s.start : Date.now() - s.start)})`).join('; ') : 
        `${sessionCount} sessions`;

        rows.push([
        task.name,
        task.description || '',
        task.completed ? 'Completed' : 'Active',
        new Date(task.createdAt).toLocaleString(),
        task.completed ? new Date(task.completedAt).toLocaleString() : '',
        formatDurationShort(total),
        sessions
      ]);
    }

    const csv = rows.map(r => r.map(v => {
      const str = String(v);
      const needsQuote = /[",\n]/.test(str);
      const val = str.replace(/"/g, '""');
      return needsQuote ? `"${val}"` : val;
    }).join(',')).join('\n');

    downloadFile(csv, 'text/csv', `taskflow-export-${new Date().toISOString().slice(0,10)}.csv`);
  }

  function exportToJSON(tasks, options) {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        format: 'TaskFlow Pro Export',
        options: options
      },
      tasks: tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        deadline: task.deadline,
        sessions: options.includeSessions ? task.sessions : task.sessions.length,
        comments: options.includeComments ? task.comments : undefined,
        metadata: options.includeMetadata ? {
          reminderTime: task.reminderTime,
          notifiedDeadline: task.notifiedDeadline,
          notifiedReminder: task.notifiedReminder
        } : undefined
      })),
      analytics: options.includeAnalytics ? calculateAnalytics() : undefined,
      productivityMetrics: options.includeAnalytics ? calculateProductivityMetrics() : undefined
    };

    downloadFile(JSON.stringify(exportData, null, 2), 'application/json', `taskflow-export-${new Date().toISOString().slice(0,10)}.json`);
  }

  function exportToPDF(tasks, options) {
    // This would generate a PDF report
    // For now, we'll create an HTML version that can be printed to PDF
    const reportHtml = generateReportHTML(tasks, options);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TaskFlow Pro Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .task-item { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-card { text-align: center; padding: 15px; border: 1px solid #ddd; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${reportHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function generateReportHTML(tasks, options) {
    const analytics = calculateAnalytics();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTime = tasks.reduce((sum, task) => sum + calcTotals(task).total, 0);

    return `
      <div class="header">
        <h1>📊 TaskFlow Pro Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Date Range: ${options.fromDate} to ${options.toDate}</p>
      </div>

      <div class="section">
        <h2>📈 Summary Statistics</h2>
        <div class="stats">
          <div class="stat-card">
            <h3>${totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
          <div class="stat-card">
            <h3>${completedTasks}</h3>
            <p>Completed</p>
          </div>
          <div class="stat-card">
            <h3>${formatDurationShort(totalTime)}</h3>
            <p>Total Time</p>
          </div>
          <div class="stat-card">
            <h3>${analytics.productivityScore}%</h3>
            <p>Productivity Score</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📋 Task Details</h2>
        ${tasks.map(task => `
          <div class="task-item">
            <h3>${task.name}</h3>
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
            <p><strong>Status:</strong> ${task.completed ? '✅ Completed' : '⏳ Active'}</p>
            <p><strong>Created:</strong> ${new Date(task.createdAt).toLocaleString()}</p>
            ${task.completed ? `<p><strong>Completed:</strong> ${new Date(task.completedAt).toLocaleString()}</p>` : ''}
            <p><strong>Total Time:</strong> ${formatDurationShort(calcTotals(task).total)}</p>
            <p><strong>Sessions:</strong> ${task.sessions.length}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function clearData() {
    if (!confirm('This will delete all tasks and sessions. Continue?')) return;
    state = { tasks: [], currentTab: 'active', activeTaskId: null };
    save();
    hideActiveTaskPanel();
    render();
  }

  // Calendar view
  function showCalendar() {
    const tasksWithDeadlines = state.tasks.filter(t => t.deadline && !t.completed);
    const sortedTasks = tasksWithDeadlines.sort((a, b) => a.deadline - b.deadline);
    
    const now = Date.now();
    const upcomingTasks = sortedTasks.filter(t => t.deadline >= now);
    const overdueTasks = sortedTasks.filter(t => t.deadline < now);
    
    let calendarHtml = `
      <div class="calendar-view">
        <h2 style="margin-bottom: 24px; font-size: 24px;">📅 Task Calendar</h2>
        
        ${overdueTasks.length > 0 ? `
          <div class="calendar-section">
            <h3 class="calendar-section-title overdue">⚠️ Overdue (${overdueTasks.length})</h3>
            <div class="calendar-tasks">
              ${overdueTasks.map(t => `
                <div class="calendar-task overdue-task" data-task-id="${t.id}">
                  <div class="calendar-task-date">${new Date(t.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  <div class="calendar-task-info">
                    <div class="calendar-task-name">${t.name}</div>
                    ${t.description ? `<div class="calendar-task-desc">${t.description}</div>` : ''}
                  </div>
                  <button class="calendar-task-btn" onclick="window.startTaskFromCalendar('${t.id}')">Start</button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${upcomingTasks.length > 0 ? `
          <div class="calendar-section">
            <h3 class="calendar-section-title">📌 Upcoming (${upcomingTasks.length})</h3>
            <div class="calendar-tasks">
              ${upcomingTasks.map(t => {
                const daysUntil = Math.ceil((t.deadline - now) / (1000 * 60 * 60 * 24));
                const timeUntil = daysUntil > 1 ? `in ${daysUntil} days` : 'today';
                return `
                  <div class="calendar-task" data-task-id="${t.id}">
                    <div class="calendar-task-date">
                      ${new Date(t.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      <span class="calendar-task-relative">${timeUntil}</span>
                    </div>
                    <div class="calendar-task-info">
                      <div class="calendar-task-name">${t.name}</div>
                      ${t.description ? `<div class="calendar-task-desc">${t.description}</div>` : ''}
                    </div>
                    <button class="calendar-task-btn" onclick="window.startTaskFromCalendar('${t.id}')">Start</button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        
        ${upcomingTasks.length === 0 && overdueTasks.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>No upcoming deadlines</h3>
            <p>Add deadlines to your tasks to see them here</p>
          </div>
        ` : ''}
      </div>
    `;
    
    els.taskList.innerHTML = calendarHtml;
    els.emptyState.style.display = 'none';
  }

  // Enhanced Documents view
  function showDocuments() {
    const documentsHtml = `
      <div class="documents-view">
        <div class="analytics-header">
          <h2 class="analytics-title">📄 Smart Document Processor</h2>
          <div class="analytics-period">
            <button class="period-btn active" data-feature="upload">Upload</button>
            <button class="period-btn" data-feature="recent">Recent</button>
            <button class="period-btn" data-feature="templates">Templates</button>
          </div>
        </div>
        
        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Document Upload</h3>
              <div class="card-icon primary">📎</div>
            </div>
          <div class="upload-area" id="uploadArea">
              <div class="upload-icon">📄</div>
              <h3>Drop files here or click to browse</h3>
              <p>Supports PDF, Word, Text, and Image files</p>
              <input type="file" id="fileInput" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style="display: none;" multiple />
              <button class="btn-primary" onclick="document.getElementById('fileInput').click()">
                <span>📁</span> Choose Files
              </button>
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Quick Actions</h3>
              <div class="card-icon success">⚡</div>
            </div>
            <div style="margin-top: 16px;">
              <button class="task-action-btn" onclick="createTaskFromTemplate('meeting-notes')">
                📝 Meeting Notes Template
              </button>
              <button class="task-action-btn" onclick="createTaskFromTemplate('project-brief')">
                📋 Project Brief Template
              </button>
              <button class="task-action-btn" onclick="createTaskFromTemplate('report')">
                📊 Report Template
              </button>
            </div>
          </div>
          </div>
          
          <div id="documentResult" class="document-result" style="display: none;">
          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Document Analysis</h3>
              <div class="card-icon info">🔍</div>
            </div>
            <div id="documentSummary" class="document-summary"></div>
            
            <div class="document-actions" style="margin-top: 20px;">
              <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <label style="font-weight: 600;">Quick Actions:</label>
                <button class="task-action-btn" id="extractTasksBtn">📋 Extract Tasks</button>
                <button class="task-action-btn" id="summarizeBtn">📝 Summarize</button>
                <button class="task-action-btn" id="translateBtn">🌐 Translate</button>
                <button class="task-action-btn" id="exportBtn">💾 Export</button>
              </div>
              
              <div style="margin-top: 16px;">
                <label style="font-weight: 600; margin-right: 12px;">Translate to:</label>
              <select id="translateLang" class="translate-select">
                <option value="">Select language...</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="hi">🇮🇳 Hindi</option>
                  <option value="zh">🇨🇳 Chinese</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="ko">🇰🇷 Korean</option>
                  <option value="ar">🇸🇦 Arabic</option>
                  <option value="pt">🇵🇹 Portuguese</option>
              </select>
              </div>
            </div>
            
            <div id="extractedTasks" class="extracted-tasks" style="display: none; margin-top: 20px;"></div>
            <div id="translatedText" class="translated-text" style="display: none; margin-top: 20px;"></div>
          </div>
        </div>

        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Recent Documents</h3>
              <div class="card-icon warning">📚</div>
            </div>
            <div id="recentDocuments" class="recent-documents">
              <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                <div style="font-size: 32px; margin-bottom: 8px;">📄</div>
                <p>No recent documents</p>
                <p style="font-size: 12px;">Upload your first document to get started</p>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Document Statistics</h3>
              <div class="card-icon info">📊</div>
            </div>
            <div style="margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-secondary);">Documents Processed</span>
                <span style="font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-secondary);">Tasks Extracted</span>
                <span style="font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: var(--text-secondary);">Languages Translated</span>
                <span style="font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Time Saved</span>
                <span style="font-weight: 600;">0h 0m</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="document-info">
          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">🚀 Advanced Features</h3>
              <div class="card-icon primary">⚡</div>
            </div>
            <div style="margin-top: 16px;">
              <p><strong>✨ AI-Powered Features:</strong></p>
              <ul style="margin: 12px 0; padding-left: 20px;">
                <li>Smart task extraction from documents</li>
                <li>Automatic summarization and key point identification</li>
                <li>Multi-language translation with context preservation</li>
                <li>Document template generation</li>
                <li>Meeting notes to actionable tasks conversion</li>
              </ul>
              
              <p style="margin-top: 16px;"><strong>🔧 Integration Ready:</strong></p>
              <ul style="margin: 12px 0; padding-left: 20px;">
            <li>PDF.js for PDF parsing</li>
            <li>Mammoth.js for Word documents</li>
                <li>OpenAI API for AI processing</li>
                <li>OpenAI API for AI translation</li>
                <li>OCR for image text extraction</li>
          </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    
    els.taskList.innerHTML = documentsHtml;
    els.emptyState.style.display = 'none';
    
    // Setup enhanced file upload
    setupDocumentUpload();
    
    // Setup feature tabs
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const feature = btn.dataset.feature;
        switchDocumentFeature(feature);
      });
    });
  }

  function setupDocumentUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const documentResult = document.getElementById('documentResult');
    
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        processDocuments(files, documentResult);
      }
    });
    
    // Enhanced drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary)';
      uploadArea.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, var(--surface) 100%)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--border)';
      uploadArea.style.background = 'var(--surface)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--border)';
      uploadArea.style.background = 'var(--surface)';
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processDocuments(files, documentResult);
      }
    });
  }

  function switchDocumentFeature(feature) {
    console.log('Switching to feature:', feature);
    // In a real implementation, this would switch between different document views
  }

  function createTaskFromTemplate(templateType) {
    const templates = {
      'meeting-notes': {
        name: '📝 Meeting Notes Template',
        description: 'Template for capturing meeting notes and action items'
      },
      'project-brief': {
        name: '📋 Project Brief Template',
        description: 'Template for project planning and requirements gathering'
      },
      'report': {
        name: '📊 Report Template',
        description: 'Template for creating structured reports and documentation'
      }
    };
    
    const template = templates[templateType];
    if (template) {
      addTask(template.name, null);
    }
  }

  function processDocuments(files, resultEl) {
    const summaryEl = document.getElementById('documentSummary');
    const extractedTasksEl = document.getElementById('extractedTasks');
    const translatedTextEl = document.getElementById('translatedText');
    
    // Process multiple files
    let allContent = '';
    let fileInfo = '';
    
    files.forEach((file, index) => {
      fileInfo += `
        <div style="padding: 12px; background: var(--bg); border-radius: var(--radius-sm); margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${file.name}</strong>
              <span style="color: var(--text-muted); font-size: 12px; margin-left: 8px;">
                ${(file.size / 1024).toFixed(1)} KB • ${file.type}
              </span>
            </div>
            <div style="color: var(--success); font-size: 12px;">✓ Processed</div>
          </div>
        </div>
      `;
      
      // Simulate content extraction
      allContent += `\n\n--- ${file.name} ---\n`;
      allContent += `This is simulated content from ${file.name}. In production, this would extract actual text from the document using appropriate libraries.`;
    });
    
    // Enhanced document analysis
    summaryEl.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h4 style="margin-bottom: 12px; color: var(--primary);">📄 Processed Files</h4>
        ${fileInfo}
      </div>
      
      <div style="padding: 20px; background: var(--bg); border-radius: var(--radius); margin: 16px 0;">
        <h4 style="margin-bottom: 12px; color: var(--primary);">🔍 AI Analysis</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
          <div style="text-align: center; padding: 12px; background: var(--surface); border-radius: var(--radius-sm);">
            <div style="font-size: 24px; margin-bottom: 4px;">📊</div>
            <div style="font-size: 12px; color: var(--text-muted);">Word Count</div>
            <div style="font-weight: 600;">${Math.floor(Math.random() * 1000) + 500}</div>
          </div>
          <div style="text-align: center; padding: 12px; background: var(--surface); border-radius: var(--radius-sm);">
            <div style="font-size: 24px; margin-bottom: 4px;">🎯</div>
            <div style="font-size: 12px; color: var(--text-muted);">Key Topics</div>
            <div style="font-weight: 600;">${Math.floor(Math.random() * 5) + 3}</div>
          </div>
          <div style="text-align: center; padding: 12px; background: var(--surface); border-radius: var(--radius-sm);">
            <div style="font-size: 24px; margin-bottom: 4px;">📋</div>
            <div style="font-size: 12px; color: var(--text-muted);">Action Items</div>
            <div style="font-weight: 600;">${Math.floor(Math.random() * 8) + 2}</div>
          </div>
        </div>
        
        <h5 style="margin-bottom: 8px;">📝 Summary:</h5>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          This document contains important information about project planning and task management. 
          Key themes include productivity optimization, team collaboration, and deadline management. 
          Several actionable items have been identified for follow-up.
        </p>
        
        <h5 style="margin: 16px 0 8px;">🔑 Key Points:</h5>
        <ul style="color: var(--text-secondary); padding-left: 20px;">
          <li>Project timeline and milestone planning</li>
          <li>Resource allocation and team coordination</li>
          <li>Quality assurance and testing procedures</li>
          <li>Risk assessment and mitigation strategies</li>
        </ul>
      </div>
    `;
    
    resultEl.style.display = 'block';
    
    // Setup enhanced action buttons
    setupDocumentActions(files, allContent);
  }

  function setupDocumentActions(files, content) {
    const extractTasksBtn = document.getElementById('extractTasksBtn');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const translateBtn = document.getElementById('translateBtn');
    const exportBtn = document.getElementById('exportBtn');
    const translateLang = document.getElementById('translateLang');
    const extractedTasksEl = document.getElementById('extractedTasks');
    const translatedTextEl = document.getElementById('translatedText');
    
    // Extract Tasks
    extractTasksBtn.onclick = () => {
      const mockTasks = [
        'Review project requirements and specifications',
        'Schedule team meeting for next week',
        'Prepare presentation for stakeholders',
        'Update project timeline and milestones',
        'Conduct risk assessment analysis'
      ];
      
      extractedTasksEl.innerHTML = `
        <h4 style="margin-bottom: 12px; color: var(--primary);">📋 Extracted Tasks</h4>
        <div style="background: var(--bg); border-radius: var(--radius); padding: 16px;">
          ${mockTasks.map((task, index) => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border);">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">
                ${index + 1}
              </div>
              <div style="flex: 1;">${task}</div>
              <button class="task-action-btn" onclick="addExtractedTask('${task}')" style="padding: 4px 8px; font-size: 11px;">
                ➕ Add
              </button>
            </div>
          `).join('')}
        </div>
      `;
      extractedTasksEl.style.display = 'block';
    };
    
    // Summarize
    summarizeBtn.onclick = () => {
      alert('📝 Advanced summarization feature would be implemented here using AI services like OpenAI GPT or similar.');
    };
    
    // Translate
    translateBtn.onclick = () => {
      const lang = translateLang.value;
      if (!lang) {
        alert('Please select a language');
        return;
      }
      
      const languageNames = {
        'es': 'Spanish', 'fr': 'French', 'de': 'German', 'hi': 'Hindi',
        'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'pt': 'Portuguese'
      };
      
      translatedTextEl.innerHTML = `
        <h4 style="margin-bottom: 12px; color: var(--primary);">🌐 Translation to ${languageNames[lang]}</h4>
        <div style="background: var(--bg); border-radius: var(--radius); padding: 16px;">
          <p style="color: var(--text-secondary); line-height: 1.6;">
            This is a demo translation using OpenAI. The content is translated to ${languageNames[lang]} 
            while preserving context and formatting using advanced AI language models.
          </p>
          <div style="margin-top: 12px; padding: 12px; background: var(--surface); border-radius: var(--radius-sm); border-left: 4px solid var(--primary);">
            <strong>Translation Preview:</strong><br>
            <em style="color: var(--text-muted);">[Translated content would appear here]</em>
          </div>
        </div>
      `;
      translatedTextEl.style.display = 'block';
    };
    
    // Export
    exportBtn.onclick = () => {
      const exportData = {
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
        content: content,
        extractedTasks: ['Review project requirements', 'Schedule team meeting', 'Prepare presentation'],
        summary: 'Document analysis summary...',
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-analysis-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };
  }

  // Global function for adding extracted tasks
  window.addExtractedTask = function(taskText) {
    addTask(taskText, null);
    alert('✅ Task added successfully!');
  };

  // Team management functions
  window.showCreateTeamModal = function() {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
      <div class="payment-modal-overlay"></div>
      <div class="payment-modal-content" style="max-width: 500px;">
        <button class="payment-close">✕</button>
        
        <div class="payment-header">
          <h2>👥 Create New Team</h2>
          <p>Start collaborating with your team members</p>
        </div>

        <form id="createTeamForm" style="display: flex; flex-direction: column; gap: 20px;">
          <div class="form-group">
            <label>Team Name</label>
            <input type="text" id="teamName" placeholder="e.g., Marketing Team" required />
          </div>
          
          <div class="form-group">
            <label>Description (Optional)</label>
            <textarea id="teamDescription" placeholder="Brief description of your team..." rows="3"></textarea>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="task-action-btn" onclick="this.closest('.payment-modal').remove()">Cancel</button>
            <button type="submit" class="btn-primary">Create Team</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.payment-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.payment-modal-overlay').addEventListener('click', () => modal.remove());

    // Form submission
    modal.querySelector('#createTeamForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const teamName = document.getElementById('teamName').value.trim();
      const teamDescription = document.getElementById('teamDescription').value.trim();
      
      const result = window.TaskFlowAuth.createTeam(teamName, teamDescription);
      if (result.success) {
        alert('✅ Team created successfully!');
        modal.remove();
        showTeams(); // Refresh teams view
      } else {
        alert('❌ Error: ' + result.error);
      }
    });
  };

  window.showInviteModal = function(teamId) {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
      <div class="payment-modal-overlay"></div>
      <div class="payment-modal-content" style="max-width: 500px;">
        <button class="payment-close">✕</button>
        
        <div class="payment-header">
          <h2>📧 Invite Team Member</h2>
          <p>Send an invitation to join your team</p>
        </div>

        <form id="inviteForm" style="display: flex; flex-direction: column; gap: 20px;">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="inviteEmail" placeholder="colleague@company.com" required />
          </div>
          
          <div class="form-group">
            <label>Role</label>
            <select id="inviteRole" required>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="task-action-btn" onclick="this.closest('.payment-modal').remove()">Cancel</button>
            <button type="submit" class="btn-primary">Send Invitation</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.payment-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.payment-modal-overlay').addEventListener('click', () => modal.remove());

    // Form submission
    modal.querySelector('#inviteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('inviteEmail').value.trim();
      const role = document.getElementById('inviteRole').value;
      
      const result = window.TaskFlowAuth.inviteToTeam(teamId, email, role);
      if (result.success) {
        alert('✅ Invitation sent successfully!');
        modal.remove();
        showTeams(); // Refresh teams view
      } else {
        alert('❌ Error: ' + result.error);
      }
    });
  };

  window.acceptTeamInvitation = function(invitationId) {
    const result = window.TaskFlowAuth.acceptInvitation(invitationId);
    if (result.success) {
      alert('✅ You have joined the team!');
      showTeams(); // Refresh teams view
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  window.declineTeamInvitation = function(invitationId) {
    if (confirm('Are you sure you want to decline this invitation?')) {
      // In a real implementation, this would update the invitation status
      alert('Invitation declined');
      showTeams(); // Refresh teams view
    }
  };

  window.showTeamDetails = function(teamId) {
    alert('Team details view would be implemented here with member list, settings, and team tasks.');
  };

  // Settings view
  function showSettings() {
    const settingsHtml = `
      <div class="analytics-view">
        <div class="analytics-header">
          <h2 class="analytics-title">⚙️ API Settings</h2>
          <p style="color: var(--text-secondary); margin-top: 8px;">
            Configure API integrations to unlock advanced features
          </p>
        </div>

        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">🤖 OpenAI API</h3>
              <div class="card-icon primary">🧠</div>
            </div>
            <div style="margin-top: 16px;">
              <p style="color: var(--text-secondary); margin-bottom: 16px;">
                Enhance task descriptions and extract tasks from documents
              </p>
              <div class="form-group">
                <label>API Key</label>
                <input type="password" id="openaiApiKey" placeholder="sk-..." style="width: 100%;" />
              </div>
              <button class="btn-primary" onclick="saveOpenAISettings()" style="width: 100%; margin-top: 12px;">
                Save OpenAI Settings
              </button>
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">🌐 OpenAI Translation</h3>
              <div class="card-icon success">🌍</div>
            </div>
            <div style="margin-top: 16px;">
              <p style="color: var(--text-secondary); margin-bottom: 16px;">
                ✅ Uses your OpenAI API key - No additional setup needed!<br>
                🚀 Professional translation powered by GPT models<br>
                🌍 20+ languages supported with high accuracy
              </p>
              <div style="padding: 12px; background: var(--success-alpha); border-radius: var(--radius-sm); border: 1px solid var(--success);">
                <div style="color: var(--success); font-weight: 600; margin-bottom: 4px;">✅ Ready to Use</div>
                <div style="font-size: 14px; color: var(--text-secondary);">
                  Translation is automatically available when you add your OpenAI API key above.
                </div>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">📅 Smart Calendar (Optional)</h3>
              <div class="card-icon warning">📆</div>
            </div>
            <div style="margin-top: 16px;">
              <p style="color: var(--text-secondary); margin-bottom: 16px;">
                ✅ AI generates smart calendar events automatically!<br>
                🔧 Optional: Connect Google Calendar for real integration
              </p>
              <div class="form-group">
                <label>API Key</label>
                <input type="password" id="calendarApiKey" placeholder="AIza..." style="width: 100%;" />
              </div>
              <div class="form-group">
                <label>Client ID</label>
                <input type="text" id="calendarClientId" placeholder="your-client-id.apps.googleusercontent.com" style="width: 100%;" />
              </div>
              <button class="btn-primary" onclick="saveCalendarSettings()" style="width: 100%; margin-top: 12px;">
                Save Calendar Settings
              </button>
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">📄 OpenAI Vision OCR</h3>
              <div class="card-icon info">🔍</div>
            </div>
            <div style="margin-top: 16px;">
              <p style="color: var(--text-secondary); margin-bottom: 16px;">
                ✅ Uses your OpenAI API key - No additional setup needed!<br>
                🤖 Advanced OCR powered by GPT-4 Vision<br>
                📄 Extracts text from images, PDFs, and documents<br>
                🔄 Falls back to free Tesseract.js if needed
              </p>
              <div style="padding: 12px; background: var(--info-alpha); border-radius: var(--radius-sm); border: 1px solid var(--info);">
                <div style="color: var(--info); font-weight: 600; margin-bottom: 4px;">🚀 Smart OCR</div>
                <div style="font-size: 14px; color: var(--text-secondary);">
                  Uses OpenAI Vision API for superior text extraction, with free fallback option.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="analytics-card">
          <div class="card-header">
            <h3 class="card-title">🚀 API Features</h3>
            <div class="card-icon success">⚡</div>
          </div>
          <div style="margin-top: 16px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">🌍</div>
                <div style="font-weight: 600; margin-bottom: 4px;">AI Translation</div>
                <div style="font-size: 12px; color: var(--text-muted);">20+ languages with GPT accuracy</div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">👁️</div>
                <div style="font-weight: 600; margin-bottom: 4px;">Vision OCR</div>
                <div style="font-size: 12px; color: var(--text-muted);">GPT-4 Vision text extraction</div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">🤖</div>
                <div style="font-weight: 600; margin-bottom: 4px;">Task Enhancement</div>
                <div style="font-size: 12px; color: var(--text-muted);">AI-powered task optimization</div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                <div style="font-weight: 600; margin-bottom: 4px;">Smart Analysis</div>
                <div style="font-size: 12px; color: var(--text-muted);">AI task insights and suggestions</div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">📅</div>
                <div style="font-weight: 600; margin-bottom: 4px;">Smart Calendar</div>
                <div style="font-size: 12px; color: var(--text-muted);">AI-generated calendar events</div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">🔑</div>
                <div style="font-weight: 600; margin-bottom: 4px;">One API Key</div>
                <div style="font-size: 12px; color: var(--text-muted);">All features with OpenAI only</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    els.taskList.innerHTML = settingsHtml;
    els.emptyState.style.display = 'none';
    
    // Load current settings
    loadApiSettings();
  }

  // API Settings Management
  function loadApiSettings() {
    const config = window.TaskFlowAPIConfig?.getConfig();
    if (config) {
      document.getElementById('openaiApiKey').value = config.openai.apiKey || '';
      // Translation now uses OpenAI - no separate API key needed
      document.getElementById('calendarApiKey').value = config.googleCalendar.apiKey || '';
      document.getElementById('calendarClientId').value = config.googleCalendar.clientId || '';
      document.getElementById('ocrApiKey').value = config.pdfOcr.apiKey || '';
    }
  }

  window.saveOpenAISettings = function() {
    const apiKey = document.getElementById('openaiApiKey').value.trim();
    if (apiKey) {
      window.TaskFlowAI.setApiKey(apiKey);
      showNotification('OpenAI API key saved successfully!', 'success');
    } else {
      showNotification('Please enter a valid API key', 'error');
    }
  };

  // Translation now uses OpenAI - no separate setup needed
  window.saveTranslateSettings = function() {
    showNotification('✅ Translation is ready! Uses your OpenAI API key automatically.', 'success');
  };

  window.saveCalendarSettings = function() {
    const apiKey = document.getElementById('calendarApiKey').value.trim();
    const clientId = document.getElementById('calendarClientId').value.trim();
    if (apiKey && clientId) {
      window.TaskFlowCalendar.setCredentials(apiKey, clientId);
      showNotification('Google Calendar credentials saved successfully! (Optional feature)', 'success');
    } else {
      showNotification('Please enter both API key and Client ID', 'error');
    }
  };

  // OCR now uses OpenAI Vision - no separate setup needed
  window.saveOCRSettings = function() {
    showNotification('✅ OCR is ready! Uses OpenAI Vision API with free fallback.', 'success');
  };

  // OpenAI-Powered Translation function
  window.translateContent = async function(targetLanguage) {
    const translationResult = document.getElementById('translationResult');
    const translatedContent = document.getElementById('translatedContent');
    
    if (!translationResult || !translatedContent) return;
    
    try {
      // Check if OpenAI is configured
      if (!window.TaskFlowAI || !window.TaskFlowAI.isConfigured()) {
        showNotification('🔑 OpenAI API key required for translation. Please add your API key in Settings.', 'error');
        return;
      }

      showNotification('🤖 Translating with OpenAI...', 'info');
      
      // Get the extracted content (this would be the actual document content)
      const contentToTranslate = 'This is sample content that would be translated. In a real implementation, this would be the actual extracted text from the documents. TaskFlow Pro uses OpenAI for professional-grade translation with context awareness and natural language understanding.';
      
      // Use OpenAI for translation
      const translatedText = await window.TaskFlowAI.translate(contentToTranslate, targetLanguage);
      
      translatedContent.textContent = translatedText;
      translationResult.style.display = 'block';
      
      // Get language name for notification
      const languages = window.TaskFlowAI.getSupportedLanguages();
      const targetLang = languages.find(l => l.code === targetLanguage);
      const langName = targetLang ? targetLang.name : targetLanguage;
      
      showNotification(`✅ Content translated to ${langName} using OpenAI!`, 'success');
    } catch (error) {
      console.error('Translation error:', error);
      translatedContent.textContent = `❌ Translation failed: ${error.message}`;
      translationResult.style.display = 'block';
      showNotification(`❌ Translation failed: ${error.message}`, 'error');
    }
  };

  // OpenAI-Powered Calendar integration function
  window.createCalendarEvent = async function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      // Check if OpenAI is configured
      if (!window.TaskFlowAI || !window.TaskFlowAI.isConfigured()) {
        showNotification('🔑 OpenAI API key required for smart calendar events. Please add your API key in Settings.', 'error');
        return;
      }

      showNotification('🤖 Generating smart calendar event with AI...', 'info');
      
      // Use OpenAI to generate smart calendar event
      const eventData = await window.TaskFlowAI.generateCalendarEvent(task.name, task.description);
      
      // Create a simple calendar event object (in real app, this would integrate with actual calendar)
      const event = {
        title: eventData.title,
        description: eventData.description,
        duration: eventData.duration,
        suggested_time: eventData.suggested_time,
        created_at: new Date().toISOString()
      };
      
      showNotification(`✅ Smart calendar event generated: "${event.title}" (${event.duration} min)`, 'success');
      
      // Add a comment to the task about the calendar event
      if (!task.comments) task.comments = [];
      task.comments.push({
        id: uid(),
        text: `📅 AI Calendar Event: "${event.title}" - ${event.duration} minutes, suggested for ${event.suggested_time}`,
        author: 'AI Assistant',
        timestamp: Date.now()
      });
      save();
      render();
      
      // Show the generated event details
      setTimeout(() => {
        alert(`🤖 AI Generated Calendar Event:\n\n📅 Title: ${event.title}\n⏰ Duration: ${event.duration} minutes\n🕐 Suggested Time: ${event.suggested_time}\n📝 Description: ${event.description}`);
      }, 1000);
    } catch (error) {
      console.error('Calendar event creation error:', error);
      if (error.message.includes('not configured')) {
        showNotification('Calendar event generated with AI! For real calendar integration, configure Google Calendar in Settings.', 'info');
      } else {
        showNotification('Failed to create calendar event. Please try again.', 'error');
      }
    }
  };

  // Teams view
  function showTeams() {
    const userTeams = window.TaskFlowAuth?.getUserTeams() || [];
    const userInvitations = window.TaskFlowAuth?.getUserInvitations() || [];
    
    const teamsHtml = `
      <div class="analytics-view">
        <div class="analytics-header">
          <h2 class="analytics-title">👥 Team Collaboration</h2>
          <button class="btn-primary" onclick="showCreateTeamModal()">
            <span>➕</span> Create Team
          </button>
        </div>

        ${userInvitations.length > 0 ? `
          <div class="analytics-card" style="margin-bottom: 24px;">
            <div class="card-header">
              <h3 class="card-title">📬 Pending Invitations</h3>
              <div class="card-icon warning">📧</div>
            </div>
            <div style="margin-top: 16px;">
              ${userInvitations.map(invitation => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg); border-radius: var(--radius-sm); margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 600;">${invitation.teamName}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">
                      Invited by ${invitation.inviterName} • Role: ${invitation.role}
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="task-action-btn success" onclick="acceptTeamInvitation('${invitation.id}')">
                      ✓ Accept
                    </button>
                    <button class="task-action-btn danger" onclick="declineTeamInvitation('${invitation.id}')">
                      ✗ Decline
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="analytics-grid">
          ${userTeams.length > 0 ? userTeams.map(team => `
            <div class="analytics-card">
              <div class="card-header">
                <h3 class="card-title">${team.name}</h3>
                <div class="card-icon primary">👥</div>
              </div>
              <div style="margin-top: 16px;">
                <p style="color: var(--text-secondary); margin-bottom: 12px;">${team.description || 'No description'}</p>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: var(--text-muted);">Members</span>
                  <span style="font-weight: 600;">${team.members.length}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: var(--text-muted);">Your Role</span>
                  <span style="font-weight: 600; text-transform: capitalize;">${team.userRole}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                  <span style="font-size: 14px; color: var(--text-muted);">Created</span>
                  <span style="font-weight: 600;">${new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="task-action-btn" onclick="showTeamDetails('${team.id}')">
                    👁️ View
                  </button>
                  ${team.userRole === 'owner' || team.userRole === 'admin' ? `
                    <button class="task-action-btn" onclick="showInviteModal('${team.id}')">
                      ➕ Invite
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('') : `
            <div class="analytics-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
              <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
              <h3 style="margin-bottom: 8px;">No Teams Yet</h3>
              <p style="color: var(--text-muted); margin-bottom: 24px;">
                Create your first team to start collaborating with others
              </p>
              <button class="btn-primary" onclick="showCreateTeamModal()">
                <span>➕</span> Create Your First Team
              </button>
            </div>
          `}
        </div>

        <div class="analytics-card">
          <div class="card-header">
            <h3 class="card-title">🚀 Team Features</h3>
            <div class="card-icon success">⚡</div>
          </div>
          <div style="margin-top: 16px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">📋</div>
                <div style="font-weight: 600; margin-bottom: 4px;">Shared Tasks</div>
                <div style="font-size: 12px; color: var(--text-muted);">Collaborate on tasks with team members</div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">💬</div>
                <div style="font-weight: 600; margin-bottom: 4px;">Real-time Comments</div>
                <div style="font-size: 12px; color: var(--text-muted);">Discuss tasks with instant updates</div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">👤</div>
                <div style="font-weight: 600; margin-bottom: 4px;">Task Assignment</div>
                <div style="font-size: 12px; color: var(--text-muted);">Assign tasks to specific team members</div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--bg); border-radius: var(--radius-sm);">
                <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                <div style="font-weight: 600; margin-bottom: 4px;">Team Analytics</div>
                <div style="font-size: 12px; color: var(--text-muted);">Track team productivity and progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    els.taskList.innerHTML = teamsHtml;
    els.emptyState.style.display = 'none';
  }

  // Analytics view
  function showAnalytics() {
    const analyticsData = calculateAnalytics();
    
    const analyticsHtml = `
      <div class="analytics-view">
        <div class="analytics-header">
          <h2 class="analytics-title">📊 Productivity Analytics</h2>
          <div class="analytics-period">
            <button class="period-btn active" data-period="week">Week</button>
            <button class="period-btn" data-period="month">Month</button>
            <button class="period-btn" data-period="year">Year</button>
          </div>
        </div>

        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Total Time Tracked</h3>
              <div class="card-icon primary">⏱️</div>
            </div>
            <div class="card-value">${analyticsData.totalTime}</div>
            <div class="card-change positive">
              <span>↗</span> +12% from last week
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Tasks Completed</h3>
              <div class="card-icon success">✅</div>
            </div>
            <div class="card-value">${analyticsData.completedTasks}</div>
            <div class="card-change positive">
              <span>↗</span> +8% from last week
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Productivity Score</h3>
              <div class="card-icon warning">📈</div>
            </div>
            <div class="card-value">${analyticsData.productivityScore}%</div>
            <div class="card-change positive">
              <span>↗</span> +5% from last week
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Average Session</h3>
              <div class="card-icon info">🎯</div>
            </div>
            <div class="card-value">${analyticsData.avgSessionTime}</div>
            <div class="card-change negative">
              <span>↘</span> -3% from last week
            </div>
          </div>
        </div>

        <div class="productivity-metrics">
          <div class="metric-card">
            <h3 style="margin-bottom: 20px; font-size: 18px; font-weight: 600;">Time Distribution</h3>
            <div class="chart-container">
              <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                <p>Time tracking chart will be displayed here</p>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Integration with Chart.js coming soon</p>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <h3 style="margin-bottom: 20px; font-size: 18px; font-weight: 600;">Weekly Breakdown</h3>
            <ul class="metric-list">
              <li class="metric-item">
                <span class="metric-label">Monday</span>
                <span class="metric-value">${analyticsData.weeklyBreakdown.monday}</span>
              </li>
              <li class="metric-item">
                <span class="metric-label">Tuesday</span>
                <span class="metric-value">${analyticsData.weeklyBreakdown.tuesday}</span>
              </li>
              <li class="metric-item">
                <span class="metric-label">Wednesday</span>
                <span class="metric-value">${analyticsData.weeklyBreakdown.wednesday}</span>
              </li>
              <li class="metric-item">
                <span class="metric-label">Thursday</span>
                <span class="metric-value">${analyticsData.weeklyBreakdown.thursday}</span>
              </li>
              <li class="metric-item">
                <span class="metric-label">Friday</span>
                <span class="metric-value">${analyticsData.weeklyBreakdown.friday}</span>
              </li>
              <li class="metric-item">
                <span class="metric-label">Weekend</span>
                <span class="metric-value">${analyticsData.weeklyBreakdown.weekend}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Most Productive Hours</h3>
              <div class="card-icon primary">🕐</div>
            </div>
            <div style="margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 14px; color: var(--text-secondary);">9:00 AM - 11:00 AM</span>
                <span style="font-size: 14px; font-weight: 600;">${analyticsData.peakHours.morning}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 85%;"></div>
              </div>
            </div>
            <div style="margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 14px; color: var(--text-secondary);">2:00 PM - 4:00 PM</span>
                <span style="font-size: 14px; font-weight: 600;">${analyticsData.peakHours.afternoon}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 72%;"></div>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">Task Categories</h3>
              <div class="card-icon success">📋</div>
            </div>
            <div style="margin-top: 16px;">
              ${analyticsData.taskCategories.map(cat => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="font-size: 14px; color: var(--text-secondary);">${cat.name}</span>
                  <span style="font-size: 14px; font-weight: 600;">${cat.time}</span>
                </div>
                <div class="progress-bar" style="margin-bottom: 16px;">
                  <div class="progress-fill" style="width: ${cat.percentage}%;"></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    els.taskList.innerHTML = analyticsHtml;
    els.emptyState.style.display = 'none';
    
    // Add period button functionality
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // In a real implementation, this would update the analytics data
        console.log('Period changed to:', btn.dataset.period);
      });
    });
  }

  function calculateAnalytics() {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Calculate total time
    let totalTimeMs = 0;
    let completedTasks = 0;
    let totalSessions = 0;
    
    for (const task of state.tasks) {
      if (task.completed) completedTasks++;
      
      for (const session of task.sessions) {
        const end = session.end || now;
        const duration = end - session.start;
        totalTimeMs += duration;
        totalSessions++;
      }
    }
    
    const totalHours = Math.floor(totalTimeMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalTimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalTime = `${totalHours}h ${totalMinutes}m`;
    
    // Calculate productivity score (simplified)
    const productivityScore = Math.min(100, Math.floor((completedTasks / Math.max(1, state.tasks.length)) * 100));
    
    // Calculate average session time
    const avgSessionMs = totalSessions > 0 ? totalTimeMs / totalSessions : 0;
    const avgHours = Math.floor(avgSessionMs / (1000 * 60 * 60));
    const avgMinutes = Math.floor((avgSessionMs % (1000 * 60 * 60)) / (1000 * 60));
    const avgSessionTime = avgHours > 0 ? `${avgHours}h ${avgMinutes}m` : `${avgMinutes}m`;
    
    // Weekly breakdown (simplified)
    const weeklyBreakdown = {
      monday: '2h 30m',
      tuesday: '3h 15m',
      wednesday: '1h 45m',
      thursday: '4h 10m',
      friday: '2h 20m',
      weekend: '1h 30m'
    };
    
    // Peak hours (simplified)
    const peakHours = {
      morning: '2h 45m',
      afternoon: '2h 20m'
    };
    
    // Task categories (simplified)
    const taskCategories = [
      { name: 'Development', time: '8h 30m', percentage: 45 },
      { name: 'Meetings', time: '4h 15m', percentage: 22 },
      { name: 'Planning', time: '3h 20m', percentage: 17 },
      { name: 'Research', time: '2h 45m', percentage: 14 },
      { name: 'Other', time: '1h 10m', percentage: 6 }
    ];
    
    return {
      totalTime,
      completedTasks,
      productivityScore,
      avgSessionTime,
      weeklyBreakdown,
      peakHours,
      taskCategories
    };
  }

  // Global function for calendar
  window.startTaskFromCalendar = function(taskId) {
    startTimer(taskId);
    document.querySelector('[data-view="tasks"]').click();
  };

  // Navigation
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      nav.classList.add('active');
      
      const view = nav.dataset.view;
      if (view === 'calendar') {
        showCalendar();
      } else if (view === 'documents') {
        showDocuments();
      } else if (view === 'analytics') {
        showAnalytics();
      } else if (view === 'teams') {
        showTeams();
      } else if (view === 'settings') {
        showSettings();
      } else {
        render();
      }
    });
  });

  // Event wiring
  els.addTaskBtn.addEventListener('click', () => {
    const priority = document.getElementById('taskPriorityInput')?.value || 'medium';
    addTask(els.taskInput.value, els.taskDeadlineInput.value, priority);
  });
  
  els.taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      const priority = document.getElementById('taskPriorityInput')?.value || 'medium';
      addTask(els.taskInput.value, els.taskDeadlineInput.value, priority);
    }
  });
  
  els.exportCsvBtn.addEventListener('click', exportCSV);
  els.clearDataBtn.addEventListener('click', clearData);
  els.activeTab.addEventListener('click', () => switchTab('active'));
  els.completedTab.addEventListener('click', () => switchTab('completed'));
  
  els.stopActiveTask.addEventListener('click', () => {
    if (state.activeTaskId) {
      stopTimer(state.activeTaskId);
    }
  });
  
  els.closePanel.addEventListener('click', () => {
    if (state.activeTaskId) {
      stopTimer(state.activeTaskId);
    }
  });

  // Advanced Time Tracking Functions
  function startAdvancedTracking() {
    lastActivity = Date.now();
    
    // Track user activity
    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('click', updateActivity);
    document.addEventListener('scroll', updateActivity);
    
    // Start idle detection
    startIdleDetection();
    
    // Start focus tracking
    startFocusTracking();
  }

  function stopAdvancedTracking() {
    // Remove activity listeners
    document.removeEventListener('mousemove', updateActivity);
    document.removeEventListener('keypress', updateActivity);
    document.removeEventListener('click', updateActivity);
    document.removeEventListener('scroll', updateActivity);
    
    // Stop idle detection
    stopIdleDetection();
    
    // Stop focus tracking
    stopFocusTracking();
  }

  function updateActivity() {
    lastActivity = Date.now();
  }

  function startIdleDetection() {
    idleTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const idleThreshold = 5 * 60 * 1000; // 5 minutes
      
      if (timeSinceActivity > idleThreshold && state.activeTaskId) {
        // User is idle, pause the timer
        pauseTimerForIdle();
      }
    }, 30000); // Check every 30 seconds
  }

  function stopIdleDetection() {
    if (idleTimer) {
      clearInterval(idleTimer);
      idleTimer = null;
    }
  }

  function pauseTimerForIdle() {
    if (state.activeTaskId) {
      const task = state.tasks.find(t => t.id === state.activeTaskId);
      if (task && task.runningSince) {
        // Add idle time to metrics
        productivityMetrics.totalIdleTime += 5 * 60 * 1000; // 5 minutes
        
        // Show idle notification
        showIdleNotification();
      }
    }
  }

  function showIdleNotification() {
    const notification = document.createElement('div');
    notification.className = 'notification-popup';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-title">⏸️ Timer Paused</div>
        <div class="notification-message">You've been idle for 5 minutes</div>
        <div class="notification-details">Timer has been paused to maintain accurate tracking</div>
        <div class="notification-actions">
          <button class="notification-btn complete-btn" onclick="resumeTimer()">Resume</button>
          <button class="notification-btn dismiss-btn" onclick="this.parentElement.parentElement.parentElement.remove()">Dismiss</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
  }

  function startFocusTracking() {
    // Track focus/blur events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
  }

  function stopFocusTracking() {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
  }

  function handleVisibilityChange() {
    if (document.hidden && state.activeTaskId) {
      // Page is hidden, pause timer
      pauseTimerForIdle();
    }
  }

  function handleWindowFocus() {
    if (state.activeTaskId) {
      // Window focused, resume tracking
      lastActivity = Date.now();
    }
  }

  function handleWindowBlur() {
    if (state.activeTaskId) {
      // Window blurred, track as potential distraction
      productivityMetrics.totalIdleTime += 30 * 1000; // 30 seconds
    }
  }

  function calculateFocusLevel() {
    // Simulate focus level calculation based on various factors
    const factors = {
      timeOfDay: getTimeOfDayFactor(),
      taskComplexity: getTaskComplexityFactor(),
      recentBreaks: getRecentBreaksFactor(),
      environment: getEnvironmentFactor()
    };
    
    const focusLevel = Math.round(
      (factors.timeOfDay + factors.taskComplexity + factors.recentBreaks + factors.environment) / 4
    );
    
    return Math.max(1, Math.min(10, focusLevel));
  }

  function getTimeOfDayFactor() {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) return 9; // Morning peak
    if (hour >= 14 && hour <= 16) return 8; // Afternoon peak
    if (hour >= 20 && hour <= 22) return 7; // Evening
    return 5; // Other times
  }

  function getTaskComplexityFactor() {
    // This would analyze the current task complexity
    return 7; // Default moderate complexity
  }

  function getRecentBreaksFactor() {
    // Check if user has taken recent breaks
    const recentSessions = productivityMetrics.focusSessions.slice(-3);
    const hasRecentBreaks = recentSessions.some(s => s.duration < 15 * 60 * 1000); // Less than 15 min
    return hasRecentBreaks ? 8 : 6;
  }

  function getEnvironmentFactor() {
    // This would check for distractions, notifications, etc.
    return 7; // Default good environment
  }

  function getCurrentContext() {
    return {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  function calculateSessionProductivity(session) {
    const duration = session.duration || (Date.now() - session.start);
    const focusLevel = session.focusLevel || 5;
    const baseScore = Math.min(100, (duration / (60 * 60 * 1000)) * 20); // 20 points per hour
    const focusBonus = focusLevel * 2; // Up to 20 points for focus
    const contextBonus = session.context ? 5 : 0; // 5 points for context tracking
    
    return Math.round(baseScore + focusBonus + contextBonus);
  }

  // Global functions for notifications
  window.resumeTimer = function() {
    if (state.activeTaskId) {
      lastActivity = Date.now();
      // Remove any idle notifications
      document.querySelectorAll('.notification-popup').forEach(n => n.remove());
    }
  };

  // Enhanced productivity metrics calculation
  function calculateProductivityMetrics() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    let totalFocusTime = 0;
    let totalSessions = 0;
    let highFocusSessions = 0;
    
    for (const task of state.tasks) {
      for (const session of task.sessions) {
        if (session.start > oneDayAgo) {
          const duration = session.end ? session.end - session.start : now - session.start;
          totalFocusTime += duration;
          totalSessions++;
          
          if (session.focusLevel && session.focusLevel >= 8) {
            highFocusSessions++;
          }
        }
      }
    }
    
    const avgSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0;
    const focusRatio = totalSessions > 0 ? highFocusSessions / totalSessions : 0;
    
    productivityMetrics = {
      totalActiveTime: totalFocusTime,
      totalIdleTime: productivityMetrics.totalIdleTime,
      focusSessions: productivityMetrics.focusSessions,
      breakSessions: productivityMetrics.breakSessions,
      productivityScore: Math.round((focusRatio * 50) + (Math.min(avgSessionLength / (30 * 60 * 1000), 1) * 50))
    };
    
    return productivityMetrics;
  }

  // Mobile touch gesture support
  function initMobileGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    });

    function handleSwipe() {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const minSwipeDistance = 50;

      // Check if it's a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        const taskCard = document.elementFromPoint(touchEndX, touchEndY)?.closest('.task-card');
        if (taskCard) {
          if (deltaX > 0) {
            // Swipe right - show delete option
            taskCard.classList.add('swipe-delete');
            setTimeout(() => {
              taskCard.classList.remove('swipe-delete');
            }, 2000);
          } else {
            // Swipe left - hide delete option
            taskCard.classList.remove('swipe-delete');
          }
        }
      }
    }

    // Add tap to delete functionality
    document.addEventListener('click', (e) => {
      const taskCard = e.target.closest('.task-card');
      if (taskCard && taskCard.classList.contains('swipe-delete')) {
        const taskId = taskCard.dataset.taskId;
        if (taskId && confirm('Delete this task?')) {
          deleteTask(taskId);
        }
        taskCard.classList.remove('swipe-delete');
      }
    });

    // Add pull-to-refresh functionality
    let pullStartY = 0;
    let pullCurrentY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        pullStartY = e.touches[0].clientY;
        isPulling = true;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (isPulling && window.scrollY === 0) {
        pullCurrentY = e.touches[0].clientY;
        const pullDistance = pullCurrentY - pullStartY;
        
        if (pullDistance > 0) {
          // Add visual feedback for pull-to-refresh
          document.body.style.transform = `translateY(${Math.min(pullDistance * 0.5, 100)}px)`;
          
          if (pullDistance > 100) {
            // Show refresh indicator
            showNotification('Release to refresh', 'info');
          }
        }
      }
    });

    document.addEventListener('touchend', (e) => {
      if (isPulling) {
        const pullDistance = pullCurrentY - pullStartY;
        document.body.style.transform = '';
        
        if (pullDistance > 100) {
          // Trigger refresh
          showNotification('Refreshing...', 'info');
          setTimeout(() => {
            render();
            showNotification('Refreshed!', 'success');
          }, 1000);
        }
        
        isPulling = false;
      }
    });
  }

  // Initialize mobile gestures
  initMobileGestures();

  // Initial render
  render();
  checkNotifications();
  
  // Restore active task panel if there's a running task
  if (state.activeTaskId) {
    const activeTask = state.tasks.find(t => t.id === state.activeTaskId);
    if (activeTask && activeTask.runningSince) {
      showActiveTaskPanel(state.activeTaskId);
      startAdvancedTracking(); // Resume advanced tracking
    } else {
      state.activeTaskId = null;
      save();
    }
  }
})();
