/**
 * EduPrep AI - Frontend Application Script
 * Mengelola state interaktif, parameter AI, memori obrolan, TTS, dan integrasi API
 */

// ==========================================
// 1. State Management
// ==========================================
const state = {
  persona: 'career_coach',
  tone: 'formal',
  depth: 'balanced',
  temperature: 0.7,
  conversation: [], // Array of { role: 'user' | 'model', text: string, timestamp: string }
  isGenerating: false
};

// Metadata Persona untuk UI
const PERSONA_CONFIG = {
  career_coach: {
    title: 'Career & Mock Interview Coach',
    subtitle: 'Mode Simulasi HR • Analisis Jawaban STAR • Bedah CV',
    icon: 'fa-briefcase',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    placeholder: 'Contoh: "Simulasikan wawancara HR untuk posisi Web Developer" atau "Review jawaban saya..."'
  },
  academic_tutor: {
    title: 'Academic Concept Tutor',
    subtitle: 'Penjelasan Teori & Analogi • Step-by-step • Kuis Pemahaman',
    icon: 'fa-book-open-reader',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    placeholder: 'Contoh: "Jelaskan konsep Asynchronous di JavaScript dengan analogi sederhana..."'
  },
  productivity_mentor: {
    title: 'Study & Productivity Mentor',
    subtitle: 'Metode Pomodoro • Time Blocking • Roadmap Belajar 30 Hari',
    icon: 'fa-bolt',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    placeholder: 'Contoh: "Susunkan rencana belajar React 2 jam per hari selama sebulan..."'
  }
};

// ==========================================
// 2. DOM Elements
// ==========================================
const DOM = {
  // Sidebar
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
  personaCards: document.querySelectorAll('.persona-card'),
  tonePills: document.querySelectorAll('#toneSelector .pill-btn'),
  depthPills: document.querySelectorAll('#depthSelector .pill-btn'),
  tempSlider: document.getElementById('tempSlider'),
  tempValueDisplay: document.getElementById('tempValueDisplay'),
  apiStatusBadge: document.getElementById('apiStatusBadge'),
  msgCountBadge: document.getElementById('msgCountBadge'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  exportChatBtn: document.getElementById('exportChatBtn'),
  systemInfoBtn: document.getElementById('systemInfoBtn'),

  // Header
  headerAvatar: document.getElementById('headerAvatar'),
  headerPersonaTitle: document.getElementById('headerPersonaTitle'),
  headerPersonaSub: document.getElementById('headerPersonaSub'),
  headerModeSummary: document.getElementById('headerModeSummary'),

  // Chat Area
  chatStream: document.getElementById('chatStream'),
  welcomeHero: document.getElementById('welcomeHero'),
  recommendationChips: document.getElementById('recommendationChips'),

  // Input Area
  userInput: document.getElementById('userInput'),
  sendBtn: document.getElementById('sendBtn'),
  charCounter: document.getElementById('charCounter'),

  // Modal
  infoModal: document.getElementById('infoModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn')
};

// ==========================================
// 3. Initialization & Event Listeners
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Konfigurasi Marked.js
  if (window.marked) {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  loadStateFromStorage();
  checkApiHealth();
  updateUIForPersona();
  updateModeSummary();
  loadRecommendations();
  renderChatHistory();
  setupEventListeners();
});

function setupEventListeners() {
  // Mobile Sidebar Toggle
  DOM.mobileMenuBtn?.addEventListener('click', () => {
    DOM.sidebar.classList.add('open');
    DOM.sidebarOverlay.classList.add('active');
  });

  const closeSidebar = () => {
    DOM.sidebar.classList.remove('open');
    DOM.sidebarOverlay.classList.remove('active');
  };
  DOM.sidebarCloseBtn?.addEventListener('click', closeSidebar);
  DOM.sidebarOverlay?.addEventListener('click', closeSidebar);

  // Persona Selection
  DOM.personaCards.forEach(card => {
    card.addEventListener('click', () => {
      DOM.personaCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.persona = card.dataset.persona;
      saveStateToStorage();
      updateUIForPersona();
      loadRecommendations();
    });
  });

  // Tone Selection
  DOM.tonePills.forEach(pill => {
    pill.addEventListener('click', () => {
      DOM.tonePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.tone = pill.dataset.val;
      saveStateToStorage();
      updateModeSummary();
    });
  });

  // Depth Selection
  DOM.depthPills.forEach(pill => {
    pill.addEventListener('click', () => {
      DOM.depthPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.depth = pill.dataset.val;
      saveStateToStorage();
      updateModeSummary();
    });
  });

  // Temperature Slider
  DOM.tempSlider?.addEventListener('input', (e) => {
    state.temperature = parseFloat(e.target.value);
    DOM.tempValueDisplay.textContent = state.temperature.toFixed(1);
    saveStateToStorage();
  });

  // Input Textarea Auto-resize & Char Counter
  DOM.userInput?.addEventListener('input', () => {
    DOM.userInput.style.height = 'auto';
    DOM.userInput.style.height = Math.min(DOM.userInput.scrollHeight, 160) + 'px';
    DOM.charCounter.textContent = `${DOM.userInput.value.length}/2000`;
  });

  // Keyboard shortcut: Enter to send, Shift+Enter for new line
  DOM.userInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Send Button
  DOM.sendBtn?.addEventListener('click', handleSendMessage);

  // Clear Chat Button
  DOM.clearChatBtn?.addEventListener('click', handleClearChat);

  // Export Chat Button
  DOM.exportChatBtn?.addEventListener('click', handleExportChat);

  // Modal Dialog
  DOM.systemInfoBtn?.addEventListener('click', () => DOM.infoModal.classList.add('active'));
  DOM.modalCloseBtn?.addEventListener('click', () => DOM.infoModal.classList.remove('active'));
  DOM.infoModal?.addEventListener('click', (e) => {
    if (e.target === DOM.infoModal) DOM.infoModal.classList.remove('active');
  });
}

// ==========================================
// 4. API & Data Handling
// ==========================================
async function checkApiHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Status HTTP error: ' + res.status);
    const data = await res.json();
    DOM.apiStatusBadge.textContent = 'Online';
    DOM.apiStatusBadge.style.color = 'var(--accent-emerald)';
  } catch (err) {
    DOM.apiStatusBadge.textContent = 'Offline / Error';
    DOM.apiStatusBadge.style.color = 'var(--accent-rose)';
  }
}

async function loadRecommendations() {
  if (!DOM.recommendationChips) return;
  DOM.recommendationChips.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">Memuat rekomendasi topik...</span>';

  try {
    const res = await fetch(`/api/recommendations?persona=${state.persona}`);
    const data = await res.json();

    DOM.recommendationChips.innerHTML = '';
    (data.prompts || []).forEach(promptText => {
      const chip = document.createElement('button');
      chip.className = 'prompt-chip';
      chip.innerHTML = `<i class="fa-solid fa-arrow-right"></i> <span>${escapeHtml(promptText)}</span>`;
      chip.addEventListener('click', () => {
        DOM.userInput.value = promptText;
        DOM.userInput.focus();
        handleSendMessage();
      });
      DOM.recommendationChips.appendChild(chip);
    });
  } catch (e) {
    DOM.recommendationChips.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">Gagal memuat rekomendasi prompt.</span>';
  }
}

async function handleSendMessage() {
  const text = DOM.userInput.value.trim();
  if (!text || state.isGenerating) return;

  // Sembunyikan welcome hero jika percakapan dimulai
  if (DOM.welcomeHero) {
    DOM.welcomeHero.style.display = 'none';
  }

  // 1. Tambahkan pesan user ke state & DOM
  const userMsg = {
    role: 'user',
    text: text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  state.conversation.push(userMsg);
  appendMessageToDOM(userMsg);

  // Reset input field
  DOM.userInput.value = '';
  DOM.userInput.style.height = 'auto';
  DOM.charCounter.textContent = '0/2000';
  updateMessageCount();
  saveStateToStorage();

  // 2. Tampilkan typing indicator
  setGenerating(true);
  const typingElement = appendTypingIndicator();

  try {
    // Siapkan payload riwayat percakapan (Conversation Memory)
    const payloadConversation = state.conversation.map(m => ({
      role: m.role,
      text: m.text
    }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: payloadConversation,
        persona: state.persona,
        tone: state.tone,
        depth: state.depth,
        temperature: state.temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server merespon dengan status ${response.status}`);
    }

    const data = await response.json();
    typingElement.remove();

    // 3. Tambahkan balasan bot ke state & DOM
    const botMsg = {
      role: 'model',
      text: data.result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    state.conversation.push(botMsg);
    appendMessageToDOM(botMsg);

    updateMessageCount();
    saveStateToStorage();
  } catch (error) {
    typingElement.remove();
    const errorMsg = {
      role: 'model',
      text: `⚠️ **Maaf, terjadi kesalahan:** ${error.message}\n\nPastikan API Key Gemini pada file \`.env\` sudah valid dan server telah aktif.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    appendMessageToDOM(errorMsg);
  } finally {
    setGenerating(false);
  }
}

// ==========================================
// 5. DOM Rendering & UI Helpers
// ==========================================
function appendMessageToDOM(msg) {
  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${msg.role === 'user' ? 'user' : 'bot'}`;

  const isUser = msg.role === 'user';
  const avatarIcon = isUser ? 'fa-user' : PERSONA_CONFIG[state.persona].icon;

  // Render format Markdown jika dari bot, plain text jika dari user
  let formattedContent = '';
  if (isUser) {
    formattedContent = `<p>${escapeHtml(msg.text).replace(/\n/g, '<br>')}</p>`;
  } else {
    formattedContent = window.marked ? marked.parse(msg.text) : escapeHtml(msg.text);
  }

  msgEl.innerHTML = `
    <div class="msg-avatar">
      <i class="fa-solid ${avatarIcon}"></i>
    </div>
    <div class="msg-body">
      <div class="msg-bubble">
        ${formattedContent}
      </div>
      <div class="msg-actions">
        <span>${msg.timestamp || ''}</span>
        <button class="msg-btn-action copy-btn" title="Salin teks">
          <i class="fa-regular fa-copy"></i> Salin
        </button>
        ${!isUser ? `
          <button class="msg-btn-action tts-btn" title="Dengarkan suara">
            <i class="fa-solid fa-volume-high"></i> Dengarkan
          </button>
        ` : ''}
      </div>
    </div>
  `;

  // Listener tombol salin teks
  const copyBtn = msgEl.querySelector('.copy-btn');
  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Salin';
      }, 2000);
    });
  });

  // Listener tombol Text-to-Speech (Web Speech API)
  const ttsBtn = msgEl.querySelector('.tts-btn');
  ttsBtn?.addEventListener('click', () => {
    speakText(msg.text, ttsBtn);
  });

  DOM.chatStream.appendChild(msgEl);

  // Syntax highlighting untuk code blocks
  if (window.hljs) {
    msgEl.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  scrollToBottom();
}

function appendTypingIndicator() {
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-message bot';
  typingEl.id = 'typingIndicator';

  const avatarIcon = PERSONA_CONFIG[state.persona].icon;

  typingEl.innerHTML = `
    <div class="msg-avatar">
      <i class="fa-solid ${avatarIcon}"></i>
    </div>
    <div class="msg-body">
      <div class="msg-bubble typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <span class="typing-text">EduPrep AI sedang menyusun respon terbaik...</span>
      </div>
    </div>
  `;

  DOM.chatStream.appendChild(typingEl);
  scrollToBottom();
  return typingEl;
}

function setGenerating(isGenerating) {
  state.isGenerating = isGenerating;
  DOM.sendBtn.disabled = isGenerating;
  DOM.userInput.disabled = isGenerating;
  if (!isGenerating) {
    DOM.userInput.focus();
  }
}

function scrollToBottom() {
  DOM.chatStream.scrollTop = DOM.chatStream.scrollHeight;
}

function updateUIForPersona() {
  const cfg = PERSONA_CONFIG[state.persona] || PERSONA_CONFIG.career_coach;

  if (DOM.headerAvatar) {
    DOM.headerAvatar.innerHTML = `<i class="fa-solid ${cfg.icon}"></i>`;
    DOM.headerAvatar.style.background = cfg.gradient;
  }
  if (DOM.headerPersonaTitle) DOM.headerPersonaTitle.textContent = cfg.title;
  if (DOM.headerPersonaSub) DOM.headerPersonaSub.textContent = cfg.subtitle;
  if (DOM.userInput) DOM.userInput.placeholder = cfg.placeholder;
}

function updateModeSummary() {
  const toneNames = { formal: 'Formal', casual: 'Santai', motivational: 'Motivatif' };
  const depthNames = { concise: 'Ringkas', balanced: 'Terstruktur', comprehensive: 'Mendalam' };

  if (DOM.headerModeSummary) {
    DOM.headerModeSummary.textContent = `${toneNames[state.tone]} • ${depthNames[state.depth]}`;
  }
}

function updateMessageCount() {
  DOM.msgCountBadge.textContent = `${state.conversation.length} Pesan`;
}

function renderChatHistory() {
  if (state.conversation.length === 0) {
    if (DOM.welcomeHero) DOM.welcomeHero.style.display = 'flex';
  } else {
    if (DOM.welcomeHero) DOM.welcomeHero.style.display = 'none';
    state.conversation.forEach(msg => appendMessageToDOM(msg));
  }
  updateMessageCount();
}

// Text-to-Speech Helper
function speakText(text, btnElement) {
  if (!('speechSynthesis' in window)) {
    alert('Browser kamu belum mendukung Web Speech API.');
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    btnElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Dengarkan';
    return;
  }

  // Bersihkan karakter markdown sebelum dibaca
  const plainText = text.replace(/[*#`_>-]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(plainText);
  utterance.lang = 'id-ID';
  utterance.rate = 1.0;

  btnElement.innerHTML = '<i class="fa-solid fa-square"></i> Berhenti';

  utterance.onend = () => {
    btnElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Dengarkan';
  };
  utterance.onerror = () => {
    btnElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Dengarkan';
  };

  window.speechSynthesis.speak(utterance);
}

// ==========================================
// 6. Action Handlers: Clear, Export, Storage
// ==========================================
function handleClearChat() {
  if (state.conversation.length === 0) return;
  if (confirm('Apakah kamu yakin ingin menghapus seluruh riwayat obrolan?')) {
    state.conversation = [];
    localStorage.removeItem('eduprep_chat_history');
    DOM.chatStream.innerHTML = '';
    if (DOM.welcomeHero) {
      DOM.chatStream.appendChild(DOM.welcomeHero);
      DOM.welcomeHero.style.display = 'flex';
    }
    updateMessageCount();
  }
}

function handleExportChat() {
  if (state.conversation.length === 0) {
    alert('Belum ada riwayat percakapan untuk diekspor!');
    return;
  }

  let markdownContent = `# Riwayat Percakapan EduPrep AI\n`;
  markdownContent += `Tanggal: ${new Date().toLocaleString()}\n`;
  markdownContent += `Persona: ${PERSONA_CONFIG[state.persona].title}\n`;
  markdownContent += `Parameter: Tone=${state.tone}, Depth=${state.depth}, Temperature=${state.temperature}\n\n---\n\n`;

  state.conversation.forEach((msg, idx) => {
    const roleName = msg.role === 'user' ? '👤 Pengguna' : '🤖 EduPrep AI';
    markdownContent += `### ${roleName} (${msg.timestamp || ''})\n\n${msg.text}\n\n`;
  });

  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EduPrep-Chat-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function saveStateToStorage() {
  localStorage.setItem('eduprep_chat_history', JSON.stringify(state.conversation));
  localStorage.setItem('eduprep_config', JSON.stringify({
    persona: state.persona,
    tone: state.tone,
    depth: state.depth,
    temperature: state.temperature
  }));
}

function loadStateFromStorage() {
  try {
    const savedHistory = localStorage.getItem('eduprep_chat_history');
    if (savedHistory) {
      state.conversation = JSON.parse(savedHistory);
    }

    const savedConfig = localStorage.getItem('eduprep_config');
    if (savedConfig) {
      const cfg = JSON.parse(savedConfig);
      if (cfg.persona) state.persona = cfg.persona;
      if (cfg.tone) state.tone = cfg.tone;
      if (cfg.depth) state.depth = cfg.depth;
      if (cfg.temperature !== undefined) state.temperature = cfg.temperature;

      // Update UI sesuai config tersimpan
      DOM.personaCards.forEach(c => c.classList.toggle('active', c.dataset.persona === state.persona));
      DOM.tonePills.forEach(p => p.classList.toggle('active', p.dataset.val === state.tone));
      DOM.depthPills.forEach(p => p.classList.toggle('active', p.dataset.val === state.depth));
      if (DOM.tempSlider) DOM.tempSlider.value = state.temperature;
      if (DOM.tempValueDisplay) DOM.tempValueDisplay.textContent = state.temperature.toFixed(1);
    }
  } catch (e) {
    console.error('Gagal memuat session dari storage:', e);
  }
}

function escapeHtml(string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(string).replace(/[&<>"']/g, s => entityMap[s]);
}
