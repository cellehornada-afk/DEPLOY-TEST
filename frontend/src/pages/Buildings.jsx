import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import './Buildings.css';

export default function Buildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/buildings')
      .then(r => setBuildings(r.data || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load buildings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (error) return <div className="container"><p className="buildings-error">{error}</p></div>;

  return (
    <div className="buildings-page">
      <div className="container">
        <h1>Our Buildings</h1>
        {buildings.length === 0 ? (
          <p className="buildings-empty">No buildings available at the moment.</p>
        ) : (
        <div className="buildings-grid">
          {buildings.map(b => (
            <Link key={b.id} to={`/buildings/${b.id}`} className="building-card">
              <div className="building-image">
                {b.images?.[0] ? (
                  <img src={b.images[0]} alt={b.name} />
                ) : (
                  <div className="building-placeholder">{b.name}</div>
                )}
              </div>
              <div className="building-info">
                <h3>{b.name}</h3>
                <p className="address">{b.address}</p>
                <p className="rooms">{b.rooms?.length || 0} available rooms</p>
              </div>
            </Link>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
