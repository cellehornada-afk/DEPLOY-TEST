import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import './Admin.css';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contactMessages, setContactMessages] = useState([]);
  const bellRef = useRef(null);

  const fetchUnreadCount = useCallback(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'LANDLORD')) {
      return api.get('/contact')
        .then(r => {
          const n = (r.data || []).filter(m => !m.isRead).length;
          setUnreadCount(n);
        })
        .catch(() => setUnreadCount(0));
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [authLoading, fetchUnreadCount]);

  useEffect(() => {
    const onFocus = () => fetchUnreadCount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const onClick = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (dropdownOpen && (user?.role === 'ADMIN' || user?.role === 'LANDLORD')) {
      api.get('/contact').then(r => setContactMessages(r.data || [])).catch(() => setContactMessages([]));
      fetchUnreadCount();
    }
  }, [dropdownOpen, user?.role, fetchUnreadCount]);

  const markRead = (id) => {
    api.put(`/contact/${id}/read`).then(() => {
      setContactMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
      setUnreadCount(c => Math.max(0, c - 1));
    }).catch(() => {});
  };

  const links = [
    { to: '/admin/rooms', label: 'Rooms', desc: 'Manage rooms and buildings' },
    { to: '/admin/buildings', label: 'Buildings', desc: 'Add and edit buildings' },
    { to: '/admin/users', label: 'Users', desc: 'Create landlords and tenants' },
    { to: '/admin/requests', label: 'Maintenance', desc: 'Tenant maintenance requests' },
    { to: '/admin/payments', label: 'Payments', desc: 'Track payments and billing' },
    { to: '/admin/bookings', label: 'Bookings', desc: 'Reservation management' },
    { to: '/admin/analytics', label: 'Analytics', desc: 'Reports and insights' },
    { to: '/admin/contact', label: 'Contact', desc: 'View contact messages', badge: unreadCount },
  ].filter(l => {
    if (user?.role === 'ADMIN') return true;
    if (user?.role === 'LANDLORD') {
      return !['/admin/rooms', '/admin/buildings', '/admin/users'].includes(l.to);
    }
    if (user?.role === 'MAINTENANCE') {
      return l.to === '/admin/requests';
    }
    return false;
  });

  const title = user?.role === 'LANDLORD'
    ? 'Landlord Dashboard'
    : user?.role === 'MAINTENANCE'
      ? 'Maintenance Dashboard'
      : 'Admin Dashboard';

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-dashboard-header">
          <h1>{title}</h1>
          {(user?.role === 'ADMIN' || user?.role === 'LANDLORD') && (
            <div className="admin-notif-wrap" ref={bellRef}>
              <button
                type="button"
                className="admin-notif-bell"
                onClick={() => setDropdownOpen(o => !o)}
                aria-label={`${unreadCount} unread contact message${unreadCount !== 1 ? 's' : ''}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && <span className="admin-notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
              {dropdownOpen && (
                <div className="admin-notif-dropdown">
                  <div className="admin-notif-dropdown-header">
                    <strong>Contact</strong>
                    <Link to="/admin/contact" className="admin-notif-view-all" onClick={() => setDropdownOpen(false)}>View all →</Link>
                  </div>
                  {contactMessages.length === 0 ? (
                    <p className="admin-notif-empty">No contact messages yet</p>
                  ) : (
                    contactMessages.filter(m => !m.isRead).length === 0 ? (
                      <p className="admin-notif-empty">All messages read</p>
                    ) : (
                      contactMessages
                        .filter(m => !m.isRead)
                        .map(m => (
                          <div key={m.id} className="admin-notif-item unread">
                            <strong>{m.name}</strong>
                            <span className="admin-notif-item-subject">{m.subject}</span>
                            <p>{m.message?.slice(0, 60)}{(m.message?.length || 0) > 60 ? '...' : ''}</p>
                            <button type="button" className="admin-notif-mark" onClick={() => markRead(m.id)}>Mark read</button>
                          </div>
                        ))
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="welcome">Welcome, {user?.name || 'User'}!</p>
        <div className="admin-grid">
          {links.map(link => (
            <Link key={link.to} to={link.to} className="admin-card">
              <h3>{link.label}{link.badge > 0 && <span className="admin-card-badge">{link.badge}</span>}</h3>
              <p>{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
