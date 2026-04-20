/**
 * Role-based access control middleware.
 * @param  {...string} roles - allowed role names
 * @returns Express middleware that returns 403 if user role is not in the list
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

export default allowRoles;
