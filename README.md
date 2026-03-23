 p# Apartment Management System

A full-stack, secure, scalable apartment management web application for managing multiple apartment buildings.

## Features

### Public Website
- Search & view available rooms (filter by building, capacity, price)
- View building information and galleries
- Contact form with FAQ
- Google Maps integration

### Admin Dashboard
- Room & building management (CRUD, bulk CSV import)
- User management (create tenants, assign rooms, reset passwords)
- Payment & billing (track paid/pending/overdue, generate receipts)
- Maintenance request handling
- Booking/reservation management
- Analytics dashboard
- Contact message inbox

### Tenant Dashboard
- View assigned room
- Payment history & receipt download
- Submit maintenance requests

### Security
- JWT authentication with httpOnly cookies
- Role-based access (Admin, Staff, Tenant)
- bcrypt password hashing
- Rate limiting
- Input validation
- Helmet security headers

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma

## Setup

### Prerequisites
- Node.js 18+
- npm

### Installation

1. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure environment**
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL` (default uses SQLite: `file:./dev.db`)
   - Set `JWT_SECRET` for production

3. **Initialize database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Run development servers**
   ```bash
   # From project root
   npm run dev
   ```
   - Backend: http://localhost:3001
   - Frontend: http://localhost:5173

### Default Admin Login
- Email: `admin@apartment.com`
- Password: `Admin123!`

## Project Structure

```
RM/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── uploads/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── lib/
│   └── index.html
└── package.json
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use PostgreSQL: `DATABASE_URL="postgresql://..."`
3. Run `npx prisma migrate deploy`
4. Build frontend: `cd frontend && npm run build`
5. Serve frontend static files from Express or use a reverse proxy (nginx)

## Color Palette

- Primary: `#173f24`
- Cream: `#F9F3E7`
- Gold: `#DBAB50`
