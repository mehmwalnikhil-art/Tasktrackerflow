// Authentication System for TaskFlow Pro
(function() {
  const AUTH_KEY = 'taskflow:auth';
  const USERS_KEY = 'taskflow:users';
  const TEAMS_KEY = 'taskflow:teams';
  const INVITATIONS_KEY = 'taskflow:invitations';

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY));
    } catch {
      return null;
    }
  }

  function setCurrentUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }

  // Improved password hashing with salt
  function hashPassword(password, salt) {
    if (!salt) {
      salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    let hash = salt;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash.charCodeAt(i % hash.length) << 5) - hash.charCodeAt(i % hash.length)) + char;
      hash = String(hash & hash);
    }
    
    // Multiple rounds for better security
    for (let round = 0; round < 1000; round++) {
      let tempHash = 0;
      for (let i = 0; i < hash.length; i++) {
        tempHash = ((tempHash << 5) - tempHash) + hash.charCodeAt(i);
        tempHash = tempHash & tempHash;
      }
      hash = tempHash.toString(36);
    }
    
    return { hash, salt };
  }

  function verifyPassword(password, storedHash, salt) {
    const result = hashPassword(password, salt);
    return result.hash === storedHash;
  }

  function signup(email, password, name) {
    const users = getUsers();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    if (users[email]) {
      return { success: false, error: 'Email already registered' };
    }

    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return { success: false, error: 'Password must contain uppercase, lowercase, and numbers' };
    }

    const { hash, salt } = hashPassword(password);
    
    users[email] = {
      email,
      name: name || email.split('@')[0],
      passwordHash: hash,
      salt: salt,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      userId: generateUserId()
    };

    saveUsers(users);
    return { success: true, user: { email, name: users[email].name, userId: users[email].userId } };
  }

  function generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  function generateTeamId() {
    return 'team_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  function getTeams() {
    try {
      return JSON.parse(localStorage.getItem(TEAMS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveTeams(teams) {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  }

  function getInvitations() {
    try {
      return JSON.parse(localStorage.getItem(INVITATIONS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveInvitations(invitations) {
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
  }

  function createTeam(teamName, description) {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    const teams = getTeams();
    const teamId = generateTeamId();
    
    const team = {
      id: teamId,
      name: teamName,
      description: description || '',
      owner: currentUser.userId,
      members: [{
        userId: currentUser.userId,
        email: currentUser.email,
        name: currentUser.name,
        role: 'owner',
        joinedAt: Date.now()
      }],
      createdAt: Date.now(),
      settings: {
        allowMemberInvites: true,
        defaultTaskVisibility: 'team',
        requireApprovalForTasks: false
      }
    };

    teams[teamId] = team;
    saveTeams(teams);

    // Add team to user's teams
    const users = getUsers();
    if (users[currentUser.email]) {
      if (!users[currentUser.email].teams) {
        users[currentUser.email].teams = [];
      }
      users[currentUser.email].teams.push({
        teamId: teamId,
        role: 'owner',
        joinedAt: Date.now()
      });
      saveUsers(users);
    }

    return { success: true, team: team };
  }

  function inviteToTeam(teamId, email, role = 'member') {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    const teams = getTeams();
    const team = teams[teamId];
    if (!team) return { success: false, error: 'Team not found' };

    // Check if user has permission to invite
    const member = team.members.find(m => m.userId === currentUser.userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Check if user is already a member
    if (team.members.find(m => m.email === email)) {
      return { success: false, error: 'User is already a team member' };
    }

    const invitations = getInvitations();
    const invitationId = 'inv_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    
    const invitation = {
      id: invitationId,
      teamId: teamId,
      teamName: team.name,
      inviterEmail: currentUser.email,
      inviterName: currentUser.name,
      inviteeEmail: email,
      role: role,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    invitations[invitationId] = invitation;
    saveInvitations(invitations);

    return { success: true, invitation: invitation };
  }

  function acceptInvitation(invitationId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    const invitations = getInvitations();
    const invitation = invitations[invitationId];
    if (!invitation) return { success: false, error: 'Invitation not found' };

    if (invitation.inviteeEmail !== currentUser.email) {
      return { success: false, error: 'Invitation not for this user' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation already processed' };
    }

    if (Date.now() > invitation.expiresAt) {
      return { success: false, error: 'Invitation has expired' };
    }

    const teams = getTeams();
    const team = teams[invitation.teamId];
    if (!team) return { success: false, error: 'Team not found' };

    // Add user to team
    team.members.push({
      userId: currentUser.userId,
      email: currentUser.email,
      name: currentUser.name,
      role: invitation.role,
      joinedAt: Date.now()
    });

    // Add team to user's teams
    const users = getUsers();
    if (users[currentUser.email]) {
      if (!users[currentUser.email].teams) {
        users[currentUser.email].teams = [];
      }
      users[currentUser.email].teams.push({
        teamId: invitation.teamId,
        role: invitation.role,
        joinedAt: Date.now()
      });
      saveUsers(users);
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = Date.now();

    saveTeams(teams);
    saveInvitations(invitations);

    return { success: true, team: team };
  }

  function getUserTeams() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const users = getUsers();
    const user = users[currentUser.email];
    if (!user || !user.teams) return [];

    const teams = getTeams();
    return user.teams.map(userTeam => {
      const team = teams[userTeam.teamId];
      return team ? { ...team, userRole: userTeam.role } : null;
    }).filter(Boolean);
  }

  function getUserInvitations() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const invitations = getInvitations();
    return Object.values(invitations).filter(inv => 
      inv.inviteeEmail === currentUser.email && inv.status === 'pending'
    );
  }

  function login(email, password) {
    const users = getUsers();
    const user = users[email];

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!verifyPassword(password, user.passwordHash, user.salt)) {
      return { success: false, error: 'Incorrect password' };
    }

    // Update last login
    user.lastLogin = Date.now();
    saveUsers(users);

    const userData = { 
      email: user.email, 
      name: user.name,
      userId: user.userId,
      createdAt: user.createdAt
    };
    setCurrentUser(userData);
    return { success: true, user: userData };
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.reload();
  }

  function isAuthenticated() {
    return getCurrentUser() !== null;
  }

  function showAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay"></div>
      <div class="auth-modal-content">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
              <path d="M16 8L22 14L16 20L10 14L16 8Z" fill="white"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 id="authTitle">Welcome to TaskFlow Pro</h2>
          <p id="authSubtitle">Sign in to manage your tasks</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Login</button>
          <button class="auth-tab" data-tab="signup">Sign Up</button>
        </div>

        <form id="authForm" class="auth-form">
          <div id="nameField" class="form-group" style="display: none;">
            <label>Full Name</label>
            <input type="text" id="authName" placeholder="John Doe" />
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="authEmail" placeholder="you@example.com" required />
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="authPassword" placeholder="Min 8 chars (A-Z, a-z, 0-9)" required />
            <div id="passwordStrength" class="password-strength"></div>
          </div>

          <div id="authError" class="auth-error"></div>

          <button type="submit" class="auth-submit" id="authSubmit">
            Sign In
          </button>
        </form>

        <div class="auth-footer">
          <p>🔒 Your data is stored locally and securely</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const tabs = modal.querySelectorAll('.auth-tab');
    const nameField = modal.querySelector('#nameField');
    const authTitle = modal.querySelector('#authTitle');
    const authSubtitle = modal.querySelector('#authSubtitle');
    const authSubmit = modal.querySelector('#authSubmit');
    const authError = modal.querySelector('#authError');
    const form = modal.querySelector('#authForm');
    const passwordInput = modal.querySelector('#authPassword');
    const passwordStrength = modal.querySelector('#passwordStrength');

    let currentMode = 'login';

    // Password strength indicator
    passwordInput.addEventListener('input', () => {
      if (currentMode !== 'signup') return;
      
      const password = passwordInput.value;
      let strength = 0;
      let feedback = [];

      if (password.length >= 8) strength++;
      else feedback.push('8+ characters');

      if (/[A-Z]/.test(password)) strength++;
      else feedback.push('uppercase');

      if (/[a-z]/.test(password)) strength++;
      else feedback.push('lowercase');

      if (/[0-9]/.test(password)) strength++;
      else feedback.push('number');

      if (/[^A-Za-z0-9]/.test(password)) strength++;

      const strengthText = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][Math.min(strength, 4)];
      const strengthColor = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'][Math.min(strength, 4)];

      if (password.length > 0) {
        passwordStrength.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
            <div style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
              <div style="width: ${strength * 20}%; height: 100%; background: ${strengthColor}; transition: all 0.3s;"></div>
            </div>
            <span style="color: ${strengthColor}; font-weight: 600;">${strengthText}</span>
          </div>
          ${feedback.length > 0 ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">Need: ${feedback.join(', ')}</div>` : ''}
        `;
      } else {
        passwordStrength.innerHTML = '';
      }
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.tab;

        if (currentMode === 'signup') {
          nameField.style.display = 'block';
          authTitle.textContent = 'Create Account';
          authSubtitle.textContent = 'Start tracking your tasks today';
          authSubmit.textContent = 'Sign Up';
          passwordInput.placeholder = 'Min 8 chars (A-Z, a-z, 0-9)';
          passwordStrength.style.display = 'block';
        } else {
          nameField.style.display = 'none';
          authTitle.textContent = 'Welcome Back';
          authSubtitle.textContent = 'Sign in to manage your tasks';
          authSubmit.textContent = 'Sign In';
          passwordInput.placeholder = 'Enter your password';
          passwordStrength.style.display = 'none';
          passwordStrength.innerHTML = '';
        }
        authError.textContent = '';
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      authError.textContent = '';

      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const name = document.getElementById('authName').value.trim();

      let result;
      if (currentMode === 'signup') {
        result = signup(email, password, name);
      } else {
        result = login(email, password);
      }

      if (result.success) {
        if (currentMode === 'login') {
          setCurrentUser(result.user);
        }
        modal.remove();
        window.location.reload();
      } else {
        authError.textContent = result.error;
      }
    });
  }

  function initAuth() {
    if (!isAuthenticated()) {
      showAuthModal();
      return false;
    }

    const user = getCurrentUser();
    
    // Add user info to sidebar
    const sidebar = document.querySelector('.sidebar-footer');
    if (sidebar) {
      const userInfo = document.createElement('div');
      userInfo.className = 'user-info';
      const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
      userInfo.innerHTML = `
        <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
        <div class="user-details">
          <div class="user-name">${user.name}</div>
          <div class="user-email">${user.email}</div>
          <div class="user-meta">Member since ${memberSince}</div>
        </div>
        <button id="logoutBtn" class="btn-icon" title="Logout">
          <span>🚪</span>
        </button>
      `;
      sidebar.insertBefore(userInfo, sidebar.firstChild);

      document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
          logout();
        }
      });
    }

    return true;
  }

  // Export functions
  window.TaskFlowAuth = {
    init: initAuth,
    isAuthenticated,
    getCurrentUser,
    logout,
    createTeam,
    inviteToTeam,
    acceptInvitation,
    getUserTeams,
    getUserInvitations
  };
})();
