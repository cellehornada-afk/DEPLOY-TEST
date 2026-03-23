import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import TenantBackButton from '../../components/TenantBackButton';
import '../admin/Admin.css';

export default function TenantRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [modal, setModal] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);
  const [form, setForm] = useState({ roomId: '', title: '', description: '' });

  useEffect(() => {
    api.get('/requests/my').then(r => setRequests(r.data));
    api.get('/rooms').then(r => setRooms(r.data));
  }, []);

  const myRoom = user?.room;
  useEffect(() => {
    if (myRoom) setForm(f => ({ ...f, roomId: myRoom.id }));
  }, [myRoom?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', {
        roomId: form.roomId,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      toast.success('Request submitted');
      setModal(false);
      setForm({ roomId: myRoom?.id || '', title: '', description: '' });
      api.get('/requests/my').then(r => setRequests(r.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const statusBadge = (s) => {
    const c = s === 'COMPLETED' ? 'badge-success' : s === 'REJECTED' ? 'badge-danger' : s === 'APPROVED' ? 'badge-info' : 'badge-warning';
    return <span className={`badge ${c}`}>{s}</span>;
  };

  return (
    <div className="admin-page">
      <div className="container">
        <TenantBackButton />
        <div className="admin-header">
          <h1>Maintenance Requests</h1>
          <button className="btn btn-primary" onClick={() => setModal(true)}>New Request</button>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td>{r.room?.roomNumber}</td>
                  <td>{r.title}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-sm" onClick={() => setViewRequest(r)}>
                      {r.adminReply ? 'View Reply' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {viewRequest && (
        <div className="modal-overlay" onClick={() => setViewRequest(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Request: {viewRequest.title}</h2>
            <p><strong>Description:</strong> {viewRequest.description}</p>
            <p><strong>Status:</strong> {statusBadge(viewRequest.status)}</p>
            {viewRequest.adminReply ? (
              <div className="form-group">
                <label>Maintenance Reply</label>
                <div className="tenant-admin-reply">{viewRequest.adminReply}</div>
              </div>
            ) : (
              <p className="tenant-no-reply">No reply yet. Maintenance will update you when they respond.</p>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setViewRequest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Maintenance Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Room</label>
                <select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))} required>
                  <option value="">Select</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.building?.name} - {r.roomNumber}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows="4" />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Submit</button>
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
