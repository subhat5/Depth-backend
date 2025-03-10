import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { CloudnaryImgDlt } from "../utils/CloudnaryImageDelete.js";
import mongoose from "mongoose";
const generateAccessAndRefreshToken = async (userId) => {
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
      "something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log(req.files);
  //get userDetails from frontend
  //validation -not empty
  //check if user already exists: useranme, eamil
  //check for images, check for avatar
  //upload them to cloudnary, avatar
  //create user object -craete entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return response

  const { fullName, email, username, password } = req.body;
  // console.log("data is" + JSON.stringify(req.body));
  if (!username) {
    return res.status(400).json({ message: "Username is missing or null" });
  }
  // if (!username) {
  //   throw new ApiError(500, "Username cannot be null or empty");
  // }

  if (
    [fullName, email, username, password].some((filed) => filed?.trim() === "")
  ) {
    throw new ApiError(400, "all fileds are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!existedUser) {
    throw new ApiError(409, "user with email or username already exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath);
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file path is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("after cloudnary upload" + avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  console.log("after cloudnaey cover" + coverImage);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username,
    password,
  });
  console.log(user);
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while regidtering user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered success fully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body ->data
  // username or email
  //find the user
  //password check
  //access and refresh token
  //send cookiev
  //res
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username and email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(400, "user doesn't exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "invalid password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true, //by these feature's accesstoken and refreshtoken will be secure client can't modify these token
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
        "user loggedin successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log("logout info");
  console.log(req.user);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: "" },
    },
    {
      new: true,
    }
  );
  console.log(user);
  const options = {
    httpOnly: true,
    secure: true, //by these feature's accesstoken and refreshtoken will be secure so that client can't modify these token
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User successfully loggedout"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookie?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "invalid access ");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) {
      throw new ApiError(401, "invalid access");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "invalid refreshtoken");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "refreshtoken doesn't match");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
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
          { accessToken, refreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refreshToken");
  }
});

const currentPasswordChanger = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(401, "not getting password");
  }
  const verifyOldPassword = isPasswordCorrect(oldPassword);
  if (!verifyOldPassword) {
    throw new ApiError(401, "invalid old password");
  }
  const user = await User.findById(user.req._id);
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user got successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, fullName } = req.body;
  if (!username || !fullName) {
    throw new ApiError(401, "not getting username & fullname");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        fullName,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details successfully update"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(401, "avatar file is misssing");
  }
  const userOnCloudnary = await User.findById(req.user?._id);
  if (!userOnCloudnary.avatar) {
    throw new ApiError(401, "avtar doesn't exist ");
  }
  if (userOnCloudnary?.avatar) {
    try {
      const deleteResponse = await CloudnaryImgDlt(userOnCloudnary.avatar);

      if (deleteResponse.result === "ok") {
        console.log("Image deleted successfully.");
      } else {
        console.log("Image not found or already deleted.");
      }
    } catch (error) {
      console.error("Error deleting Cloudinary image:", error);
    }
  } else {
    console.log("No avatar found for this user.");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "update avatar successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImagePath = req.file?.path;
  if (!coverImagePath) {
    throw new ApiError(401, "not getting coverimage path");
  }

  const coverImage = await uploadOnCloudinary(coverImagePath);
  if (!coverImage) {
    throw new ApiError(400, "Error while uploading on coverimage");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "update cover image successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribes: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        email: 1,
      },
    },
  ]);
  console.log(channel);
  if (!channel?.length) {
    throw new ApiError(404, "channel doen's exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fethed successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  currentPasswordChanger,
  getWatchHistory,
};
