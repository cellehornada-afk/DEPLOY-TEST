import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import StarsBackground from './StarsBackground';

export default function Layout() {
  return (
    <div className="layout">
      <StarsBackground />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
