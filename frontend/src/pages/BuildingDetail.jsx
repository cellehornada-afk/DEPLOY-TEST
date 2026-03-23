import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import './BuildingDetail.css';

export default function BuildingDetail() {
  const { id } = useParams();
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/buildings/${id}`).then(r => setBuilding(r.data)).catch(() => setBuilding(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!building) return <div className="container"><p>Building not found.</p></div>;

  const facilities = building.facilities || [];
  const rooms = building.rooms || [];

  return (
    <div className="building-detail">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/buildings">Buildings</Link> / {building.name}
        </nav>
        <div className="building-header">
          <h1>{building.name}</h1>
          <p className="address">{building.address}</p>
          {building.description && <p className="description">{building.description}</p>}
        </div>
        {facilities.length > 0 && (
          <section className="facilities">
            <h2>Facilities</h2>
            <ul>
              {facilities.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </section>
        )}
        <section className="rooms-section">
          <h2>Available Rooms</h2>
          {rooms.length === 0 ? (
            <p>No rooms currently available.</p>
          ) : (
            <div className="rooms-list">
              {rooms.map(room => (
                <Link key={room.id} to={`/rooms/${room.id}`} className="room-item">
                  <span>Room {room.roomNumber}</span>
                  <span>{room.capacity} {room.capacity === 1 ? 'person' : 'persons'}</span>
                  <span className="price">${room.monthlyRent}/mo</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
