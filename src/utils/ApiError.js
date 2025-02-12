class ApiError extends Error {
  constructor(
    statusCode,
    messege = "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(messege);
    this.statusCode = statusCode;
    this.data = null;
    this.messege = messege;
    this.success = false;
    this.errors = errors;
    this.stack = stack;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError}