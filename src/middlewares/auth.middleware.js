import jwt from "jsonwebtoken";
import requestHandler from "../utility/requestHandeller.js";
import { User } from "../models/user.model.js";
import ApiError from "../utility/ApiError.js";
import { RESPONSE_MESSAGES } from "../constants/response.js";

const authMiddleware = requestHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      throw new ApiError(
        401,
        "UNAUTHORIZED_REQUEST",
        RESPONSE_MESSAGES.UNAUTHORIZED_REQUEST
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new ApiError(
          401,
          "ACCESS_TOKEN_EXPIRED",
          RESPONSE_MESSAGES.ACCESS_TOKEN_EXPIRED
        );
      }
      throw new ApiError(
        401,
        "INVALID_ACCESS_TOKEN",
        RESPONSE_MESSAGES.INVALID_ACCESS_TOKEN
      );
    }

    if (!decoded || !decoded.id) {
      throw new ApiError(
        401,
        "UNAUTHORIZED_REQUEST",
        RESPONSE_MESSAGES.UNAUTHORIZED_REQUEST
      );
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password", "refreshToken"] },
    });
    if (!user) {
      throw new ApiError(
        404,
        "USER_NOT_FOUND",
        RESPONSE_MESSAGES.USER_NOT_FOUND
      );
    }

    req.user = user;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      401,
      "UNAUTHORIZED_REQUEST",
      RESPONSE_MESSAGES.UNAUTHORIZED_REQUEST
    );
  }
});

export default authMiddleware;
