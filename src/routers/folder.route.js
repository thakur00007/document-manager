import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createFolder,
  deleteFolder,
  getFolders,
  listByPath,
  renameFolder,
} from "../controllers/folder.controller.js";

const folderRouter = express.Router();

folderRouter.route("/create").post(authMiddleware, createFolder);
folderRouter.route("/rename").patch(authMiddleware, renameFolder);
folderRouter.route("/delete").delete(authMiddleware, deleteFolder);
folderRouter.route("/get").get(authMiddleware, getFolders);
folderRouter.route("/list-by-path").get(authMiddleware, listByPath);

export default folderRouter;
