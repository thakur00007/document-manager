class ApiError extends Error {
  constructor(
    status,
    code,
    message = "Something went wrong",
    errors = [],
    stack = null
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.name = "ApiError";
    this.success = false;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
