import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import AdminBackButton from '../../components/AdminBackButton';
import './Admin.css';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => { load(); }, []);

  const load = () => api.get('/bookings').then(r => setBookings(r.data));

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}`, { status });
      toast.success('Updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const statusBadge = (s) => {
    const c = s === 'APPROVED' ? 'badge-success' : s === 'REJECTED' ? 'badge-danger' : 'badge-warning';
    return <span className={`badge ${c}`}>{s}</span>;
  };

  return (
    <div className="admin-page">
      <div className="container">
        <AdminBackButton />
        <h1>Bookings</h1>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td>{b.room?.roomNumber}</td>
                  <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
                  <td>{new Date(b.checkOutDate).toLocaleDateString()}</td>
                  <td>${b.bookingFee}</td>
                  <td>{statusBadge(b.status)}</td>
                  <td>
                    {b.status === 'PENDING' && (
                      <>
                        <button className="btn-sm" onClick={() => updateStatus(b.id, 'APPROVED')}>Approve</button>
                        <button className="btn-sm btn-danger" onClick={() => updateStatus(b.id, 'REJECTED')}>Reject</button>
                      </>
                    )}
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
