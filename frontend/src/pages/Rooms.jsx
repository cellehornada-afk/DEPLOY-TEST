import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import './Rooms.css';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState({ buildingId: '', capacity: '', minPrice: '', maxPrice: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/buildings').then(r => setBuildings(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.buildingId) params.set('buildingId', filters.buildingId);
    if (filters.capacity) params.set('capacity', filters.capacity);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    api.get(`/rooms/search?${params}`).then(r => setRooms(r.data)).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="rooms-page">
      <div className="container">
        <h1>Available Rooms</h1>
        <div className="filters">
          <select value={filters.buildingId} onChange={e => setFilters(f => ({ ...f, buildingId: e.target.value }))}>
            <option value="">All Buildings</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filters.capacity} onChange={e => setFilters(f => ({ ...f, capacity: e.target.value }))}>
            <option value="">All Capacities</option>
            <option value="1">1 Person</option>
            <option value="2">2 Persons</option>
            <option value="3">3+ Persons</option>
          </select>
          <input type="number" placeholder="Min price" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} />
          <input type="number" placeholder="Max price" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} />
        </div>

        {loading ? (
          <div className="loading">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <p className="empty">No rooms found matching your criteria.</p>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <Link key={room.id} to={`/rooms/${room.id}`} className="room-card">
                <div className="room-image">
                  {room.images?.[0] ? (
                    <img src={room.images[0]} alt={room.roomNumber} />
                  ) : (
                    <div className="room-placeholder">Room {room.roomNumber}</div>
                  )}
                  <span className="room-badge">{room.capacity} {room.capacity === 1 ? 'person' : 'persons'}</span>
                </div>
                <div className="room-info">
                  <h3>{room.building?.name} - {room.roomNumber}</h3>
                  <p className="price">${room.monthlyRent}/month</p>
                  <p className="status">{room.isAvailable ? 'Available' : 'Occupied'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
