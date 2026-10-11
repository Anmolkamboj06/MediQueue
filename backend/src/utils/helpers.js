const crypto = require("crypto");

/**
 * Format date to YYYY-MM-DD or readable string
 * @param {Date|string} date 
 * @param {boolean} includeTime 
 * @returns {string}
 */
const formatDate = (date, includeTime = false) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());

    if (!includeTime) {
        return `${year}-${month}-${day}`;
    }

    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Generate secure random token
 * @param {number} length 
 * @returns {string}
 */
const generateToken = (length = 32) => {
    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
};

/**
 * Sanitize basic string input against malicious characters/trim
 * @param {string} str 
 * @returns {string}
 */
const sanitizeInput = (str) => {
    if (typeof str !== "string") return str;
    return str
        .trim()
        .replace(/<[^>]*>?/gm, ""); // strip HTML tags
};

/**
 * Calculate offset and limit for SQL pagination
 * @param {number|string} page 
 * @param {number|string} limit 
 * @returns {{ page: number, limit: number, offset: number }}
 */
const paginateQuery = (page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    return {
        page: pageNum,
        limit: limitNum,
        offset
    };
};

module.exports = {
    formatDate,
    generateToken,
    sanitizeInput,
    paginateQuery
};
