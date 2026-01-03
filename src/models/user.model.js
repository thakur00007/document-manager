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
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
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

export { User };
