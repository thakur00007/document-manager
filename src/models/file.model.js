import { sequelize } from "../db/db.js";
import { DataTypes } from "sequelize";

const File = sequelize.define(
  "File",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING, // Mime type (e.g., image/png)
      allowNull: true,
    },
    size: {
      type: DataTypes.INTEGER, // Size in bytes
      allowNull: false,
      defaultValue: 0,
    },
    storageKey: {
      type: DataTypes.STRING, // Unique key in S3/MinIO
      allowNull: false,
    },
    folderId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Null means root directory
      references: {
        model: "Folders",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "folderId", "userId"],
      },
    ],
  }
);

export { File };
