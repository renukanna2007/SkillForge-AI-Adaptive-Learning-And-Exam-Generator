// ===============================================================
// SkillForge - LIVE CHAT SYSTEM v1.0
// Real-time Admin ↔ Student messaging with Socket.io
// Typing indicators + Online users + Notifications
//===============================================================

// 🔥 Socket.io Connection
const socket = io();
let currentUser = {};
let messages = [];

// 🚀 Initialize Chat on Page Load
document.addEventListener('DOMContentLoaded', function() {
    initChat();
});

// 🎯 MAIN CHAT INITIALIZATION
function initChat() {
    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name') || 'User';
    const email = localStorage.getItem('email') || 'user@skillforge.in';
    
    if (!token || !role) {
        showChatAlert('Please login first!', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    // Setup user data
    currentUser = {
        userId: Date.now().toString(),
        role: role,
        name: name,
        email: email
    };
    
    // Join chat room
    socket.emit('join_chat', currentUser);
    
    // Setup event listeners
    setupEventListeners();
    loadUserInterface();
    
    console.log('✅ Live Chat initialized for:', currentUser.name, '(' + currentUser.role + ')');
}

// 🔌 SOCKET EVENT LISTENERS
function setupEventListeners() {
    // New messages
    socket.on('new_message', (message) => {
        addMessageToChat(message);
        playNotificationSound();
    });
    
    // Online users update
    socket.on('online_users_update', (data) => {
        updateOnlineUsers(data.users, data.total);
    });
    
    // Student joined notification (Admin only)
    socket.on('student_joined', (data) => {
        if (currentUser.role === 'admin') {
            showChatAlert(data.message, 'success');
            playNotificationSound();
        }
    });
    
    // Typing indicators
    socket.on('user_typing', (data) => {
        updateTypingIndicator(data);
    });
    
    // Connection status
    socket.on('connect', () => {
        console.log('🔌 Connected to server');
        document.getElementById('connectionStatus').textContent = '🟢 Connected';
        document.getElementById('connectionStatus').style.color = '#10b981';
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        document.getElementById('connectionStatus').textContent = '🔴 Disconnected';
        document.getElementById('connectionStatus').style.color = '#ef4444';
    });
}

// 🎨 LOAD USER INTERFACE
function loadUserInterface() {
    // Set partner info (opposite role)
    const partnerRole = currentUser.role === 'admin' ? 'Students' : 'Admin';
    const partnerAvatar = currentUser.role === 'admin' ? '👨‍🎓' : '👨‍💼';
    
    document.getElementById('partnerName').textContent = partnerRole;
    document.getElementById('partnerRole').textContent = partnerRole;
    document.getElementById('partnerAvatar').textContent = partnerAvatar;
    
    // Set current user info
    document.getElementById('currentUserName').textContent = currentUser.name;
    document.getElementById('currentUserRole').textContent = currentUser.role.toUpperCase();
    
    // Focus input
    setTimeout(() => {
        document.getElementById('messageInput').focus();
    }, 500);
}

// 💬 SEND MESSAGE
window.sendMessage = function() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // Emit message to server
    socket.emit('send_message', { message: message });
    
    // Clear input
    input.value = '';
    
    // Stop typing
    socket.emit('typing', { isTyping: false });
};

// ⌨️ INPUT HANDLING
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (input) {
        // Enter to send
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.sendMessage();
            } else {
                // Typing indicator
                if (!isTyping) {
                    isTyping = true;
                    socket.emit('typing', { isTyping: true });
                }
                typingTimer = setTimeout(() => {
                    isTyping = false;
                    socket.emit('typing', { isTyping: false });
                }, 1500);
            }
        });
        
        // Input events
        input.addEventListener('input', function() {
            if (this.value.trim() === '') {
                if (isTyping) {
                    isTyping = false;
                    socket.emit('typing', { isTyping: false });
                    clearTimeout(typingTimer);
                }
            }
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', window.sendMessage);
    }
});

let isTyping = false;
let typingTimer;

// 💬 ADD MESSAGE TO CHAT
function addMessageToChat(message) {
    messages.push(message);
    
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    const isOwnMessage = message.senderId === currentUser.userId;
    messageDiv.className = `message ${isOwnMessage ? 'user' : 'other'}`;
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${message.senderName}</span>
            <span class="message-time">${formatTime(message.timestamp)}</span>
        </div>
        <div class="message-bubble">${escapeHtml(message.message)}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Update unread count if chat is not focused
    if (document.hidden && !isOwnMessage) {
        updateUnreadCount();
    }
}

// 👥 UPDATE ONLINE USERS
function updateOnlineUsers(users, total) {
    const list = document.getElementById('onlineUsersList');
    const badge = document.getElementById('onlineBadge');
    const count = document.getElementById('onlineCount');
    
    badge.textContent = total || 0;
    count.textContent = `${total || 0} online`;
    
    if (!total || total === 0) {
        list.innerHTML = '<div class="user-item empty"><p>👋 No one online</p></div>';
        updateAdminStatus(false);
        return;
    }
    
    const userElements = users.map(user => {
        const isAdmin = user.role === 'admin';
        const avatar = isAdmin ? '👨‍💼' : '👨‍🎓';
        return `
            <div class="user-item ${user.role}">
                <span class="user-avatar">${avatar}</span>
                <div class="user-info">
                    <span class="user-name">${escapeHtml(user.name)}</span>
                    <span class="user-role">${user.role.toUpperCase()}</span>
                </div>
                ${isAdmin && currentUser.role === 'student' ? '<div class="admin-badge">ADMIN</div>' : ''}
            </div>
        `;
    }).join('');
    
    list.innerHTML = userElements;
    updateAdminStatus(users.some(user => user.role === 'admin'));
}

// 🖥️ UPDATE ADMIN STATUS
function updateAdminStatus(adminOnline) {
    const statusDot = document.getElementById('adminStatus');
    if (statusDot) {
        statusDot.className = adminOnline ? 'status-dot online' : 'status-dot offline';
    }
    
    const partnerName = document.getElementById('partnerName');
    if (partnerName && currentUser.role === 'student') {
        partnerName.textContent = adminOnline ? 'Admin (Online)' : 'Admin (Offline)';
    }
}

// ✍️ TYPING INDICATOR
function updateTypingIndicator(data) {
    const indicator = document.getElementById('typingIndicator');
    if (!indicator) return;
    
    if (data.isTyping && data.senderRole !== currentUser.role) {
        indicator.textContent = `${data.senderName} is typing...`;
        indicator.classList.add('show');
    } else {
        indicator.textContent = '';
        indicator.classList.remove('show');
    }
}

// 🔔 NOTIFICATION FUNCTIONS
function playNotificationSound() {
    // Create and play notification sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

let unreadCount = 0;
function updateUnreadCount() {
    unreadCount++;
    const badge = document.querySelector('.unread-badge');
    if (badge) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'block';
    }
}

// 🛠️ UTILITY FUNCTIONS
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showChatAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `chat-alert ${type}`;
    alert.innerHTML = `
        <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'} ${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) alert.remove();
    }, 5000);
}

// 🔙 BACK TO DASHBOARD
function goBackToDashboard() {
    window.location.href = currentUser.role === 'admin' ? 'admin.html' : 'student.html';
}

// 🌐 WINDOW FUNCTIONS (Global Access)
window.sendMessage = sendMessage;
window.goBackToDashboard = goBackToDashboard;
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.chat-sidebar');
    sidebar.style.transform = sidebar.style.transform ? '' : 'translateX(-100%)';
};

// 🔔 PAGE VISIBILITY
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        unreadCount = 0;
        const badge = document.querySelector('.unread-badge');
        if (badge) badge.style.display = 'none';
    }
});

// 🎉 Auto-focus input on load
window.addEventListener('load', function() {
    const input = document.getElementById('messageInput');
    if (input) input.focus();
});
