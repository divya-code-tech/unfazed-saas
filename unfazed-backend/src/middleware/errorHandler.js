const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists",
    });
  }

  // Mongoose validation error

if (err.name === "ValidationError") {
  return res.status(400).json({
    success: false,
    message: err.message,
  });
}

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

export default errorHandler;