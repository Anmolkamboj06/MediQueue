const express = require("express");
const pool = require("../db");
const { sendAppointmentConfirmation } = require("../utils/emailService");

const router = express.Router();

// =====================================================
// CREATE APPOINTMENT
// POST /api/appointments
// =====================================================
router.post("/", async (req, res) => {
    try {
        const {
            patient_id,
            doctor_name,
            department,
            appointment_date,
            appointment_time,
            notes,
            status = "scheduled"
        } = req.body;

        if (!patient_id || !doctor_name || !department || !appointment_date || !appointment_time) {
            return res.status(400).json({
                message: "patient_id, doctor_name, department, appointment_date, and appointment_time are required"
            });
        }

        // Verify patient exists
        const patientCheck = await pool.query(
            "SELECT id, name, email, phone FROM patients WHERE id = $1",
            [patient_id]
        );

        if (patientCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        const patient = patientCheck.rows[0];

        const result = await pool.query(
            `INSERT INTO appointments 
            (patient_id, doctor_name, department, appointment_date, appointment_time, status, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [patient_id, doctor_name, department, appointment_date, appointment_time, status, notes || null]
        );

        const newAppointment = result.rows[0];

        // Try sending confirmation email if patient email exists (non-blocking)
        if (patient.email) {
            sendAppointmentConfirmation(patient.email, {
                patientName: patient.name,
                doctorName: doctor_name,
                department,
                appointmentDate: appointment_date,
                appointmentTime: appointment_time,
                status: newAppointment.status
            }).catch((err) => console.error("Email notification failed:", err.message));
        }

        return res.status(201).json({
            message: "Appointment created successfully",
            appointment: {
                ...newAppointment,
                patient_name: patient.name,
                patient_phone: patient.phone,
                patient_email: patient.email
            }
        });
    } catch (error) {
        console.error("Error creating appointment:", error);
        return res.status(500).json({
            message: "Failed to create appointment",
            error: error.message
        });
    }
});

// =====================================================
// GET ALL APPOINTMENTS (Optional ?date=YYYY-MM-DD filter)
// GET /api/appointments
// =====================================================
router.get("/", async (req, res) => {
    try {
        const { date, status, doctor_name } = req.query;

        let query = `
            SELECT 
                a.*,
                p.name AS patient_name,
                p.phone AS patient_phone,
                p.email AS patient_email,
                p.gender AS patient_gender,
                p.age AS patient_age
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (date) {
            queryParams.push(date);
            query += ` AND a.appointment_date = $${queryParams.length}`;
        }

        if (status) {
            queryParams.push(status);
            query += ` AND a.status = $${queryParams.length}`;
        }

        if (doctor_name) {
            queryParams.push(`%${doctor_name}%`);
            query += ` AND a.doctor_name ILIKE $${queryParams.length}`;
        }

        query += " ORDER BY a.appointment_date ASC, a.appointment_time ASC";

        const result = await pool.query(query, queryParams);

        return res.json({
            count: result.rows.length,
            appointments: result.rows
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return res.status(500).json({
            message: "Failed to fetch appointments",
            error: error.message
        });
    }
});

// =====================================================
// GET APPOINTMENTS FOR SPECIFIC PATIENT
// GET /api/appointments/patient/:patientId
// =====================================================
router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;

        const result = await pool.query(
            `SELECT 
                a.*,
                p.name AS patient_name,
                p.phone AS patient_phone,
                p.email AS patient_email
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE a.patient_id = $1
            ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
            [patientId]
        );

        return res.json({
            patient_id: parseInt(patientId, 10),
            count: result.rows.length,
            appointments: result.rows
        });
    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        return res.status(500).json({
            message: "Failed to fetch patient appointments",
            error: error.message
        });
    }
});

// =====================================================
// GET SINGLE APPOINTMENT
// GET /api/appointments/:id
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                a.*,
                p.name AS patient_name,
                p.phone AS patient_phone,
                p.email AS patient_email,
                p.age AS patient_age,
                p.gender AS patient_gender
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE a.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        return res.json({
            appointment: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching appointment:", error);
        return res.status(500).json({
            message: "Failed to fetch appointment",
            error: error.message
        });
    }
});

// =====================================================
// UPDATE APPOINTMENT STATUS
// PATCH /api/appointments/:id
// =====================================================
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, appointment_date, appointment_time } = req.body;

        const checkResult = await pool.query("SELECT * FROM appointments WHERE id = $1", [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        const current = checkResult.rows[0];
        const newStatus = status !== undefined ? status : current.status;
        const newNotes = notes !== undefined ? notes : current.notes;
        const newDate = appointment_date !== undefined ? appointment_date : current.appointment_date;
        const newTime = appointment_time !== undefined ? appointment_time : current.appointment_time;

        const updateResult = await pool.query(
            `UPDATE appointments
            SET status = $1, notes = $2, appointment_date = $3, appointment_time = $4
            WHERE id = $5
            RETURNING *`,
            [newStatus, newNotes, newDate, newTime, id]
        );

        return res.json({
            message: "Appointment updated successfully",
            appointment: updateResult.rows[0]
        });
    } catch (error) {
        console.error("Error updating appointment:", error);
        return res.status(500).json({
            message: "Failed to update appointment",
            error: error.message
        });
    }
});

// =====================================================
// CANCEL / DELETE APPOINTMENT
// DELETE /api/appointments/:id
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deleteResult = await pool.query(
            "DELETE FROM appointments WHERE id = $1 RETURNING *",
            [id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        return res.json({
            message: "Appointment cancelled and removed successfully",
            cancelled_appointment: deleteResult.rows[0]
        });
    } catch (error) {
        console.error("Error deleting appointment:", error);
        return res.status(500).json({
            message: "Failed to cancel appointment",
            error: error.message
        });
    }
});

module.exports = router;
