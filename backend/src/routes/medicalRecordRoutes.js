const express = require("express");
const pool = require("../db");

const router = express.Router();

// =====================================================
// CREATE MEDICAL RECORD
// POST /api/medical-records
// =====================================================
router.post("/", async (req, res) => {
    try {
        const {
            patient_id,
            doctor_name,
            diagnosis,
            prescription,
            notes,
            visit_date
        } = req.body;

        if (!patient_id || !doctor_name || !diagnosis) {
            return res.status(400).json({
                message: "patient_id, doctor_name, and diagnosis are required fields"
            });
        }

        // Verify patient exists
        const patientCheck = await pool.query(
            "SELECT id, name FROM patients WHERE id = $1",
            [patient_id]
        );

        if (patientCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        const result = await pool.query(
            `INSERT INTO medical_records 
            (patient_id, doctor_name, diagnosis, prescription, notes, visit_date)
            VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE))
            RETURNING *`,
            [
                patient_id,
                doctor_name,
                diagnosis,
                prescription || null,
                notes || null,
                visit_date || null
            ]
        );

        return res.status(201).json({
            message: "Medical record created successfully",
            record: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating medical record:", error);
        return res.status(500).json({
            message: "Failed to create medical record",
            error: error.message
        });
    }
});

// =====================================================
// GET ALL RECORDS FOR A PATIENT
// GET /api/medical-records/patient/:patientId
// =====================================================
router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;

        const result = await pool.query(
            `SELECT 
                mr.*,
                p.name AS patient_name,
                p.age AS patient_age,
                p.gender AS patient_gender,
                p.blood_group
            FROM medical_records mr
            JOIN patients p ON mr.patient_id = p.id
            WHERE mr.patient_id = $1
            ORDER BY mr.visit_date DESC, mr.created_at DESC`,
            [patientId]
        );

        return res.json({
            patient_id: parseInt(patientId, 10),
            count: result.rows.length,
            records: result.rows
        });
    } catch (error) {
        console.error("Error fetching patient medical records:", error);
        return res.status(500).json({
            message: "Failed to fetch patient medical records",
            error: error.message
        });
    }
});

// =====================================================
// GET SINGLE MEDICAL RECORD
// GET /api/medical-records/:id
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                mr.*,
                p.name AS patient_name,
                p.age AS patient_age,
                p.gender AS patient_gender,
                p.blood_group,
                p.phone AS patient_phone
            FROM medical_records mr
            JOIN patients p ON mr.patient_id = p.id
            WHERE mr.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        return res.json({
            record: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching medical record:", error);
        return res.status(500).json({
            message: "Failed to fetch medical record",
            error: error.message
        });
    }
});

// =====================================================
// UPDATE MEDICAL RECORD
// PUT /api/medical-records/:id
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            doctor_name,
            diagnosis,
            prescription,
            notes,
            visit_date
        } = req.body;

        const checkRecord = await pool.query(
            "SELECT * FROM medical_records WHERE id = $1",
            [id]
        );

        if (checkRecord.rows.length === 0) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        const current = checkRecord.rows[0];

        const updatedResult = await pool.query(
            `UPDATE medical_records
            SET 
                doctor_name = COALESCE($1, doctor_name),
                diagnosis = COALESCE($2, diagnosis),
                prescription = COALESCE($3, prescription),
                notes = COALESCE($4, notes),
                visit_date = COALESCE($5, visit_date)
            WHERE id = $6
            RETURNING *`,
            [
                doctor_name || current.doctor_name,
                diagnosis || current.diagnosis,
                prescription !== undefined ? prescription : current.prescription,
                notes !== undefined ? notes : current.notes,
                visit_date || current.visit_date,
                id
            ]
        );

        return res.json({
            message: "Medical record updated successfully",
            record: updatedResult.rows[0]
        });
    } catch (error) {
        console.error("Error updating medical record:", error);
        return res.status(500).json({
            message: "Failed to update medical record",
            error: error.message
        });
    }
});

module.exports = router;
