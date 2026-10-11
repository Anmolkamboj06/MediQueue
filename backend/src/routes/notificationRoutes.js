const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET NOTIFICATIONS FOR LOGGED-IN USER
// GET /api/notifications
// =====================================================
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC`,
            [userId]
        );

        const unreadCount = result.rows.filter((n) => !n.is_read).length;

        return res.json({
            unread_count: unreadCount,
            total_count: result.rows.length,
            notifications: result.rows
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
});

// =====================================================
// CREATE NOTIFICATION
// POST /api/notifications
// =====================================================
router.post("/", async (req, res) => {
    try {
        const {
            user_id,
            title,
            message,
            type = "info"
        } = req.body;

        if (!user_id || !title || !message) {
            return res.status(400).json({
                message: "user_id, title, and message are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [user_id, title, message, type]
        );

        return res.status(201).json({
            message: "Notification created successfully",
            notification: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        return res.status(500).json({
            message: "Failed to create notification",
            error: error.message
        });
    }
});

// =====================================================
// MARK ALL AS READ FOR LOGGED-IN USER
// PATCH /api/notifications/read-all
// =====================================================
router.patch("/read-all", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = $1 AND is_read = FALSE
            RETURNING *`,
            [userId]
        );

        return res.json({
            message: "All notifications marked as read",
            updated_count: result.rows.length
        });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({
            message: "Failed to mark notifications as read",
            error: error.message
        });
    }
});

// =====================================================
// MARK SINGLE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// =====================================================
router.patch("/:id/read", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE notifications
            SET is_read = TRUE
            WHERE id = $1
            RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.json({
            message: "Notification marked as read",
            notification: result.rows[0]
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({
            message: "Failed to mark notification as read",
            error: error.message
        });
    }
});

// =====================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM notifications WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.json({
            message: "Notification deleted successfully",
            deleted_notification: result.rows[0]
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({
            message: "Failed to delete notification",
            error: error.message
        });
    }
});

module.exports = router;
