import { api } from './api.js';

export function initChatbot() {
  const container = document.createElement('div');
  container.id = 'chatbot-container';
  container.innerHTML = `
    <!-- Floating Button -->
    <button id="chatbot-fab" class="chatbot-fab">
      <span class="chatbot-icon">💬</span>
    </button>

    <!-- Chat Window -->
    <div id="chatbot-window" class="chatbot-window hidden">
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar">AI</div>
          <div>
            <div class="chat-title">ShipTrack Assistant</div>
            <div class="chat-status"><span class="status-dot"></span> Online</div>
          </div>
        </div>
        <button id="chatbot-close" class="btn btn-ghost btn-sm" style="padding:4px; margin-right:-8px;">✖</button>
      </div>
      
      <div id="chat-messages" class="chat-messages">
        <div class="chat-bubble bot">
          Hi! I'm the ShipTrack AI assistant. You can ask me to track a package by pasting its tracking number (e.g., TRK-1234567).
        </div>
      </div>
      
      <div class="chat-input-area">
        <form id="chat-form" style="display:flex; width:100%; gap:8px;">
          <input type="text" id="chat-input" class="input chat-input" placeholder="Type a message..." autocomplete="off" />
          <button type="submit" class="btn btn-primary btn-icon chat-send">
            <span>➤</span>
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const fab = document.getElementById('chatbot-fab');
  const chatWindow = document.getElementById('chatbot-window');
  const closeBtn = document.getElementById('chatbot-close');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const messagesList = document.getElementById('chat-messages');

  let isOpen = false;

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.classList.remove('hidden');
      fab.classList.add('active');
      setTimeout(() => chatInput.focus(), 100);
    } else {
      chatWindow.classList.add('hidden');
      fab.classList.remove('active');
    }
  }

  fab.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  function appendMessage(text, isUser = false) {
    const el = document.createElement('div');
    el.className = `chat-bubble ${isUser ? 'user' : 'bot'}`;
    
    // Convert rudimentary bold markdown (**text**) to HTML
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    el.innerHTML = formattedText;
    
    messagesList.appendChild(el);
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.id = 'typing-indicator';
    el.className = `chat-bubble bot typing`;
    el.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    messagesList.appendChild(el);
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, true);
    chatInput.value = '';
    
    showTyping();

    try {
      const response = await api.chat(text);
      hideTyping();
      appendMessage(response.reply || "I'm sorry, I didn't understand that.");
    } catch (err) {
      hideTyping();
      appendMessage('Unable to reach the server right now. Please try again later.');
    }
  });
}
