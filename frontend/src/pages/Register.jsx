import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Register.css';

export default function Register() {
  const fileInputRef = useRef(null);
  const [accountType, setAccountType] = useState(null); // 'tenant' | 'staff'
  const [form, setForm] = useState({
    name: '',
    address: '',
    gender: '',
    age: '',
    email: '',
    message: '',
    phone: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      if (form.phone) fd.append('phone', form.phone);
      if (form.address) fd.append('address', form.address);
      if (form.gender) fd.append('gender', form.gender);
      if (form.age) fd.append('age', form.age);
      fd.append('message', form.message || '');
      fd.append('accountType', accountType || 'tenant');
      if (photo) fd.append('photo', photo);

      await api.post('/contact/register', fd);
      toast.success('Registration request submitted! We will contact you soon.');
      setForm({ name: '', address: '', gender: '', age: '', email: '', message: '', phone: '' });
      setAccountType(null);
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-bg">
        <div className="register-orb register-orb-1" />
        <div className="register-orb register-orb-2" />
        <div className="register-orb register-orb-3" />
      </div>

      <div className="register-glass">
        {!accountType ? (
          <div className="register-type-select">
            <p className="register-type-label">Register as:</p>
            <div className="register-type-buttons">
              <button
                type="button"
                className="register-type-btn"
                onClick={() => setAccountType('tenant')}
              >
                Tenant
              </button>
              <button
                type="button"
                className="register-type-btn"
                onClick={() => setAccountType('staff')}
              >
                Staff
              </button>
              <button
                type="button"
                className="register-type-btn"
                onClick={() => setAccountType('maintenance')}
              >
                Maintenance
              </button>
            </div>
            <p className="register-login">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="register-back"
              onClick={() => setAccountType(null)}
            >
              ← Back
            </button>
            <p className="register-type-badge">Registering as {accountType === 'tenant' ? 'Tenant' : accountType === 'staff' ? 'Staff' : 'Maintenance'}</p>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-column register-left">
            <div className="form-group">
              <input
                placeholder="Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="form-row-gender">
              <div className="form-group-radio">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={form.gender === 'Male'}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  />
                  <span>Male</span>
                </label>
              </div>
              <div className="form-group-radio">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={form.gender === 'Female'}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  />
                  <span>Female</span>
                </label>
              </div>
              <div className="form-group form-group-age">
                <input
                  placeholder="Age"
                  type="number"
                  min="18"
                  max="120"
                  value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="note-label">Note</label>
              <textarea
                placeholder="Tell us about your requirements..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows="4"
              />
            </div>
          </div>

          <div className="register-column register-right">
            <div
              className="register-photo-placeholder"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" />
              ) : (
                <span>PHOTO</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoChange}
              className="register-file-input"
            />
            <button
              type="button"
              className="register-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              UPLOAD
            </button>
            <button type="submit" className="register-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'CREATE ACCOUNT'}
            </button>
          </div>
        </form>
        <p className="register-login">
          Already have an account? <Link to="/login">Login</Link>
        </p>
          </>
        )}
      </div>
    </div>
  );
}
