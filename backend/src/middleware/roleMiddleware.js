/**
 * Role-based access control middleware
 * Checks if authenticated user has one of the allowed roles
 * 
 * @param {string[]|string} allowedRoles - Single role or array of allowed roles
 */
const roleMiddleware = (allowedRoles) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const userRole = req.user.role || "receptionist";

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                message: "Access forbidden: insufficient permissions",
                requiredRoles: roles,
                currentRole: userRole
            });
        }

        next();
    };
};

module.exports = roleMiddleware;
