import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import AdminBackButton from '../../components/AdminBackButton';
import './Admin.css';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => { load(); }, []);

  const load = () => api.get('/requests').then(r => setRequests(r.data));

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/requests/${id}`, { status, adminReply: reply });
      toast.success('Updated');
      setModal(null);
      setReply('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    try {
      await api.put(`/requests/${modal.req.id}`, { adminReply: reply.trim() });
      toast.success('Reply sent. Tenant has been notified.');
      setModal(null);
      setReply('');
      load();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to send reply';
      toast.error(msg);
    }
  };

  const statusBadge = (s) => {
    const c = s === 'COMPLETED' ? 'badge-success' : s === 'REJECTED' ? 'badge-danger' : s === 'APPROVED' ? 'badge-info' : 'badge-warning';
    return <span className={`badge ${c}`}>{s}</span>;
  };

  return (
    <div className="admin-page">
      <div className="container">
        <AdminBackButton />
        <h1>Maintenance Requests</h1>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Room</th>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td>{r.user?.name}</td>
                  <td>{r.room?.roomNumber}</td>
                  <td>{r.title}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-sm" onClick={() => { setModal({ req: r, action: null }); setReply(r.adminReply || ''); }}>View</button>
                    {r.status === 'PENDING' && (
                      <>
                        <button className="btn-sm" onClick={() => setModal({ req: r, action: 'approve' })}>Approve</button>
                        <button className="btn-sm btn-danger" onClick={() => setModal({ req: r, action: 'reject' })}>Reject</button>
                      </>
                    )}
                    {r.status === 'APPROVED' && <button className="btn-sm" onClick={() => setModal({ req: r, action: 'complete' })}>Complete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Request: {modal.req?.title}</h2>
            <p><strong>Description:</strong> {modal.req?.description}</p>
            <div className="form-group">
              <label>Admin Reply</label>
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows="3" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={sendReply} disabled={!reply.trim()}>Reply & Notify Tenant</button>
              {modal.action === 'approve' && <button className="btn btn-primary" onClick={() => updateStatus(modal.req.id, 'APPROVED')}>Approve</button>}
              {modal.action === 'reject' && <button className="btn btn-danger" onClick={() => updateStatus(modal.req.id, 'REJECTED')}>Reject</button>}
              {modal.action === 'complete' && <button className="btn btn-primary" onClick={() => updateStatus(modal.req.id, 'COMPLETED')}>Mark Complete</button>}
              <button className="btn btn-outline" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
