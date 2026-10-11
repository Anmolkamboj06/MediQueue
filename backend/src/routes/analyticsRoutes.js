const express = require("express");
const pool = require("../db");

const router = express.Router();

// =====================================================
// DASHBOARD STATS
// GET /api/analytics/dashboard
// =====================================================
router.get("/dashboard", async (req, res) => {
    try {
        // Run aggregations concurrently
        const [
            patientsTodayResult,
            queueStatusResult,
            appointmentsTodayResult,
            totalDoctorsResult
        ] = await Promise.all([
            // Total patients registered today
            pool.query(
                `SELECT COUNT(*) AS total 
                 FROM patients 
                 WHERE created_at::date = CURRENT_DATE`
            ),

            // Queue breakdowns today
            pool.query(
                `SELECT 
                    COUNT(*) FILTER (WHERE status = 'waiting') AS waiting_count,
                    COUNT(*) FILTER (WHERE status = 'consulting') AS consulting_count,
                    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
                    COUNT(*) AS total_queue_today
                 FROM queue 
                 WHERE created_at::date = CURRENT_DATE`
            ),

            // Total appointments scheduled for today
            pool.query(
                `SELECT 
                    COUNT(*) AS total_appointments_today,
                    COUNT(*) FILTER (WHERE status = 'completed') AS completed_appointments_today
                 FROM appointments 
                 WHERE appointment_date = CURRENT_DATE`
            ).catch(() => ({ rows: [{ total_appointments_today: 0, completed_appointments_today: 0 }] })),

            // Total active doctors in the hospital
            pool.query(
                `SELECT COUNT(DISTINCT doctor) AS total_doctors_active 
                 FROM patients`
            )
        ]);

        // Attempt count from doctors table if available
        let totalDoctors = parseInt(totalDoctorsResult.rows[0]?.total_doctors_active || 0, 10);
        try {
            const docTableResult = await pool.query("SELECT COUNT(*) AS total FROM doctors WHERE is_available = TRUE");
            if (parseInt(docTableResult.rows[0]?.total, 10) > 0) {
                totalDoctors = parseInt(docTableResult.rows[0].total, 10);
            }
        } catch {
            // Doctors table might not be populated, use fallback count
        }

        const queueData = queueStatusResult.rows[0] || {};
        const appointmentsData = appointmentsTodayResult.rows[0] || {};

        return res.json({
            date: new Date().toISOString().split("T")[0],
            total_patients_today: parseInt(patientsTodayResult.rows[0]?.total || 0, 10),
            waiting: parseInt(queueData.waiting_count || 0, 10),
            consulting: parseInt(queueData.consulting_count || 0, 10),
            completed: parseInt(queueData.completed_count || 0, 10),
            total_in_queue_today: parseInt(queueData.total_queue_today || 0, 10),
            total_appointments: parseInt(appointmentsData.total_appointments_today || 0, 10),
            completed_appointments: parseInt(appointmentsData.completed_appointments_today || 0, 10),
            total_doctors: totalDoctors
        });
    } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        return res.status(500).json({
            message: "Failed to fetch dashboard statistics",
            error: error.message
        });
    }
});

// =====================================================
// WEEKLY PATIENT COUNT (Last 7 Days)
// GET /api/analytics/weekly
// =====================================================
router.get("/weekly", async (req, res) => {
    try {
        const query = `
            WITH last_7_days AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '6 days',
                    CURRENT_DATE,
                    INTERVAL '1 day'
                )::date AS day
            )
            SELECT 
                TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
                TO_CHAR(d.day, 'Dy') AS day_name,
                COUNT(p.id) AS patient_count
            FROM last_7_days d
            LEFT JOIN patients p ON p.created_at::date = d.day
            GROUP BY d.day
            ORDER BY d.day ASC;
        `;

        const result = await pool.query(query);

        return res.json({
            weekly_stats: result.rows.map((row) => ({
                date: row.date,
                day: row.day_name,
                count: parseInt(row.patient_count, 10)
            }))
        });
    } catch (error) {
        console.error("Error fetching weekly statistics:", error);
        return res.status(500).json({
            message: "Failed to fetch weekly statistics",
            error: error.message
        });
    }
});

// =====================================================
// PATIENT COUNT BY DEPARTMENT
// GET /api/analytics/department-stats
// =====================================================
router.get("/department-stats", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                department,
                COUNT(*) AS patient_count,
                COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS patients_today
            FROM patients
            WHERE department IS NOT NULL AND TRIM(department) != ''
            GROUP BY department
            ORDER BY patient_count DESC
        `);

        return res.json({
            count: result.rows.length,
            departments: result.rows.map((row) => ({
                department: row.department,
                patient_count: parseInt(row.patient_count, 10),
                patients_today: parseInt(row.patients_today, 10)
            }))
        });
    } catch (error) {
        console.error("Error fetching department statistics:", error);
        return res.status(500).json({
            message: "Failed to fetch department statistics",
            error: error.message
        });
    }
});

// =====================================================
// PATIENT COUNT BY DOCTOR
// GET /api/analytics/doctor-stats
// =====================================================
router.get("/doctor-stats", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                doctor,
                department,
                COUNT(*) AS patient_count,
                COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS patients_today
            FROM patients
            WHERE doctor IS NOT NULL AND TRIM(doctor) != ''
            GROUP BY doctor, department
            ORDER BY patient_count DESC
        `);

        return res.json({
            count: result.rows.length,
            doctors: result.rows.map((row) => ({
                doctor: row.doctor,
                department: row.department,
                patient_count: parseInt(row.patient_count, 10),
                patients_today: parseInt(row.patients_today, 10)
            }))
        });
    } catch (error) {
        console.error("Error fetching doctor statistics:", error);
        return res.status(500).json({
            message: "Failed to fetch doctor statistics",
            error: error.message
        });
    }
});

module.exports = router;
