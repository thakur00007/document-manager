import requestHandler from "../utility/requestHandeller.js";
import ApiError from "../utility/ApiError.js";
import ApiResponse from "../utility/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = requestHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body.user;

  // Validate user input
  if (!fullName || !username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }],
    },
  });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email or username");
  }

  // Create new user
  const newUser = await User.create({ fullName, username, email, password });
  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", { user: newUser }));
});

const loginUser = requestHandler(async (req, res) => {
  const { username, email, password } = req.body.user;

  // Validate user input
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const foundUser = await User.findOne({
    where: {
      [Op.or]: email ? { email } : { username },
    },
  });

  if (!foundUser) {
    throw new ApiError(404, "user not found with this email or username");
  }

  const isPasswordValid = await foundUser.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    foundUser.id
  );

  const loggedInUser = await User.findByPk(foundUser.id, {
    attributes: {
      exclude: ["password", "refreshToken", "createdAt", "updatedAt"],
    },
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(200, "Logged in successfully", {
        accessToken,
        refreshToken,
        user: loggedInUser,
      })
    );
});

const logoutUser = requestHandler(async (req, res) => {
  const { id } = req.user;

  // Invalidate refresh token
  const user = await User.findByPk(id);

  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, "User logged out successfully"));
});

const getUserProfile = requestHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "User profile fetched successfully", {
      user: req.user,
    })
  );
});

const refreshAccessToken = requestHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findByPk(decodedToken?.id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user.id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refreshToken)
      .json(
        new ApiResponse(200, "Access token refreshed", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  refreshAccessToken,
};
