import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo" aria-label="ApartmentMgmt - Home">
          <span className="logo-icon">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L4 14v14h8V18h8v10h8V14L16 4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="logo-text">ome</span>
        </Link>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <ul className={`nav-links ${open ? 'open' : ''}`}>
          <li><Link to="/buildings" className="nav-link" onClick={() => setOpen(false)}>Buildings</Link></li>
          {!(user?.role === 'ADMIN' || user?.role === 'LANDLORD' || user?.role === 'MAINTENANCE') && (
            <li><Link to="/contact" className="nav-link" onClick={() => setOpen(false)}>Contact</Link></li>
          )}
          {user ? (
            <>
              {user.role === 'TENANT' && (
                <li><Link to="/tenant" className="nav-link" onClick={() => setOpen(false)}>Dashboard</Link></li>
              )}
              {(user.role === 'ADMIN' || user.role === 'LANDLORD' || user.role === 'MAINTENANCE') && (
                <li><Link to="/admin" className="nav-link" onClick={() => setOpen(false)}>Dashboard</Link></li>
              )}
              <li>
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item-cta"><Link to="/login" className="nav-link nav-link-cta" onClick={() => setOpen(false)}>Login</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
