// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    const errorTypes = {
        ValidationError: 400,
        AuthenticationError: 401,
        ForbiddenError: 403,
        NotFoundError: 404
    };

    const statusCode = errorTypes[err.name] || 500;
    
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
