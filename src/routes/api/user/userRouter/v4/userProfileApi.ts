import bcrypt from "bcryptjs";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import z from "zod";

import User from "../../../../../database/models/user/user";
import {
  authenticator,
  IUserTokenData,
} from "../../../../../middlewares/authenticator";
import {
  flatYupInputValidator,
  flatZodInputValidator,
} from "../../../../../middlewares/inputValidator";
import config from "../../../../../settings/config";
import {
  checkImageFileSize,
  customResizeAndUploadImage,
  deleteObjectsFromStorage,
} from "../../../../../util/mediaLibraryUtils/imageUtils";
import { changePasswordValidator } from "../../../../../validators/user/profileValidator";
import { userNameValidator } from "../../../../../validators/user/userValidator";

const router = express.Router();

const PROFILE_PICTURE_WIDTH = 500;

// update name
// tested - new
router.put(
  "/name",
  authenticator(["user"]),
  flatYupInputValidator(userNameValidator),
  async (req, res) => {
    const { name } = req.body;
    const userDoc = await User.findOneAndUpdate(
      { _id: req.user?._id },
      {
        $set: {
          name,
        },
      },
      { new: true, omitUndefined: true },
    ).select({ password: 0, "facebook.accessToken": 0 });

    return res.json(userDoc);
  },
);

// get user object
// tested postman
router.get("/", authenticator(["user"]), async (req, res) => {
  const userDoc = await User.findOne({ _id: req.user?._id }).select({
    password: 0,
    "facebook.accessToken": 0,
  });
  return res.json(userDoc);
});

// delete user
// tested postman
router.delete("/", authenticator(["user"]), async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // delete user
  await User.findByIdAndDelete(user._id);

  return res.json({ message: "User deleted successfully" });
});

// refresh token
// tested postman
router.post("/token/refresh", async (req, res) => {
  const data = req.body;
  const tokenData = data.token;

  if (!tokenData) {
    return res.status(401).send();
  }
  const tokenString = tokenData.split(" ")[1];

  try {
    const decodedUser = jwt.verify(
      tokenString,
      config.CLIENT_SECRET,
    ) as IUserTokenData;
    if (typeof decodedUser === "object") {
      const tokenUser: IUserTokenData = {
        userId: decodedUser.userId,
        email: decodedUser.email,
        name: decodedUser.name,
        phoneNumber: decodedUser.phoneNumber,
        type: "user",
      };

      const newAccessToken = jwt.sign(tokenUser, config.CLIENT_SECRET, {
        expiresIn: config.CLIENT_ACCESS_TOKEN_EXPIRATION_TIME_SECOND,
      });
      const newRefreshToken = jwt.sign(tokenUser, config.CLIENT_SECRET, {
        expiresIn: config.CLIENT_REFRESH_TOKEN_EXPIRATION_TIME_SECOND,
      });

      return res.json({
        accessToken: "JWT " + newAccessToken,
        refreshToken: "JWT " + newRefreshToken,
        message: "success",
      });
    } else {
      return res.status(401).send();
    }
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized request" });
  }
});

// update profile picture
const upload = multer();
router.put(
  "/profilePicture",
  authenticator(["user"]),
  upload.single("image"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    // Check if file size is within the range
    const isValidImageSize = checkImageFileSize(req.file, 5); // 5 MB

    if (!isValidImageSize) {
      return res.status(400).json({
        message: "Maximum image size is 5 MB",
      });
    }

    const buffer = req.file?.buffer;
    const folderName = `users/${req.user?._id.toString()}`;
    const title = "profile_picture";

    const profileImg = await customResizeAndUploadImage(
      title,
      folderName,
      true,
      buffer,
      PROFILE_PICTURE_WIDTH,
      undefined,
      "inside",
    );

    if (!profileImg) {
      return res.status(400).json({ message: "Profile picture update failed" });
    }

    if (req.user?.profilePicture) {
      deleteObjectsFromStorage([req.user.profilePicture]).catch();
    }

    const userDoc = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          profilePicture: profileImg,
        },
      },
      { new: true },
    );
    return res.status(200).json(userDoc);
  },
);

// check if the user can be deleted or not
router.get("/delete/check", authenticator(["user"]), async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  return res.json({
    canDelete: true,
    message: "Profile can be deleted.",
  });
});

type TChangePasswordRequestBody = z.infer<typeof changePasswordValidator>;

// change password
router.put(
  "/changePassword",
  authenticator(["user"]),
  flatZodInputValidator(changePasswordValidator),
  async (req: Request<any, any, TChangePasswordRequestBody>, res: Response) => {
    const data = req.body;
    const userId = req.user?._id;

    const userDoc = await User.findOne({ _id: userId });

    if (!userDoc) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check Password
    if (userDoc.password) {
      const isMatch = await bcrypt.compare(data.oldPassword, userDoc.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current Password not correct" });
      }

      // reusing the same password
      const isSamePassword = await bcrypt.compare(
        data.newPassword,
        userDoc.password,
      );
      if (isSamePassword) {
        return res.status(400).json({
          message: "New password must be different from current password",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.newPassword, salt);

    await User.findOneAndUpdate({ _id: userId }, { password: passwordHash });

    return res.json({ message: "Password changed successfully" });
  },
);

export default router;
