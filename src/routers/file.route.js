import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  uploadFile,
  listFilesByPath,
  deleteFile,
  renameFile,
  downloadFile,
} from "../controllers/file.controller.js";
import { upload, validateFileUpload } from "../middlewares/file.middleware.js";

const fileRouter = express.Router();

fileRouter.use(authMiddleware);

// Routes
fileRouter
  .route("/upload")
  .post(upload.single("file"), validateFileUpload, uploadFile);
fileRouter.route("/list-by-path").get(listFilesByPath);
fileRouter.route("/delete").delete(deleteFile);
fileRouter.route("/rename").put(renameFile);
fileRouter.route("/download").get(downloadFile);

export default fileRouter;
