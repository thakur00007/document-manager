import { sequelize } from "../db/db.js";
import { DataTypes } from "sequelize";

const Folder = sequelize.define(
  "Folder",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Folders",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    path: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      unique: "path_unique_constraint",
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "path_unique_constraint",
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    timestamps: true,
  }
);

export { Folder };
