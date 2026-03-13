// ===============================================================
// SkillForge - COMPLETE FRONTEND SCRIPT v2.0
// 9 Dashboard Sections + Profile + AI Chatbot + LIVE CHAT
//===============================================================

const API_BASE = '/api';
let selectedRole = 'student';
let chatMessages = [];

// 🚀 DOM Ready - Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// 🎯 MAIN INITIALIZATION FUNCTION
function initApp() {
    setupLoginForm();
    setupRoleSelector();
    setupDashboardCards();
    checkAuthStatus();
    loadPageContent();
    setupProfilePage();
}

// 1️⃣ LOGIN FORM SETUP
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const simpleLoginForm = document.getElementById('simpleLoginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    if (simpleLoginForm) {
        simpleLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // Enter key support
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement.id === 'chatInput' || activeElement.id === 'messageInput') {
                if (activeElement.id === 'chatInput') sendMessage();
                if (activeElement.id === 'messageInput') window.sendChatMessage();
            } else if (activeElement.id === 'email' || activeElement.id === 'password' || 
                       activeElement.id === 'loginEmail' || activeElement.id === 'loginPassword') {
                login();
            }
        }
    });
}

// 2️⃣ STUDENT/ADMIN ROLE SELECTOR
function setupRoleSelector() {
    document.getElementById('studentBtn')?.addEventListener('click', () => selectRole('student'));
    document.getElementById('adminBtn')?.addEventListener('click', () => selectRole('admin'));
}

function selectRole(role) {
    selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(role + 'Btn')?.classList.add('active');
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = `🚀 Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    }
}

// 3️⃣ AUTHENTICATION CHECK
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
        if (window.location.pathname.includes('index.html') || window.location.pathname.includes('login.html')) {
            window.location.href = role === 'admin' ? 'admin.html' : 'student.html';
        }
    } else if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }
}

// 4️⃣ 🔥 MAIN LOGIN FUNCTION
async function login() {
    const emailField = document.getElementById('email') || document.getElementById('loginEmail');
    const passwordField = document.getElementById('password') || document.getElementById('loginPassword');
    
    if (!emailField || !passwordField) return;
    
    const email = emailField.value.trim();
    const password = passwordField.value;
    
    if (!email || !password) {
        showAlert('Please enter email and password', 'error');
        return;
    }
    
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = '🔄 Logging in...';
    loginBtn.disabled = true;
    
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: selectedRole })
        });
        
        const data = await res.json();
        
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('name', data.name);
            localStorage.setItem('email', data.email);
            showAlert(`🎉 Welcome ${data.name}!`, 'success');
            
            setTimeout(() => {
                window.location.href = data.role === 'admin' ? 'admin.html' : 'student.html';
            }, 1200);
        } else {
            showAlert(data.error || 'Login failed! Try demo credentials.', 'error');
        }
    } catch (error) {
        showAlert('❌ Server error. Make sure backend is running!', 'error');
    } finally {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

// 5️⃣ LOGOUT
function logout() {
    if (confirm('👋 Logout from SkillForge?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// 6️⃣ 🔥 DASHBOARD CARDS - ALL 10 WORKING (9 + CHAT)
function setupDashboardCards() {
    document.querySelectorAll('.card[data-page]').forEach(card => {
        card.addEventListener('click', async function() {
            const page = this.dataset.page;
            if (page === 'chat') {
                window.location.href = 'chat.html';
            } else {
                await loadContent(page);
            }
        });
    });
}

// 7️⃣ LOAD CONTENT FOR ANY SECTION
async function loadContent(page) {
    const contentArea = document.getElementById('content') || document.getElementById('adminContent');
    const token = localStorage.getItem('token');
    
    if (!contentArea || !token) {
        showAlert('Please login first', 'error');
        return;
    }
    
    contentArea.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⏳ Loading...</div>
            <div style="color: #64748b;">Loading ${page.replace('-', ' ')}...</div>
        </div>
    `;
    
    try {
        const res = await fetch(`${API_BASE}/student/${page}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        renderContent(page, data, contentArea);
    } catch (error) {
        contentArea.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌ Error</div>
                <div>Please refresh or login again</div>
            </div>
        `;
    }
}

// 8️⃣ 🔥 RENDER ALL 10 SECTIONS (9 + CHAT)
function renderContent(page, data, container) {
    const templates = {
        courses: `
            <h2>📚 My Courses (${Array.isArray(data) ? data.length : 0})</h2>
            <div class="courses-grid">
                ${Array.isArray(data) ? data.map(course => `
                    <div class="course-card">
                        <h3>${course.title}</h3>
                        <p><strong>${course.instructor}</strong> | ${course.lessons} lessons</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${course.progress}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 1rem;">
                            <span style="color: #10b981;">${course.progress}%</span>
                            <button class="course-btn" onclick="continueCourse(${course.id})">Continue →</button>
                        </div>
                    </div>
                `).join('') : '<p style="text-align: center;">No courses found</p>'}
            </div>
        `,
        progress: `
            <h2>📈 Learning Progress</h2>
            <div class="progress-grid">
                ${Array.isArray(data) ? data.map(item => `
                    <div class="progress-item">
                        <h4>${item.course}</h4>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${item.percent}%"></div>
                        </div>
                        <p>${item.lessonsCompleted}/${item.totalLessons} lessons</p>
                    </div>
                `).join('') : '<p>No progress data</p>'}
            </div>
        `,
        attendance: `
            <h2>📋 Attendance</h2>
            <div class="attendance-grid">
                ${Array.isArray(data) ? data.map(item => `
                    <div class="attendance-item ${item.present ? 'present' : 'absent'}">
                        <span>${new Date(item.date).toLocaleDateString()}</span>
                        <strong>${item.present ? '✅ Present' : '❌ Absent'}</strong>
                        <small>${item.course}</small>
                    </div>
                `).join('') : '<p>No attendance data</p>'}
            </div>
        `,
        announcements: `
            <h2>📢 Latest Announcements</h2>
            ${Array.isArray(data) ? data.map(item => `
                <div class="announcement-card">
                    <h4>${item.title}</h4>
                    <p>${item.content}</p>
                    <small>${item.date}</small>
                </div>
            `).join('') : '<p>No announcements</p>'}
        `,
        'weekly-quiz': `
            <h2>📅 Weekly Quiz</h2>
            <div class="quiz-card">
                <h3>${data.title}</h3>
                <p>Date: ${data.date} | ${data.questions} Questions | ${data.time}</p>
                <p>Status: <span class="status available">${data.status}</span></p>
                <button class="quiz-start-btn" onclick="startQuiz()">Start Quiz Now</button>
            </div>
        `,
        exams: `
            <h2>📝 Upcoming Exams</h2>
            <div class="exams-grid">
                ${Array.isArray(data) ? data.map(exam => `
                    <div class="exam-card">
                        <h4>${exam.title}</h4>
                        <p>Date: ${exam.date}</p>
                        <span class="exam-status upcoming">${exam.status}</span>
                    </div>
                `).join('') : '<p>No exams</p>'}
            </div>
        `,
        'practice-tests': `
            <h2>🧪 Practice Tests</h2>
            <div class="tests-grid">
                ${Array.isArray(data) ? data.map(test => `
                    <div class="test-card">
                        <h4>${test.title}</h4>
                        <p>Score: <strong>${test.score}</strong></p>
                        <small>${test.date}</small>
                        <button class="retake-btn">Retake</button>
                    </div>
                `).join('') : '<p>No tests</p>'}
            </div>
        `,
        'ai-chatbot': `
            <h2>🤖 AI Tutor</h2>
            <div class="ai-chat-container">
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input-container">
                    <input type="text" id="chatInput" placeholder="Ask about JavaScript, React, Node.js...">
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        `,
        // 🔥 NEW LIVE CHAT ROUTE
        chat: `
            <h2>💬 Live Support Chat</h2>
            <div style="text-align: center; padding: 4rem 2rem; background: linear-gradient(135deg, #f8fafc, #e2e8f0); border-radius: 25px;">
                <div style="font-size: 4rem; margin-bottom: 2rem; color: #3b82f6;">💬</div>
                <h3 style="color: #1e3a8a; margin-bottom: 1rem;">Live Chat with Admin</h3>
                <p style="color: #64748b; font-size: 1.2rem; margin-bottom: 2rem;">
                    Get instant help from admin for your doubts!
                </p>
                <a href="chat.html" style="
                    background: linear-gradient(45deg, #10b981, #059669);
                    color: white; 
                    padding: 1.5rem 3rem; 
                    border-radius: 15px; 
                    text-decoration: none; 
                    font-weight: 600; 
                    font-size: 1.2rem;
                    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                    🚀 Start Live Chat Now
                </a>
                <p style="color: #64748b; margin-top: 2rem; font-size: 1rem;">
                    Real-time messaging • Typing indicators • Online status
                </p>
            </div>
        `
    };
    
    container.innerHTML = templates[page] || `<h2>${page}</h2><p>Content loaded</p>`;
    
    if (page === 'ai-chatbot') {
        setTimeout(() => {
            document.getElementById('chatInput').focus();
            initAIChatbot();
        }, 100);
    }
}

// 9️⃣ 🔥 PROFILE MANAGEMENT FUNCTIONS
async function setupProfilePage() {
    if (!window.location.pathname.includes('profile.html')) return;
    
    await loadProfile();
    setupProfileForm();
}

async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/student/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        // Update display fields
        document.getElementById('displayName').textContent = data.profile?.name || 'Student';
        document.getElementById('displayEmail').textContent = data.profile?.email || localStorage.getItem('email') || '-';
        document.getElementById('displayPhone').textContent = data.profile?.phone || '-';
        document.getElementById('displayCollege').textContent = data.profile?.college || '-';
        document.getElementById('displayYear').textContent = data.profile?.year ? 
            (data.profile.year + ' Year') : '-';
        document.getElementById('displayBio').textContent = data.profile?.bio || '-';
        
        // Update stats
        document.getElementById('totalCourses').textContent = data.stats?.totalCourses || 0;
        document.getElementById('completionRate').textContent = `${data.stats?.completionRate || 0}%`;
        document.getElementById('attendanceRate').textContent = `${data.stats?.attendanceRate || 0}%`;
        
        // Update profile status
        const editBtn = document.getElementById('editProfileBtn');
        const statusText = document.getElementById('statusText');
        const statusIcon = document.getElementById('statusIcon');
        
        if (data.isComplete) {
            editBtn.textContent = '✏️ Edit Profile';
            editBtn.className = 'btn-primary-large';
            statusText.textContent = 'Profile Complete';
            statusIcon.textContent = '✅';
            statusIcon.style.color = '#10b981';
        } else {
            editBtn.textContent = '🚨 Complete Profile Required';
            editBtn.className = 'btn-warning-large';
            statusText.textContent = 'Profile Incomplete';
            statusIcon.textContent = '⚠️';
            statusIcon.style.color = '#f59e0b';
        }
        
        // Load form data
        if (data.profile) {
            document.getElementById('editName').value = data.profile.name || '';
            document.getElementById('editEmail').value = data.profile.email || '';
            document.getElementById('editPhone').value = data.profile.phone || '';
            document.getElementById('editCollege').value = data.profile.college || '';
            document.getElementById('editYear').value = data.profile.year || '';
            document.getElementById('editBio').value = data.profile.bio || '';
        }
        
    } catch (error) {
        console.error('Profile load error:', error);
        showAlert('Failed to load profile', 'error');
    }
}

function setupProfileForm() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
    
    // Avatar upload
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('profileAvatar').src = e.target.result;
                    showAlert('✅ Profile photo updated!', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function toggleEditMode() {
    const display = document.getElementById('profileDisplay');
    const editContainer = document.getElementById('profileEditContainer');
    
    if (display.style.display === 'none') {
        display.style.display = 'block';
        editContainer.style.display = 'none';
        loadProfile();
    } else {
        display.style.display = 'none';
        editContainer.style.display = 'block';
        document.getElementById('editName').focus();
    }
}

function cancelEdit() {
    toggleEditMode();
}

async function saveProfile(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const profileData = {
        name: document.getElementById('editName').value.trim(),
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value.trim(),
        college: document.getElementById('editCollege').value.trim(),
        year: document.getElementById('editYear').value,
        bio: document.getElementById('editBio').value.trim()
    };
    
    // Validation
    if (!profileData.name || !profileData.phone || !profileData.college || !profileData.year) {
        showAlert('Please fill all required fields (*)', 'error');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/student/profile`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await res.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            toggleEditMode();
        } else {
            showAlert(data.error || 'Failed to save profile', 'error');
        }
    } catch (error) {
        showAlert('Server error. Please try again.', 'error');
    }
}

// 🔟 AI CHATBOT FUNCTIONS
function initAIChatbot() {
    addChatMessage('bot', `🎓 Hi! I'm your SkillForge AI Tutor 🤖\n\n💡 I can help with:\n• JavaScript • React • Node.js\n• Quiz prep • Course doubts\n\nAsk me anything!`);
}

function addChatMessage(sender, message) {
    chatMessages.push({ sender, message });
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;
    
    chatContainer.innerHTML += `
        <div class="chat-message ${sender}">
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            <div class="message-bubble">${message.replace(/\n/g, '<br>')}</div>
        </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage('user', message);
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const responses = {
            javascript: '📚 JavaScript: Variables, functions, arrays, async/await, DOM. Ask about specific topics!',
            react: '⚛️ React: Components, hooks (useState, useEffect), props, state management.',
            node: '🔥 Node.js: Express APIs, MongoDB, JWT auth, middleware patterns.',
            quiz: '📝 Quiz tips: Review recent lessons, practice MCQs, manage time carefully.',
            chat: '💬 For live help with admin, click the Live Chat card on dashboard!',
            default: '🤖 Try asking about "JavaScript", "React", "Node.js", "quiz", or "chat"! 💡'
        };
        
        const response = message.toLowerCase().includes('javascript') || message.toLowerCase().includes('js') ? responses.javascript :
                        message.toLowerCase().includes('react') ? responses.react :
                        message.toLowerCase().includes('node') ? responses.node :
                        message.toLowerCase().includes('quiz') ? responses.quiz :
                        message.toLowerCase().includes('chat') ? responses.chat : responses.default;
        
        addChatMessage('bot', response);
    }, 1200);
}

// 1️⃣1️⃣ UTILITY FUNCTIONS
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        padding: 1.2rem 1.8rem; border-radius: 12px; min-width: 300px;
        color: white; font-weight: 500;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    alert.innerHTML = ` ${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'} ${message}`;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 4000);
}

function startQuiz() { showAlert('🧠 Quiz opening soon!', 'success'); }
function continueCourse(id) { showAlert(`📚 Course ${id} opening...`, 'success'); }

// Auto-load page content
async function loadPageContent() {
    const contentArea = document.getElementById('content');
    if (!contentArea) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const page = window.location.pathname.split('/').pop().replace('.html', '') || 'courses';
    if (page !== 'profile' && page !== 'chat') await loadContent(page);
}

// 🔥 GLOBAL LIVE CHAT FUNCTIONS (for chat.html)
window.sendChatMessage = function() {
    if (typeof window.sendMessage === 'function') {
        window.sendMessage();
    }
};

// CSS Animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .chat-message { margin-bottom: 1.5rem; display: flex; flex-direction: column; }
    .chat-message.user { align-items: flex-end; }
    .chat-message.bot { align-items: flex-start; }
    .message-time { font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; }
    .message-bubble { max-width: 70%; padding: 1rem 1.2rem; border-radius: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .chat-message.user .message-bubble { background: linear-gradient(45deg, #3b82f6, #1e3a8a); color: white; border-bottom-right-radius: 5px; }
    .chat-message.bot .message-bubble { background: white; color: #1e293b; border-bottom-left-radius: 5px; }
`;
document.head.appendChild(style);

// 🎉 Initialize
if (document.querySelector('.grid')) setupDashboardCards();
