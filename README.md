# TaskNova - Task Management System
> **Status**: 🚀 Active Development - Testing Git Collaborators

A full-stack Task Management System with role-based access control, real-time WebSocket notifications, and 2FA authentication.

## Tech Stack
- **Backend**: Node.js + Express + Sequelize + MySQL + WebSocket
- **Frontend**: React + React Router + Axios
- **Auth**: JWT + 2FA via Email OTP

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0

### 1. Setup Database
```bash
mysql -u root -p -e "CREATE DATABASE tms_db;"
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env   # Edit .env with your DB credentials
npm install
node seed.js           # Create test users
npm run dev            # Start backend on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env   # Already configured for localhost
npm install
npm start              # Start frontend on port 3000
```

### 4. Login with Test Accounts
After running `node seed.js`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tms.com | Admin@1234 |
| Project Manager | manager@tms.com | Manager@1234 |
| Collaborator | collaborator@tms.com | Collab@1234 |

> **Note**: 2FA codes appear in the backend console during development (check terminal output).

## Docker (Full Stack)
```bash
docker-compose up -d
# Then run seed: docker exec tms-backend node seed.js
```

## API Documentation
Visit `http://localhost:5000/api/docs` after starting the backend.
