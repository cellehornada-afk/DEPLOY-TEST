import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import TenantBackButton from '../components/TenantBackButton';
import './RoomDetail.css';

export default function RoomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/rooms/${id}`).then(r => setRoom(r.data)).catch(() => setRoom(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!room) return <div className="container"><p>Room not found.</p></div>;

  const images = room.images || [];
  const amenities = room.amenities || [];

  return (
    <div className="room-detail">
      <div className="container">
        {user?.role === 'TENANT' && <TenantBackButton />}
        <nav className="breadcrumb">
          <Link to="/rooms">Rooms</Link> / {room.building?.name} - {room.roomNumber}
        </nav>
        <div className="room-detail-grid">
          <div className="room-gallery">
            {images.length > 0 ? (
              <img src={images[0]} alt={room.roomNumber} />
            ) : (
              <div className="gallery-placeholder">Room {room.roomNumber}</div>
            )}
          </div>
          <div className="room-details">
            <h1>{room.building?.name} - Room {room.roomNumber}</h1>
            <p className="status-badge">{room.isAvailable ? 'Available' : 'Occupied'}</p>
            <p className="price">${room.monthlyRent}/month</p>
            <p className="capacity">Capacity: {room.capacity} {room.capacity === 1 ? 'person' : 'persons'}</p>
            {room.description && <p>{room.description}</p>}
            {amenities.length > 0 && (
              <div className="amenities">
                <h3>Amenities</h3>
                <ul>
                  {amenities.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            <div className="actions">
              <Link to="/contact" className="btn btn-primary">Inquire</Link>
              {room.isAvailable && (
                <Link to={`/contact?room=${room.id}`} className="btn btn-outline">Reserve</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
