const requestHandler = (handellerFunction) => {
  return (req, res, next) => {
    Promise.resolve(handellerFunction(req, res, next)).catch((error) => {
      res
        .status(error.status || 500)
        .json({ ...error, message: error.message || "Internal Server Error" });
    });
  };
};

export default requestHandler;
