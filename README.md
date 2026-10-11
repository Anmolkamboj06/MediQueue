# 🏥 MediQueue — Patient Queue Management System

A full-stack Patient Queue Management System built with **React 19 + Vite** (frontend) and **Node.js + Express + PostgreSQL** (backend).

MediQueue helps clinics manage patient registration, queue tracking, doctor appointments, medical records, medicines, and notifications through a centralized application.

## ✨ Features

### 🔐 Authentication & Security
- JWT-based login, registration, and password reset
- Role-based access for receptionists and patients
- API rate limiting
- Security headers
- Password hashing with bcryptjs

### 📊 Dashboard & Analytics
- Patient, waiting, consultation, and completion statistics
- Department and doctor breakdowns
- Weekly patient trends
- Recent activity timeline

### 👥 Patient Management
- Patient registration and details
- Search by patient name, token, or doctor
- Filter by status and department
- Patient profiles
- CSV export

### 🔄 Queue Management
- Patient queue tracking
- Automatic queue refresh
- Call the next patient
- Update queue status
- Print queue tickets

### 📅 Appointments
- Schedule appointments by date and time
- View upcoming and completed appointments
- Manage appointment status

### 🩺 Medical Records
- Store diagnoses, prescriptions, and clinical notes
- View patient medical history
- Access previous reports

### 💊 Medicines
- Search the medicine catalog
- Organize medicines by category
- Prescribe and view patient medications

### 👨‍⚕️ Doctor Management
- Manage doctor details
- Track availability
- View departments and room assignments

### 🔔 Notifications
- View notifications and unread counts
- Mark notifications as read
- Support multiple notification types

### 🤖 AI Assistant
- Built-in chatbot for system navigation help
- Keyword-based responses to common queries

### 🌙 Dark Mode
- Dark mode styling
- Theme preference stored in localStorage
- Theme toggle in the interface

### 📧 Email Notifications
- Registration emails
- Appointment confirmations
- Queue notifications

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, CSS3 |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Authentication | JWT, bcryptjs |
| Email | Nodemailer |

## 📁 Project Structure

```text
MediQueue/
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── middleware/
│       ├── routes/
│       └── utils/
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       └── index.css
├── .gitignore
├── README.md
└── SETUP.md
```

## 🚀 Setup Instructions

For complete installation and configuration instructions, see **[SETUP.md](SETUP.md)**.

### Prerequisites
- Node.js 18 or later
- PostgreSQL 14 or later
- Git

### 1. Configure the database
Create a PostgreSQL database and configure your backend environment variables using the instructions in `SETUP.md`.

### 2. Start the backend

```bash
cd backend
npm install
node src/server.js
```

### 3. Start the frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

The backend port and available endpoints depend on your configuration and implementation.

## 🔌 API Endpoints

The backend includes route modules for authentication, patients and queues, appointments, medical records, medicines, notifications, doctors, and analytics.

Refer to the source files under `backend/src/routes/` for the implemented endpoints.

## 🔒 Security Notes

- Never commit `.env` files, passwords, API keys, JWT secrets, or email credentials.
- Do not publish real patient information or database backups.
- Configure your own environment variables before running the application.
- Use synthetic patient data for demonstrations and testing.

## 📝 License

ISC