class ApiResponse {
  constructor(statusCode, data, messege = "success") {
    this.statusCode = statusCode;
    this.data = data;
    this.messege = messege;
    this.success = statusCode < 400;
  }
}
