import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import AdminBackButton from '../../components/AdminBackButton';
import './Admin.css';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ userId: '', roomId: '', amount: '', dueDate: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  useEffect(() => {
    api.get('/payments').then(r => setPayments(r.data));
    api.get('/users').then(r => setUsers(r.data.filter(u => u.role === 'TENANT')));
    api.get('/rooms').then(r => setRooms(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', { ...form, dueDate: new Date(form.dueDate).toISOString() });
      toast.success('Payment record created');
      setModal(null);
      api.get('/payments').then(r => setPayments(r.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/payments/${id}/paid`);
      toast.success('Marked as paid');
      api.get('/payments').then(r => setPayments(r.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const statusBadge = (s) => {
    const c = s === 'PAID' ? 'badge-success' : s === 'OVERDUE' ? 'badge-danger' : 'badge-warning';
    return <span className={`badge ${c}`}>{s}</span>;
  };

  return (
    <div className="admin-page">
      <div className="container">
        <AdminBackButton />
        <div className="admin-header">
          <h1>Payments</h1>
          <button className="btn btn-primary" onClick={() => setModal('add')}>Create Payment</button>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Room</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.user?.name}</td>
                  <td>{p.room?.building?.name} - {p.room?.roomNumber}</td>
                  <td>${p.amount}</td>
                  <td>{new Date(p.dueDate).toLocaleDateString()}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>
                    {p.status !== 'PAID' && <button className="btn-sm" onClick={() => markPaid(p.id)}>Mark Paid</button>}
                    {p.status === 'PAID' && <a href={`/api/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="btn-sm">Receipt</a>}
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
            <h2>Create Payment</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tenant</label>
                <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required>
                  <option value="">Select</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Room</label>
                <select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))} required>
                  <option value="">Select</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.building?.name} - {r.roomNumber}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Month</label>
                <input type="number" min="1" max="12" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input type="number" min="2020" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
