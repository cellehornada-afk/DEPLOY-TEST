import { Link } from 'react-router-dom';
import './AdminBackButton.css';

export default function TenantBackButton() {
  return (
    <Link to="/tenant" className="admin-back-btn" aria-label="Back to dashboard">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>Back to Dashboard</span>
    </Link>
  );
}
