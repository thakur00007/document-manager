import multer from "multer";
import { User } from "../models/user.model.js";
import requestHandler from "../utility/requestHandeller.js";
import ApiResponse from "../utility/ApiResponse.js";
import fs from "fs";

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp/");
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit: 5MB
});

const validateFileUpload = requestHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { path, size } = req.file;

  const user = await User.findByPk(req.user.id);
  const MAX_STORAGE =
    parseInt(process.env.MAX_STORAGE_PER_USER_IN_BYTES) || 5242880; // Default 5MB

  if (user.storageUsed + size > MAX_STORAGE) {
    // Delete the uploaded temp file
    fs.unlinkSync(path);

    return res.status(400).json(new ApiResponse(400, "STORAGE_LIMIT_EXCEEDED"));
  }

  next();
});

export { upload, validateFileUpload };
