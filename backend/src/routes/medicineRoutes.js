const express = require("express");
const pool = require("../db");

const router = express.Router();

// =====================================================
// GET ALL MEDICINES (with optional search)
// GET /api/medicines?search=paracetamol
// =====================================================
router.get("/", async (req, res) => {
    try {
        const { search, category } = req.query;

        let query = "SELECT * FROM medicines WHERE 1=1";
        const queryParams = [];

        if (search) {
            queryParams.push(`%${search}%`);
            query += ` AND (name ILIKE $${queryParams.length} OR description ILIKE $${queryParams.length})`;
        }

        if (category) {
            queryParams.push(category);
            query += ` AND category = $${queryParams.length}`;
        }

        query += " ORDER BY name ASC";

        const result = await pool.query(query, queryParams);

        return res.json({
            count: result.rows.length,
            medicines: result.rows
        });
    } catch (error) {
        console.error("Error fetching medicines:", error);
        return res.status(500).json({
            message: "Failed to fetch medicines",
            error: error.message
        });
    }
});

// =====================================================
// PRESCRIBE MEDICINE TO PATIENT
// POST /api/medicines/prescribe
// =====================================================
router.post("/prescribe", async (req, res) => {
    try {
        const {
            patient_id,
            medicine_id,
            prescribed_by,
            dosage_instructions,
            start_date,
            end_date,
            status = "active"
        } = req.body;

        if (!patient_id || !medicine_id || !dosage_instructions) {
            return res.status(400).json({
                message: "patient_id, medicine_id, and dosage_instructions are required"
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

        // Verify medicine exists
        const medicineCheck = await pool.query(
            "SELECT id, name FROM medicines WHERE id = $1",
            [medicine_id]
        );
        if (medicineCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        const result = await pool.query(
            `INSERT INTO patient_medicines
            (patient_id, medicine_id, prescribed_by, dosage_instructions, start_date, end_date, status)
            VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7)
            RETURNING *`,
            [
                patient_id,
                medicine_id,
                prescribed_by || null,
                dosage_instructions,
                start_date || null,
                end_date || null,
                status
            ]
        );

        return res.status(201).json({
            message: "Medicine prescribed successfully",
            prescription: {
                ...result.rows[0],
                patient_name: patientCheck.rows[0].name,
                medicine_name: medicineCheck.rows[0].name
            }
        });
    } catch (error) {
        console.error("Error prescribing medicine:", error);
        return res.status(500).json({
            message: "Failed to prescribe medicine",
            error: error.message
        });
    }
});

// =====================================================
// GET MEDICINES PRESCRIBED TO A PATIENT
// GET /api/medicines/patient/:patientId
// =====================================================
router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;

        const result = await pool.query(
            `SELECT 
                pm.*,
                m.name AS medicine_name,
                m.category AS medicine_category,
                m.dosage AS default_dosage,
                m.side_effects
            FROM patient_medicines pm
            JOIN medicines m ON pm.medicine_id = m.id
            WHERE pm.patient_id = $1
            ORDER BY pm.created_at DESC`,
            [patientId]
        );

        return res.json({
            patient_id: parseInt(patientId, 10),
            count: result.rows.length,
            prescriptions: result.rows
        });
    } catch (error) {
        console.error("Error fetching patient medicines:", error);
        return res.status(500).json({
            message: "Failed to fetch patient medicines",
            error: error.message
        });
    }
});

// =====================================================
// ADD NEW MEDICINE
// POST /api/medicines
// =====================================================
router.post("/", async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            dosage,
            side_effects
        } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Medicine name is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO medicines
            (name, category, description, dosage, side_effects)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                name,
                category || null,
                description || null,
                dosage || null,
                side_effects || null
            ]
        );

        return res.status(201).json({
            message: "Medicine added successfully",
            medicine: result.rows[0]
        });
    } catch (error) {
        console.error("Error adding medicine:", error);
        return res.status(500).json({
            message: "Failed to add medicine",
            error: error.message
        });
    }
});

// =====================================================
// GET SINGLE MEDICINE
// GET /api/medicines/:id
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT * FROM medicines WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        return res.json({
            medicine: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching medicine:", error);
        return res.status(500).json({
            message: "Failed to fetch medicine",
            error: error.message
        });
    }
});

// =====================================================
// UPDATE MEDICINE
// PUT /api/medicines/:id
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            category,
            description,
            dosage,
            side_effects
        } = req.body;

        const checkResult = await pool.query(
            "SELECT * FROM medicines WHERE id = $1",
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        const current = checkResult.rows[0];

        const updateResult = await pool.query(
            `UPDATE medicines
            SET 
                name = COALESCE($1, name),
                category = COALESCE($2, category),
                description = COALESCE($3, description),
                dosage = COALESCE($4, dosage),
                side_effects = COALESCE($5, side_effects)
            WHERE id = $6
            RETURNING *`,
            [
                name || current.name,
                category !== undefined ? category : current.category,
                description !== undefined ? description : current.description,
                dosage !== undefined ? dosage : current.dosage,
                side_effects !== undefined ? side_effects : current.side_effects,
                id
            ]
        );

        return res.json({
            message: "Medicine updated successfully",
            medicine: updateResult.rows[0]
        });
    } catch (error) {
        console.error("Error updating medicine:", error);
        return res.status(500).json({
            message: "Failed to update medicine",
            error: error.message
        });
    }
});

module.exports = router;
