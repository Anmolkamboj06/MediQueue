const express = require("express");
const pool = require("../db");

const router = express.Router();

// Fallback initial doctors if table is initially empty
const DEFAULT_DOCTORS = [
    {
        name: "Dr. Sarah Johnson",
        department: "Cardiology",
        specialization: "Interventional Cardiology",
        email: "sarah.johnson@hospital.com",
        phone: "+1-555-0101",
        room_number: "Room 101",
        available_days: "Mon,Wed,Fri",
        is_available: true
    },
    {
        name: "Dr. Robert Smith",
        department: "Pediatrics",
        specialization: "General Pediatrics",
        email: "robert.smith@hospital.com",
        phone: "+1-555-0102",
        room_number: "Room 102",
        available_days: "Mon,Tue,Thu",
        is_available: true
    },
    {
        name: "Dr. Emily Davis",
        department: "Orthopedics",
        specialization: "Orthopedic Surgery",
        email: "emily.davis@hospital.com",
        phone: "+1-555-0103",
        room_number: "Room 103",
        available_days: "Tue,Wed,Fri",
        is_available: true
    },
    {
        name: "Dr. Michael Chen",
        department: "Neurology",
        specialization: "Clinical Neurology",
        email: "michael.chen@hospital.com",
        phone: "+1-555-0104",
        room_number: "Room 104",
        available_days: "Mon,Thu,Fri",
        is_available: true
    }
];

// Helper to check and auto-seed table if necessary
const ensureDoctorsTable = async () => {
    await pool.query(`
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
    `);
};

// =====================================================
// GET ALL DOCTORS
// GET /api/doctors
// =====================================================
router.get("/", async (req, res) => {
    try {
        await ensureDoctorsTable();
        const { department, search } = req.query;

        let query = "SELECT * FROM doctors WHERE 1=1";
        const queryParams = [];

        if (department) {
            queryParams.push(department);
            query += ` AND department = $${queryParams.length}`;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            query += ` AND (name ILIKE $${queryParams.length} OR specialization ILIKE $${queryParams.length})`;
        }

        query += " ORDER BY name ASC";

        let result = await pool.query(query, queryParams);

        // If no doctors exist yet in DB and no filters are provided, seed defaults
        if (result.rows.length === 0 && !department && !search) {
            for (const doc of DEFAULT_DOCTORS) {
                await pool.query(
                    `INSERT INTO doctors 
                    (name, department, specialization, email, phone, room_number, available_days, is_available)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        doc.name,
                        doc.department,
                        doc.specialization,
                        doc.email,
                        doc.phone,
                        doc.room_number,
                        doc.available_days,
                        doc.is_available
                    ]
                );
            }
            result = await pool.query("SELECT * FROM doctors ORDER BY name ASC");
        }

        return res.json({
            count: result.rows.length,
            doctors: result.rows
        });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        // Fallback response with DEFAULT_DOCTORS
        return res.json({
            count: DEFAULT_DOCTORS.length,
            doctors: DEFAULT_DOCTORS.map((d, index) => ({ id: index + 1, ...d }))
        });
    }
});

// =====================================================
// GET SINGLE DOCTOR
// GET /api/doctors/:id
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        await ensureDoctorsTable();
        const { id } = req.params;

        const result = await pool.query("SELECT * FROM doctors WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        return res.json({
            doctor: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching doctor:", error);
        return res.status(500).json({
            message: "Failed to fetch doctor",
            error: error.message
        });
    }
});

// =====================================================
// ADD DOCTOR
// POST /api/doctors
// =====================================================
router.post("/", async (req, res) => {
    try {
        await ensureDoctorsTable();
        const {
            name,
            department,
            specialization,
            email,
            phone,
            room_number,
            available_days,
            is_available = true
        } = req.body;

        if (!name || !department) {
            return res.status(400).json({
                message: "Doctor name and department are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO doctors
            (name, department, specialization, email, phone, room_number, available_days, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                name,
                department,
                specialization || null,
                email || null,
                phone || null,
                room_number || null,
                available_days || "Mon,Tue,Wed,Thu,Fri",
                is_available !== undefined ? is_available : true
            ]
        );

        return res.status(201).json({
            message: "Doctor added successfully",
            doctor: result.rows[0]
        });
    } catch (error) {
        console.error("Error adding doctor:", error);
        return res.status(500).json({
            message: "Failed to add doctor",
            error: error.message
        });
    }
});

// =====================================================
// UPDATE DOCTOR
// PUT /api/doctors/:id
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        await ensureDoctorsTable();
        const { id } = req.params;
        const {
            name,
            department,
            specialization,
            email,
            phone,
            room_number,
            available_days,
            is_available
        } = req.body;

        const checkResult = await pool.query("SELECT * FROM doctors WHERE id = $1", [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        const current = checkResult.rows[0];

        const updateResult = await pool.query(
            `UPDATE doctors
            SET 
                name = COALESCE($1, name),
                department = COALESCE($2, department),
                specialization = COALESCE($3, specialization),
                email = COALESCE($4, email),
                phone = COALESCE($5, phone),
                room_number = COALESCE($6, room_number),
                available_days = COALESCE($7, available_days),
                is_available = COALESCE($8, is_available)
            WHERE id = $9
            RETURNING *`,
            [
                name || current.name,
                department || current.department,
                specialization !== undefined ? specialization : current.specialization,
                email !== undefined ? email : current.email,
                phone !== undefined ? phone : current.phone,
                room_number !== undefined ? room_number : current.room_number,
                available_days !== undefined ? available_days : current.available_days,
                is_available !== undefined ? is_available : current.is_available,
                id
            ]
        );

        return res.json({
            message: "Doctor updated successfully",
            doctor: updateResult.rows[0]
        });
    } catch (error) {
        console.error("Error updating doctor:", error);
        return res.status(500).json({
            message: "Failed to update doctor",
            error: error.message
        });
    }
});

// =====================================================
// REMOVE DOCTOR
// DELETE /api/doctors/:id
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        await ensureDoctorsTable();
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM doctors WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        return res.json({
            message: "Doctor removed successfully",
            doctor: result.rows[0]
        });
    } catch (error) {
        console.error("Error deleting doctor:", error);
        return res.status(500).json({
            message: "Failed to remove doctor",
            error: error.message
        });
    }
});

module.exports = router;
