import requestHandler from "../utility/requestHandeller.js";
import ApiError from "../utility/ApiError.js";
import ApiResponse from "../utility/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import { RESPONSE_MESSAGES } from "../constants/response.js";

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
      "TOKEN_GENERATION_FAILED",
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = requestHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body.user;

  // Validate user input
  if (!fullName || !username || !email || !password) {
    throw new ApiError(
      400,
      "ALL_FIELDS_REQUIRED",
      RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }],
    },
  });
  if (existingUser) {
    throw new ApiError(
      400,
      "EMAIL_ALREADY_EXISTS",
      RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS
    );
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
    throw new ApiError(
      400,
      "USERNAME_OR_EMAIL_REQUIRED",
      "Username or email is required"
    );
  }
  const foundUser = await User.findOne({
    where: {
      [Op.or]: email ? { email } : { username },
    },
  });

  if (!foundUser) {
    throw new ApiError(404, "USER_NOT_FOUND", RESPONSE_MESSAGES.USER_NOT_FOUND);
  }

  const isPasswordValid = await foundUser.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      RESPONSE_MESSAGES.INVALID_CREDENTIALS
    );
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
      user: {
        ...req.user?.dataValues,
        ...req.user.getStorageInfo(),
      },
    })
  );
});

const refreshAccessToken = requestHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(
      401,
      "UNAUTHORIZED_REQUEST",
      RESPONSE_MESSAGES.UNAUTHORIZED_REQUEST
    );
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findByPk(decodedToken?.id);

    if (!user) {
      throw new ApiError(
        401,
        "INVALID_REFRESH_TOKEN",
        RESPONSE_MESSAGES.INVALID_REFRESH_TOKEN
      );
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(
        401,
        "REFRESH_TOKEN_EXPIRED",
        RESPONSE_MESSAGES.REFRESH_TOKEN_EXPIRED
      );
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
    throw new ApiError(
      401,
      error?.code || "INVALID_REFRESH_TOKEN",
      error?.message || RESPONSE_MESSAGES.INVALID_REFRESH_TOKEN
    );
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  refreshAccessToken,
};
