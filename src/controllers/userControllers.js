import bcrypt from "bcrypt";
import UserModel from "../models/UserModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existedUser = await UserModel.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Create a new user in the database
  const user = await UserModel.create({
    username,
    email,
    password,
  });

  // Remove sensitive information from the response
  const createdUser = await UserModel.findById(user._id).select(
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
