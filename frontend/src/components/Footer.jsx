import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          <div>
            <h3>Property Management</h3>
            <p>Effortless property care, stress-free living.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/rooms">Rooms</Link></li>
              <li><Link to="/buildings">Buildings</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Property Management. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
