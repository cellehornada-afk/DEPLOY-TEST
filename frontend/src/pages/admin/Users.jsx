import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import AdminBackButton from '../../components/AdminBackButton';
import './Admin.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ email: '', name: '', phone: '', role: 'TENANT', roomId: '' });

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data));
    api.get('/rooms').then(r => setRooms(r.data.filter(x => x.isAvailable)));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        email: form.email,
        name: form.name,
        phone: form.phone || undefined,
        role: form.role,
        roomId: form.role === 'TENANT' ? form.roomId || undefined : undefined,
      });
      toast.success('User created.');
      setModal(null);
      setForm({ email: '', name: '', phone: '', role: 'TENANT', roomId: '' });
      api.get('/users').then(r => setUsers(r.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const resetPassword = async (id) => {
    try {
      const res = await api.post(`/users/${id}/reset-password`);
      toast.success(`New password: ${res.data.tempPassword}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Deactivated' : 'Activated');
      api.get('/users').then(r => setUsers(r.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const resetForm = () => ({ email: '', name: '', phone: '', role: 'TENANT', roomId: '' });

  return (
    <div className="admin-page">
      <div className="container">
        <AdminBackButton />
        <div className="admin-header">
          <h1>User Management</h1>
          <button className="btn btn-primary" onClick={() => { setForm(resetForm()); setModal('add'); }}>Add User</button>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Room</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-info">{u.role}</span></td>
                  <td>{u.room ? `${u.room.building?.name} - ${u.room.roomNumber}` : '-'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn-sm" onClick={() => resetPassword(u.id)}>Reset PW</button>
                    <button className="btn-sm" onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
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
            <h2>Add User</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Full name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="TENANT">Tenant</option>
                  <option value="LANDLORD">Landlord</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {form.role === 'TENANT' && (
                <div className="form-group">
                  <label>Assign Room</label>
                  <select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}>
                    <option value="">None</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.building?.name} - {r.roomNumber}</option>)}
                  </select>
                </div>
              )}
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
