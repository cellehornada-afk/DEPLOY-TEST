import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FloatingChat from '../../components/FloatingChat';
import api from '../../lib/api';
import './Tenant.css';

export default function TenantDashboard() {
  const { user } = useAuth();
  const room = user?.room;
  const [requestsWithReplies, setRequestsWithReplies] = useState([]);

  useEffect(() => {
    api.get('/requests/my').then(r => {
      const withReplies = (r.data || []).filter(req => req.adminReply);
      setRequestsWithReplies(withReplies.slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <div className="tenant-page">
      <FloatingChat />
      <div className="container">
        <h1>Welcome, {user?.name || 'Tenant'}!</h1>
        {requestsWithReplies.length > 0 && (
          <div className="tenant-maintenance-replies">
            <h3>Maintenance Replies</h3>
            <p className="tenant-replies-desc">Updates from maintenance on your requests:</p>
            {requestsWithReplies.map(req => (
              <div key={req.id} className="tenant-reply-card">
                <div className="tenant-reply-header">
                  <strong>{req.title}</strong>
                  <span className="tenant-reply-status">{req.status}</span>
                </div>
                <p className="tenant-reply-msg">{req.adminReply}</p>
                <Link to="/tenant/requests" className="tenant-reply-link">View all requests →</Link>
              </div>
            ))}
          </div>
        )}
        <div className="tenant-cards">
          {room ? (
            <div className="tenant-card">
              <h3>Your Room</h3>
              <p><strong>{room.building?.name} - Room {room.roomNumber}</strong></p>
              <p>${room.monthlyRent}/month</p>
              <Link to={`/rooms/${room.id}`} className="btn btn-outline">View Details</Link>
            </div>
          ) : (
            <div className="tenant-card">
              <h3>No Room Assigned</h3>
              <p>Contact admin to get assigned to a room.</p>
            </div>
          )}
          <Link to="/tenant/payments" className="tenant-card link-card">
            <h3>Payments</h3>
            <p>View payment history and due dates</p>
          </Link>
          <Link to="/tenant/requests" className="tenant-card link-card">
            <h3>Maintenance</h3>
            <p>Submit and track maintenance requests</p>
          </Link>
          <div className="tenant-card gcash-card">
            <h3>GCash Payment</h3>
            <p>Scan to pay your rent via GCash</p>
            <div className="gcash-qr-container">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=gcash%3A%2F%2Fpay%3Fpa%3D09171234567%26pn%3DApartmentMgmt%26am%3D0"
                alt="GCash QR Code - Scan to pay"
                className="gcash-qr"
              />
            </div>
            <p className="gcash-note">Scan with GCash app to pay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
