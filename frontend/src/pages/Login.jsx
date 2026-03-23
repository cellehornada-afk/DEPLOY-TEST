import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

const AdminIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const PersonCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
  </svg>
);

const LandlordIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9v.01" />
    <path d="M9 12v.01" />
    <path d="M9 15v.01" />
    <path d="M9 18v.01" />
  </svg>
);

const MaintenanceIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

function formatCooldown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const EyeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [, setTick] = useState(0);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const homeForRole = (role) => {
    if (role === 'TENANT') return '/tenant';
    return '/admin';
  };

  const redirect = location.state?.from?.pathname || (user ? homeForRole(user.role) : '/admin');

  useEffect(() => {
    if (!cooldownUntil) return undefined;
    const id = setInterval(() => {
      setTick(t => t + 1);
      if (Date.now() >= cooldownUntil) setCooldownUntil(null);
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const cooldownSeconds = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
    : 0;
  const isLockedOut = cooldownSeconds > 0;

  if (user) {
    navigate(redirect, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLockedOut) return;
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Logged in successfully');
      setCooldownUntil(null);
      navigate(homeForRole(data?.user?.role), { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || 'Login failed';
      const retry = err.response?.data?.retryAfterSeconds;
      if (status === 429 && typeof retry === 'number' && retry > 0) {
        setCooldownUntil(Date.now() + retry * 1000);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'admin', label: 'Admin', icon: AdminIcon },
    { id: 'landlord', label: 'Landlord', icon: LandlordIcon },
    { id: 'maintenance', label: 'Maintenance', icon: MaintenanceIcon },
    { id: 'tenant', label: 'Tenant', icon: PersonCircleIcon },
  ];

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-glass">
        {!selectedRole ? (
          <>
            <h1 className="login-title">Login as:</h1>
            <div className="login-roles">
              {roles.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="login-role-btn"
                  onClick={() => setSelectedRole(id)}
                >
                  <span className="login-role-icon">
                    <Icon />
                  </span>
                  <span className="login-role-label">{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button type="button" className="login-back" onClick={() => setSelectedRole(null)}>
              ← Back
            </button>
            <h1 className="login-title">Login as {selectedRole === 'maintenance' ? 'Maintenance' : selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</h1>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <div className="login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLockedOut}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {isLockedOut && (
                <p className="login-cooldown" role="status">
                  Try again in {formatCooldown(cooldownSeconds)}
                </p>
              )}
              <button type="submit" className="login-submit" disabled={loading || isLockedOut}>
                {loading ? 'Logging in...' : isLockedOut ? `Wait ${formatCooldown(cooldownSeconds)}` : 'Login'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
