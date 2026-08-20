import { OAuth2Client } from "google-auth-library";
import express from "express";
import {
  generateUserCredentials,
  getNewProfilePicture,
} from "../../../../../controllers/user/userController";
import User, { IUserModel } from "../../../../../database/models/user/user";
import { flatYupInputValidator } from "../../../../../middlewares/inputValidator";
import { ipChecker } from "../../../../../middlewares/ipBlacklist";
import { userAuthAPIsRateLimiter } from "../../../../../middlewares/rateLimiter";
import config from "../../../../../settings/config";
import { googleLoginValidator } from "../../../../../validators/user/userValidator";

const router = express.Router();

// Google login / signup
// Body: { token, email, name, profilePicture }
// token is the Google Identity Services ID token (credential).
router.post(
  "/google/login",
  ipChecker(),
  userAuthAPIsRateLimiter,
  flatYupInputValidator(googleLoginValidator),
  async (req, res) => {
    const { token, email, name, profilePicture } = req.body;

    // verify the Google ID token
    const oAuth2Client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
    const ticket = await oAuth2Client.verifyIdToken({ idToken: token });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const googleId = payload.sub;
    const googleEmail = payload.email || email;
    const googleName = name || payload.name || googleEmail;

    const googleInfo = {
      googleId,
      googleEmail,
      googleName,
    };

    let userDoc = await User.findOne({ email });

    if (userDoc) {
      // existing user - link the google account
      userDoc.google = googleInfo;
      if (!userDoc.isEmailVerified) userDoc.isEmailVerified = true;
      if (!userDoc.name) userDoc.name = googleName;
      if (!userDoc.profilePicture) {
        userDoc.profilePicture =
          profilePicture || payload.picture || getNewProfilePicture(googleName);
      }
      userDoc = await userDoc.save();
    } else {
      // first time google sign in - create the user
      const userModel: IUserModel = {
        name: googleName,
        email: googleEmail,
        isEmailVerified: true,
        profilePicture:
          profilePicture ||
          payload.picture ||
          getNewProfilePicture(googleName),
        google: googleInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userDoc = await User.create(userModel);
    }

    return res.json(generateUserCredentials(userDoc));
  },
);

export default router;
