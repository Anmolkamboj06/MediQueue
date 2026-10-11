
-- =====================================================
-- MEDIQUEUE - PATIENT QUEUE MANAGEMENT SYSTEM
-- PostgreSQL Database Schema
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'receptionist',
    phone VARCHAR(50),
    profile_pic TEXT,

    -- Support existing OTP-based password reset
    reset_otp VARCHAR(255),
    reset_otp_expires TIMESTAMP,

    -- Support token-based password reset
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20),
    doctor VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    blood_group VARCHAR(10),
    address TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. QUEUE
CREATE TABLE IF NOT EXISTS queue (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    queue_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 4. DOCTORS
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    room_number VARCHAR(50),
    available_days VARCHAR(255) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    diagnosis TEXT NOT NULL,
    prescription TEXT,
    notes TEXT,
    visit_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. MEDICINES
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    dosage VARCHAR(100),
    side_effects TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PATIENT MEDICINES
CREATE TABLE IF NOT EXISTS patient_medicines (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL
        REFERENCES medicines(id) ON DELETE CASCADE,
    prescribed_by VARCHAR(255),
    dosage_instructions TEXT NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_patients_created_at
    ON patients(created_at);

CREATE INDEX IF NOT EXISTS idx_queue_status
    ON queue(status);

CREATE INDEX IF NOT EXISTS idx_queue_created_at
    ON queue(created_at);

CREATE INDEX IF NOT EXISTS idx_queue_patient_id
    ON queue(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_date
    ON appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_patient
    ON appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient
    ON medical_records(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_medicines_patient
    ON patient_medicines(patient_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, is_read);
