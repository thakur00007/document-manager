import { sequelize } from "../db/db.js";
import { Folder } from "../models/folder.model.js";
import ApiError from "../utility/ApiError.js";
import ApiResponse from "../utility/ApiResponse.js";
import requestHandler from "../utility/requestHandeller.js";

// Create Folder
const createFolder = requestHandler(async (req, res) => {
  const { name, parentId } = req.body?.data;
  const userId = req.user.id;

  // TODO : Validate folder name
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Folder name contains invalid characters"));
  }

  const existingFolder = await Folder.findOne({
    where: {
      name,
      parentId: parentId ?? null,
      userId,
    },
  });

  if (existingFolder) {
    throw new ApiError(
      400,
      "Folder with the same name already exists in this location"
    );
  }

  let path = "/";
  let depth = 0;

  if (parentId) {
    const parent = await Folder.findByPk(parentId);
    path = parent.path + name + "/";
    depth = parent.depth + 1;
  } else {
    path = `/${name}/`;
  }

  const folder = await Folder.create({
    name,
    parentId: parentId,
    path,
    depth,
    userId: userId,
  });

  res
    .status(201)
    .json(new ApiResponse(201, "Folder created successfully", { folder }));
});

// Rename Folder
const renameFolder = requestHandler(async (req, res) => {
  const { folderId, newName } = req.body?.data;
  const userId = req.user.id;

  if (!newName) {
    throw new ApiError(400, "New folder name is required");
  }

  if (
    newName.includes("..") ||
    newName.includes("/") ||
    newName.includes("\\")
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Folder name contains invalid characters"));
  }

  const folder = await Folder.findOne({
    where: { id: folderId, userId },
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  const duplicate = await Folder.findOne({
    where: {
      name: newName,
      parentId: folder.parentId ?? null,
      userId,
    },
  });

  if (duplicate) {
    throw new ApiError(
      400,
      "Folder with the same name already exists in this location"
    );
  }

  const oldPath = folder.path;

  const segments = oldPath.split("/").filter(Boolean);

  segments[folder.depth] = newName;

  const newPath = "/" + segments.join("/") + "/";

  const oldPrefix =
    "/" + segments.slice(0, folder.depth).concat(folder.name).join("/") + "/";

  const newPrefix =
    "/" + segments.slice(0, folder.depth).concat(newName).join("/") + "/";

  await sequelize.query(
    `
    UPDATE Folders
    SET path = CONCAT(?, SUBSTRING(path, ?))
    WHERE path LIKE CONCAT(?, '%')
      AND userId = ?
    `,
    {
      replacements: [newPrefix, oldPrefix.length + 1, oldPrefix, userId],
    }
  );

  await folder.update({
    name: newName,
    path: newPath,
  });

  return res.status(200).json(
    new ApiResponse(200, "Folder renamed successfully", {
      id: folder.id,
      oldPath,
      newPath,
      depth: folder.depth,
    })
  );
});

const deleteFolder = requestHandler(async (req, res) => {
  const { folderId } = req.body?.data;
  const userId = req.user.id;

  const folder = await Folder.findOne({
    where: { id: folderId, userId },
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  const folderPath = folder.path;

  await sequelize.query(
    `
    DELETE FROM Folders
    WHERE path LIKE CONCAT(?, '%')
      AND userId = ?
    `,
    {
      replacements: [folderPath, userId],
    }
  );

  return res.status(200).json(
    new ApiResponse(200, "Folder deleted successfully", {
      deletedPath: folderPath,
    })
  );
});

// get folder list for a user, by parentId
const getFolders = requestHandler(async (req, res) => {
  const userId = req.user.id;
  const { parentId } = req.query;

  const where = {
    userId,
    parentId: parentId ? Number(parentId) : null,
  };

  const folders = await Folder.findAll({
    where,
    attributes: ["id", "name", "parentId", "depth", "path"],
    order: [["name", "ASC"]],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Folders fetched successfully", { folders }));
});

// list folders by path name
const listByPath = requestHandler(async (req, res) => {
  const userId = req.user.id;
  let { path } = req.query;

  if (!path || path === "/" || path === "") {
    const folders = await Folder.findAll({
      where: {
        parentId: null,
        userId,
      },
      order: [["name", "ASC"]],
    });

    return res.json(
      new ApiResponse(200, "Root Folders fetched successfully", {
        currentFolder: null,
        children: folders,
        path: "/",
      })
    );
  }

  if (!path.startsWith("/")) path = `/${path}`;
  if (!path.endsWith("/")) path = `${path}/`;

  const folder = await Folder.findOne({
    where: {
      path,
      userId,
    },
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  const children = await Folder.findAll({
    where: {
      parentId: folder.id,
      userId,
    },
    order: [["name", "ASC"]],
  });

  return res.json(
    new ApiResponse(200, "Folders fetched successfully", {
      currentFolder: folder,
      children,
      path,
    })
  );
});

export { createFolder, renameFolder, deleteFolder, getFolders, listByPath };
