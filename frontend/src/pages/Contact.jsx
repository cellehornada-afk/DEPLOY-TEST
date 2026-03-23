import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Contact.css';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: roomId ? 'Room inquiry' : '', message: '' });

  useEffect(() => {
    api.get('/settings/site').then(r => setSettings(r.data));
  }, []);

  useEffect(() => {
    if (roomId) setForm(f => ({ ...f, subject: `Room inquiry - ${roomId}`, message: `I'm interested in room ${roomId}. Please provide more information.` }));
  }, [roomId]);

  const isValidPhPhone = (val) => {
    const digits = (val || '').replace(/\D/g, '');
    if (digits.length === 11) return /^09[0-9]{9}$/.test(digits);
    if (digits.length === 12) return /^639[0-9]{9}$/.test(digits);
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone?.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!isValidPhPhone(form.phone)) {
      toast.error('Phone must be a valid Philippine number (11 digits, e.g. 09XXXXXXXXX)');
      return;
    }
    try {
      await api.post('/contact', form);
      toast.success('Message sent successfully!');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    }
  };

  const email = settings.contactEmail || 'contact@apartment.com';
  const phone = settings.contactPhone || '+1234567890';

  return (
    <div className="contact-page">
      <div className="container">
        <h1>Contact Us</h1>
        <div className="contact-grid">
          <div className="contact-form-section">
            <h2>Send a Message</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <input type="tel" placeholder="Phone * (09XXXXXXXXX)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              <input type="text" placeholder="Subject *" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
              <textarea placeholder="Message *" rows="5" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <a href={`mailto:${email}`} className="contact-link">📧 {email}</a>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="contact-link">📞 {phone}</a>
            {settings.mapEmbedUrl && (
              <div className="map-container">
                <iframe src={settings.mapEmbedUrl} width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy" title="Map" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
