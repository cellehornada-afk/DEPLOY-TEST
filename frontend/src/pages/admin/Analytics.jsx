import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AdminBackButton from '../../components/AdminBackButton';
import './Admin.css';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics').then(r => setData(r.data));
  }, []);

  if (!data) return <div className="loading-screen">Loading...</div>;

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = data.monthlyRevenue?.map(m => ({ month: monthNames[m.month - 1], revenue: m.revenue })) || [];

  return (
    <div className="admin-page">
      <div className="container">
        <AdminBackButton />
        <h1>Analytics</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Income (Selected)</h3>
            <p className="stat-value">${data.totalIncome?.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Occupancy Rate</h3>
            <p className="stat-value">{data.occupancyRate}%</p>
          </div>
          <div className="stat-card">
            <h3>Vacant Rooms</h3>
            <p className="stat-value">{data.vacantRooms}</p>
          </div>
          <div className="stat-card">
            <h3>Overdue Payments</h3>
            <p className="stat-value">{data.overduePayments}</p>
          </div>
        </div>
        <div className="chart-section">
          <h2>Monthly Revenue</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="var(--color-gold)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
