import { sequelize } from "../db/db.js";
import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const User = sequelize.define(
  "User",
  {
    // for distributed database
    // id: {
    //     type: DataTypes.UUID,
    //     defaultValue: DataTypes.UUIDV4,
    //     primaryKey: true,
    //     autoIncrement: true,
    // },

    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    storageUsed: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["username"],
        name: "unique_username_constraint", // Explicit name prevents duplicates
      },
      {
        unique: true,
        fields: ["email"],
        name: "unique_email_constraint", // Explicit name prevents duplicates
      },
    ],
  }
);

// Hash the password before saving the user
User.beforeCreate(async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.prototype.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token / short-lived token
User.prototype.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this.id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    }
  );
};

// Generate Refresh Token / long-lived token
User.prototype.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    }
  );
};

// TODO: get safe user data without password and refresh token

// get storage used and max storage from env variable
User.prototype.getStorageInfo = function () {
  const maxStorage =
    parseInt(process.env.MAX_STORAGE_PER_USER_IN_BYTES) || 5242880; // Default 5MB
  return {
    storageUsed: this.storageUsed,
    maxStorage: maxStorage,
    left: maxStorage - this.storageUsed,
  };
};

export { User };
