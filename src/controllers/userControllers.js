import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/UserModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { loginSchema } from "../middleware/validation.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// generate access and refresh token
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh token"
    );
  }
};

// create new user account or signup and register
export const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Create a new user in the database
  const user = await User.create({
    username,
    email,
    password,
  });

  // Remove sensitive information from the response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Check if the user was created successfully
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //Joi validation
  const { error } = loginSchema.validate({
    email,
    password,
  });

  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  //username or email
  if (!(email || email)) {
    throw new ApiError(400, "username or email is required");
  }

  //find the user
  const user = await User.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //password check
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  //access and refresh token

  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  //send cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

// refresh token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECTET
    );

    const user = await User.findById(decodedToken?._id);
    // console.log("User", user);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    // console.log("refreshToken");

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// logout
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out Successfully"));
});

// user details
export const getUserDetails = asyncHandler(async (req, res) => {
  const user = req.user; // User is already attached by the middleware
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched successfully"));
});
