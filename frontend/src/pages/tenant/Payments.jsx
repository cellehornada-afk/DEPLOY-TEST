import { useState, useEffect } from 'react';
import api from '../../lib/api';
import TenantBackButton from '../../components/TenantBackButton';
import '../admin/Admin.css';

export default function TenantPayments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => { api.get('/payments/my').then(r => setPayments(r.data)); }, []);

  const statusBadge = (s) => {
    const c = s === 'PAID' ? 'badge-success' : s === 'OVERDUE' ? 'badge-danger' : 'badge-warning';
    return <span className={`badge ${c}`}>{s}</span>;
  };

  return (
    <div className="admin-page">
      <div className="container">
        <TenantBackButton />
        <h1>My Payments</h1>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Paid Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.room?.roomNumber}</td>
                  <td>${p.amount}</td>
                  <td>{new Date(p.dueDate).toLocaleDateString()}</td>
                  <td>{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '-'}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>{p.status === 'PAID' && <a href={`/api/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="btn-sm">Download Receipt</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
