const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// REGISTER PATIENT
// POST /api/patients
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            name,
            age,
            gender,
            doctor,
            department,
            reason
        } = req.body;


        // Check required fields
        if (
            !name ||
            !age ||
            !doctor ||
            !department ||
            !reason
        ) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }


        // Insert patient
        const patientResult = await pool.query(
            `INSERT INTO patients
            (name, age, gender, doctor, department, reason)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                name,
                age,
                gender,
                doctor,
                department,
                reason
            ]
        );


        const patient = patientResult.rows[0];


        // Find next queue number
        const queueResult = await pool.query(
            `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_number
             FROM queue
             WHERE DATE(created_at) = CURRENT_DATE`
        );


        const queueNumber = queueResult.rows[0].next_number;


        // Add patient to queue
        const queueInsert = await pool.query(
            `INSERT INTO queue
            (patient_id, queue_number, status)
            VALUES ($1, $2, 'waiting')
            RETURNING *`,
            [
                patient.id,
                queueNumber
            ]
        );


        res.status(201).json({
            message: "Patient registered successfully",

            patient: patient,

            queue: queueInsert.rows[0]
        });


    } catch (error) {

        console.error("Patient registration error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// GET ALL PATIENTS
// GET /api/patients
// =====================================================

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT *
             FROM patients
             ORDER BY created_at DESC`
        );

        res.json({
            patients: result.rows
        });

    } catch (error) {

        console.error("Get patients error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// GET QUEUE
// GET /api/patients/queue
// =====================================================

router.get("/queue", async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT
                queue.id AS queue_id,
                queue.queue_number,
                queue.status,
                queue.created_at,
                queue.called_at,
                queue.completed_at,

                patients.id AS patient_id,
                patients.name,
                patients.age,
                patients.gender,
                patients.doctor,
                patients.department,
                patients.reason

             FROM queue

             JOIN patients
             ON queue.patient_id = patients.id

             WHERE DATE(queue.created_at) = CURRENT_DATE

             ORDER BY queue.queue_number ASC`
        );


        res.json({
            queue: result.rows
        });


    } catch (error) {

        console.error("Get queue error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// UPDATE QUEUE STATUS
// PATCH /api/patients/queue/:id
// =====================================================

router.patch("/queue/:id", async (req, res) => {

    try {

        const { status } = req.body;

        const allowedStatuses = [
            "waiting",
            "called",
            "completed"
        ];


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                message:
                    "Invalid status. Use waiting, called or completed"
            });
        }


        let query;
        let values;


        if (status === "called") {

            query = `
                UPDATE queue
                SET status = $1,
                    called_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            values = [status, req.params.id];

        }

        else if (status === "completed") {

            query = `
                UPDATE queue
                SET status = $1,
                    completed_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            values = [status, req.params.id];

        }

        else {

            query = `
                UPDATE queue
                SET status = $1
                WHERE id = $2
                RETURNING *
            `;

            values = [status, req.params.id];
        }


        const result = await pool.query(
            query,
            values
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Queue entry not found"
            });
        }


        res.json({
            message: "Queue status updated",
            queue: result.rows[0]
        });


    } catch (error) {

        console.error("Update queue error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// =====================================================
// GET MY QUEUE
// GET /api/patients/my-queue
// =====================================================

router.get("/my-queue", authMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const result = await pool.query(
            `SELECT
                queue.id AS queue_id,
                queue.queue_number,
                queue.status,
                queue.created_at,
                queue.called_at,
                queue.completed_at,

                patients.id AS patient_id,
                patients.name,
                patients.age,
                patients.gender,
                patients.doctor,
                patients.department,
                patients.reason

             FROM patients

             JOIN queue
             ON queue.patient_id = patients.id

             WHERE patients.user_id = $1
             AND DATE(queue.created_at) = CURRENT_DATE

             ORDER BY queue.queue_number ASC`,
            [userId]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "No queue entry found for this patient today"
            });

        }


        res.json({
            patient: result.rows[0]
        });


    } catch (error) {

        console.error("Get my queue error:", error);

        res.status(500).json({
            message: "Server error"
        });

    }

});

module.exports = router;