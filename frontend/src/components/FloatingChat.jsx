import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './FloatingChat.css';

export default function FloatingChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (open && user?.role === 'TENANT') {
      setLoading(true);
      api.get('/support-chat')
        .then(res => setMessages(res.data || []))
        .catch(() => toast.error('Failed to load chat'))
        .finally(() => setLoading(false));
    }
  }, [open, user?.role]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || sending) return;

    setSending(true);
    try {
      const res = await api.post('/support-chat', { message: msg });
      setMessages(prev => [...prev, res.data]);
      setInput('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'TENANT') return null;

  return (
    <div className="floating-chat">
      {open && (
        <div className="floating-chat-window">
          <div className="floating-chat-header">
            <h3>Chat Support</h3>
            <button type="button" className="floating-chat-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>
          <div className="floating-chat-messages">
            {loading ? (
              <p className="floating-chat-loading">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="floating-chat-empty">Start a conversation. Our admin team will respond soon.</p>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`floating-chat-msg ${m.senderRole === 'TENANT' ? 'sent' : 'received'}`}>
                  <span className="floating-chat-msg-text">{m.message}</span>
                  <span className="floating-chat-msg-time">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="floating-chat-form">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={2000}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="floating-chat-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Open chat support"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
