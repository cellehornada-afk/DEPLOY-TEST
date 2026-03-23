import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import AdminBackButton from '../../components/AdminBackButton';
import './Admin.css';

export default function AdminBuildings() {
  const [buildings, setBuildings] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', description: '', facilities: [] });

  useEffect(() => { api.get('/buildings').then(r => setBuildings(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'edit') {
        await api.put(`/buildings/${form.id}`, form);
        toast.success('Building updated');
      } else {
        await api.post('/buildings', form);
        toast.success('Building created');
      }
      setModal(null);
      api.get('/buildings').then(r => setBuildings(r.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const deleteBuilding = async (id) => {
    if (!confirm('Delete building and all its rooms?')) return;
    try {
      await api.delete(`/buildings/${id}`);
      toast.success('Deleted');
      setBuildings(b => b.filter(x => x.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <AdminBackButton />
        <div className="admin-header">
          <h1>Buildings</h1>
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', address: '', description: '', facilities: [] }); setModal('add'); }}>Add Building</button>
        </div>
        <div className="admin-grid">
          {buildings.map(b => (
            <div key={b.id} className="admin-card" style={{ flexDirection: 'column' }}>
              <h3>{b.name}</h3>
              <p>{b.address}</p>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button className="btn-sm" onClick={() => { setForm({ id: b.id, name: b.name, address: b.address, description: b.description || '', facilities: b.facilities || [] }); setModal('edit'); }}>Edit</button>
                <button className="btn-sm btn-danger" onClick={() => deleteBuilding(b.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{modal === 'edit' ? 'Edit Building' : 'Add Building'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
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
