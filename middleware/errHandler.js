// const errorHandler = (err, req, res, next) => {
//     console.error('Error:', err);

//     // Default error object
//     let error = {
//         success: false,
//         message: 'Internal Server Error',
//         statusCode: 500
//     };

//     // Handle specific error types
//     if (err.name === 'ValidationError') {
//         error.message = err.message;
//         error.statusCode = 400;
//     } else if (err.code === 'ER_DUP_ENTRY') {
//         error.message = 'Duplicate entry found';
//         error.statusCode = 409;
//     }

//     res.status(error.statusCode).json({
//         success: false,
//         message: error.message
//     });
// };

// module.exports = errorHandler;
