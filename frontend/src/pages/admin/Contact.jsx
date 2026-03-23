import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import AdminBackButton from '../../components/AdminBackButton';
import './Admin.css';

export default function AdminContact() {
  const [messages, setMessages] = useState([]);

  useEffect(() => { api.get('/contact').then(r => setMessages(r.data)); }, []);

  const markRead = async (id) => {
    await api.put(`/contact/${id}/read`);
    setMessages(m => m.map(x => x.id === id ? { ...x, isRead: true } : x));
  };

  const deleteMessage = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      const { data } = await api.delete(`/contact/${id}`);
      setMessages(m => m.filter(x => x.id !== id));
      toast.success(data?.message || 'Message deleted');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete message';
      toast.error(msg);
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <AdminBackButton />
        <h1>Contact Messages</h1>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(m => (
                <tr key={m.id} style={{ backgroundColor: m.isRead ? 'transparent' : 'rgba(219,171,80,0.1)' }}>
                  <td>{m.name}</td>
                  <td><a href={`mailto:${m.email}`}>{m.email}</a></td>
                  <td>{m.subject}</td>
                  <td style={{ maxWidth: 200 }}>{m.message?.slice(0, 80)}...</td>
                  <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>
                    {!m.isRead && <button className="btn-sm" onClick={() => markRead(m.id)}>Mark Read</button>}
                    <button className="btn-sm btn-danger" onClick={() => deleteMessage(m.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
