/**
 * In-memory IP rate limiter middleware
 * Limits requests per IP address within a rolling or fixed time window
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // 100 requests per window

const ipRequestMap = new Map();

// Periodic cleanup of stale IP records every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestMap.entries()) {
        if (now - record.startTime > WINDOW_MS) {
            ipRequestMap.delete(ip);
        }
    }
}, 5 * 60 * 1000).unref();

const rateLimiter = (req, res, next) => {
    // Determine client IP
    const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        "unknown";

    const now = Date.now();
    const clientRecord = ipRequestMap.get(clientIp);

    if (!clientRecord) {
        ipRequestMap.set(clientIp, {
            count: 1,
            startTime: now
        });
        res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
        res.setHeader("X-RateLimit-Remaining", MAX_REQUESTS - 1);
        return next();
    }

    // Check if the current window has expired
    if (now - clientRecord.startTime > WINDOW_MS) {
        clientRecord.count = 1;
        clientRecord.startTime = now;
        res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
        res.setHeader("X-RateLimit-Remaining", MAX_REQUESTS - 1);
        return next();
    }

    clientRecord.count += 1;

    const remaining = Math.max(0, MAX_REQUESTS - clientRecord.count);
    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil((clientRecord.startTime + WINDOW_MS) / 1000)
    );

    if (clientRecord.count > MAX_REQUESTS) {
        const retryAfterSeconds = Math.ceil(
            (clientRecord.startTime + WINDOW_MS - now) / 1000
        );
        res.setHeader("Retry-After", retryAfterSeconds);
        return res.status(429).json({
            message: "Too many requests. Please try again later.",
            retryAfter: `${retryAfterSeconds} seconds`
        });
    }

    next();
};

module.exports = rateLimiter;
