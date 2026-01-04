import { File } from "../models/file.model.js";
import { Folder } from "../models/folder.model.js";
import ApiError from "../utility/ApiError.js";
import ApiResponse from "../utility/ApiResponse.js";
import requestHandler from "../utility/requestHandeller.js";
import storageService from "../service/storage.service.js";
import { v4 as uuidv4 } from "uuid";

// Upload File
const uploadFile = requestHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const userId = req.user.id;
  let { path } = req.body;
  const { originalname, buffer, mimetype, size } = req.file;

  let folderId = null;

  if (path && path !== "/" && path !== "") {
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path = `${path}/`;

    const folder = await Folder.findOne({ where: { path, userId } });
    if (!folder) {
      throw new ApiError(404, "Destination folder not found");
    }
    folderId = folder.id;
  }

  const existingFile = await File.findOne({
    where: { name: originalname, folderId, userId },
  });
  if (existingFile) {
    throw new ApiError(409, "File with this name already exists");
  }

  const storageKey = `${userId}/${uuidv4()}-${originalname}`;

  await storageService.upload(buffer, storageKey, mimetype);

  const newFile = await File.create({
    name: originalname,
    type: mimetype,
    size: size,
    storageKey: storageKey,
    folderId: folderId,
    userId: userId,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, "File uploaded successfully", { file: newFile })
    );
});

// List Files
const listFilesByPath = requestHandler(async (req, res) => {
  const userId = req.user.id;
  let { path } = req.query;

  let folderId = null;

  // Resolve path to folderId
  if (path && path !== "/" && path !== "") {
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path = `${path}/`;

    const folder = await Folder.findOne({ where: { path, userId } });
    if (!folder) {
      // If folder is not found, return empty or 404. Here we assume 404.
      throw new ApiError(404, "Folder not found");
    }
    folderId = folder.id;
  }

  const files = await File.findAll({
    where: { folderId, userId },
    order: [["createdAt", "DESC"]],
  });

  const filesWithUrls = await Promise.all(
    files.map(async (file) => {
      const url = await storageService.getSignedUrl(file.storageKey);
      return { ...file.toJSON(), url };
    })
  );

  return res.status(200).json(
    new ApiResponse(200, "Files fetched successfully", {
      files: filesWithUrls,
    })
  );
});

// Delete File
const deleteFile = requestHandler(async (req, res) => {
  const { id } = req.body;
  const userId = req.user.id;

  const file = await File.findOne({ where: { id, userId } });
  if (!file) {
    throw new ApiError(404, "File not found");
  }

  await storageService.delete(file.storageKey);

  await file.destroy();

  return res
    .status(200)
    .json(new ApiResponse(200, "File deleted successfully"));
});

// Rename File
const renameFile = requestHandler(async (req, res) => {
  const { id, newName } = req.body;
  const userId = req.user.id;

  if (!newName) throw new ApiError(400, "New name is required");

  const file = await File.findOne({ where: { id, userId } });
  if (!file) throw new ApiError(404, "File not found");

  // Check for naming collision
  const duplicate = await File.findOne({
    where: {
      name: newName,
      folderId: file.folderId,
      userId,
    },
  });

  if (duplicate) {
    throw new ApiError(
      409,
      "A file with this name already exists in this folder"
    );
  }

  file.name = newName;
  await file.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "File renamed successfully", { file }));
});

// Download File
const downloadFile = requestHandler(async (req, res) => {
  const { id } = req.query;
  const userId = req.user.id;

  const file = await File.findOne({ where: { id, userId } });
  if (!file) {
    throw new ApiError(404, "File not found or access denied");
  }

  try {
    const fileStream = await storageService.getFileStream(file.storageKey);

    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    res.setHeader("Content-Type", file.type || "application/octet-stream");
    if (file.size) {
      res.setHeader("Content-Length", file.size);
    }

    fileStream.pipe(res);
  } catch (error) {
    console.error("Download Error:", error);
    throw new ApiError(500, "Failed to retrieve file stream");
  }
});

export { uploadFile, listFilesByPath, deleteFile, renameFile, downloadFile };
