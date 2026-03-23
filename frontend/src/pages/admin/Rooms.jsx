import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import AdminBackButton from '../../components/AdminBackButton';
import './Admin.css';

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ buildingId: '', roomNumber: '', floor: '', capacity: 1, monthlyRent: '', amenities: [], description: '' });

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    api.get('/rooms').then(r => setRooms(r.data));
    api.get('/buildings').then(r => setBuildings(r.data));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'edit') {
        await api.put(`/rooms/${form.id}`, form);
        toast.success('Room updated');
      } else {
        await api.post('/rooms', form);
        toast.success('Room created');
      }
      setModal(null);
      setForm({ buildingId: '', roomNumber: '', floor: '', capacity: 1, monthlyRent: '', amenities: [], description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const openEdit = (room) => {
    setForm({
      id: room.id,
      buildingId: room.buildingId,
      roomNumber: room.roomNumber,
      floor: room.floor || '',
      capacity: room.capacity,
      monthlyRent: room.monthlyRent,
      amenities: room.amenities || [],
      description: room.description || '',
      isAvailable: room.isAvailable,
      maintenanceMode: room.maintenanceMode,
    });
    setModal('edit');
  };

  const deleteRoom = async (id) => {
    if (!confirm('Delete this room?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Room deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <AdminBackButton />
        <div className="admin-header">
          <h1>Room Management</h1>
          <button className="btn btn-primary" onClick={() => { setForm({ buildingId: buildings[0]?.id || '', roomNumber: '', floor: '', capacity: 1, monthlyRent: '', amenities: [], description: '' }); setModal('add'); }}>Add Room</button>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Building</th>
                <th>Room</th>
                <th>Capacity</th>
                <th>Rent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}>
                  <td>{r.building?.name}</td>
                  <td>{r.roomNumber}</td>
                  <td>{r.capacity}</td>
                  <td>${r.monthlyRent}</td>
                  <td>
                    <span className={`badge ${r.isAvailable ? 'badge-success' : 'badge-warning'}`}>{r.isAvailable ? 'Available' : 'Occupied'}</span>
                  </td>
                  <td>
                    <button onClick={() => openEdit(r)} className="btn-sm">Edit</button>
                    <button onClick={() => deleteRoom(r.id)} className="btn-sm btn-danger">Delete</button>
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
            <h2>{modal === 'edit' ? 'Edit Room' : 'Add Room'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Building</label>
                <select value={form.buildingId} onChange={e => setForm(f => ({ ...f, buildingId: e.target.value }))} required>
                  <option value="">Select</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Room Number</label>
                <input value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Floor</label>
                <input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <select value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) }))}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monthly Rent</label>
                <input type="number" step="0.01" value={form.monthlyRent} onChange={e => setForm(f => ({ ...f, monthlyRent: e.target.value }))} required />
              </div>
              {modal === 'edit' && (
                <>
                  <div className="form-group">
                    <label><input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} /> Available</label>
                  </div>
                  <div className="form-group">
                    <label><input type="checkbox" checked={form.maintenanceMode} onChange={e => setForm(f => ({ ...f, maintenanceMode: e.target.checked }))} /> Maintenance Mode</label>
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
