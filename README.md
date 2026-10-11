# 🏥 MediQueue - Patient Queue Management System

A full-stack Patient Queue Management System built with **React 19 + Vite** (frontend) and **Node.js + Express + PostgreSQL** (backend).

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based login, register & forgot password
- Role-based access (Receptionist / Patient)
- Rate limiting (100 req/15 min per IP)
- Security headers (XSS, CSRF, Clickjacking protection)
- Password hashing with bcryptjs

### 📊 Dashboard & Analytics
- Real-time stats (Total patients, Waiting, Consulting, Completed)
- CSS-based bar charts for department & doctor breakdowns
- Weekly patient trend visualization
- Time-based greeting (Good morning/afternoon/evening)
- Recent activity timeline

### 👥 Patient Management
- Register patients with full details (name, age, gender, doctor, department, reason)
- Search patients by name, token, or doctor
- Filter by status & department
- Patient profile modal with full details
- Export patient list to CSV

### 🔄 Queue Management
- Live patient queue with auto-refresh (30 seconds)
- "Last updated X seconds ago" indicator
- Call next patient / Mark as completed
- Print queue tickets (thermal-style format)

### 📅 Appointments
- Schedule appointments with date & time
- View upcoming/completed/cancelled appointments
- Status management (scheduled → completed / cancelled)

### 🩺 Medical Records
- Add diagnosis, prescriptions, and clinical notes
- View patient medical history
- Previous reports for patient view

### 💊 Medicines
- Searchable medicine catalog with categories
- Prescribe medicines to patients (receptionist)
- View prescribed medications (patient)

### 👨‍⚕️ Doctor Management
- Add/edit/remove doctors
- Toggle availability status
- View department & room assignments

### 🔔 Notifications
- Real-time notifications with unread count
- Mark as read / Mark all as read
- Multiple types: info, warning, success, error

### 🤖 AI Assistant
- Built-in chatbot for system navigation help
- Keyword-based responses for common queries

### 🌙 Dark Mode
- Full dark mode support with CSS variables
- Persisted in localStorage
- Toggle from Settings or topbar

### 📧 Email Notifications
- Welcome emails on registration
- Appointment confirmation emails
- Queue notification emails

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React 19, Vite 8, CSS3              |
| Backend    | Node.js, Express 5                  |
| Database   | PostgreSQL                           |
| Auth       | JWT, bcryptjs                        |
| Email      | Nodemailer                           |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Database Setup
```sql
-- Create database
CREATE DATABASE "patient queue";

-- Run the schema
-- File: backend/src/db/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure .env file with your DB credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 📁 Project Structure

```
PatientQueueManagement/
├── backend/
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── db/
│       │   └── schema.sql
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   ├── roleMiddleware.js
│       │   └── rateLimiter.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── patientRoutes.js
│       │   ├── appointmentRoutes.js
│       │   ├── medicalRecordRoutes.js
│       │   ├── medicineRoutes.js
│       │   ├── notificationRoutes.js
│       │   ├── analyticsRoutes.js
│       │   └── doctorRoutes.js
│       └── utils/
│           ├── emailService.js
│           └── helpers.js
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        └── index.css
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Reset password |
| GET | `/api/patients` | Get all patients |
| POST | `/api/patients` | Register patient |
| GET | `/api/patients/queue` | Get today's queue |
| PATCH | `/api/patients/queue/:id` | Update queue status |
| GET | `/api/patients/my-queue` | Get my queue (auth) |
| GET/POST | `/api/appointments` | Manage appointments |
| GET/POST | `/api/medical-records` | Manage medical records |
| GET/POST | `/api/medicines` | Manage medicines |
| POST | `/api/medicines/prescribe` | Prescribe medicine |
| GET | `/api/notifications` | Get notifications (auth) |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/weekly` | Weekly trends |
| GET | `/api/analytics/department-stats` | Department breakdown |
| GET | `/api/analytics/doctor-stats` | Doctor stats |
| GET/POST | `/api/doctors` | Manage doctors |

---

## 📝 License
ISC
