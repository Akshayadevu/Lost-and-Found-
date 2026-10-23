function notFound(request, response) {
  response.status(404).json({ success: false, message: 'Route not found.' });
}

function errorHandler(error, request, response, next) {
  console.error(error);
  const statusCode = error.statusCode || 500;
  response.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Something went wrong on the server.' : error.message,
  });
}

module.exports = { notFound, errorHandler };
