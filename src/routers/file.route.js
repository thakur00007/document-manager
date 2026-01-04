import express from "express";
import multer from "multer";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  uploadFile,
  listFilesByPath,
  deleteFile,
  renameFile,
  downloadFile,
} from "../controllers/file.controller.js";

const fileRouter = express.Router();

// Configure Multer to use Memory Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit: 50MB
});

fileRouter.use(authMiddleware);

// Routes
fileRouter.route("/upload").post(upload.single("file"), uploadFile);
fileRouter.route("/list-by-path").get(listFilesByPath);
fileRouter.route("/delete").delete(deleteFile);
fileRouter.route("/rename").put(renameFile);
fileRouter.route("/download").get(downloadFile);

export default fileRouter;
