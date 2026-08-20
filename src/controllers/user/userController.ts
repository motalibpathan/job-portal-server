import { CompleteMultipartUploadCommandOutput, S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import axios from "axios";
import jwt from "jsonwebtoken";
import { OTP_TYPES } from "../../constants/smsEnums";
import Otp from "../../database/models/otp/otp";
import { IUserDocument } from "../../database/models/user/user";
import { IUserTokenData } from "../../middlewares/authenticator";
import {
  sendLoginVerificationOTPEmail,
  sendResetVerificationOTPEmail,
  sendSignupVerificationOTPEmail,
  sendUpdateVerificationOTPEmail,
} from "../../services/emailer/systemEmails/verificationEmails";
import config from "../../settings/config";
import logger from "../../util/winston";
import { generateNewOTP } from "../otp/otpController";

type TOTPSendStatus = "sent" | "exists" | "failed";

export function generateUserTokenData(userDoc: IUserDocument) {
  const userInfoData: IUserTokenData = {
    userId: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    phoneNumber: userDoc.phoneNumber,
    type: "user",
  };

  return userInfoData;
}

export function generateUserCredentials(userDoc: IUserDocument) {
  // create token
  const userTokenData: IUserTokenData = generateUserTokenData(userDoc);

  const accessToken = jwt.sign(userTokenData, config.CLIENT_SECRET, {
    expiresIn: config.CLIENT_ACCESS_TOKEN_EXPIRATION_TIME_SECOND,
  });
  const refreshToken = jwt.sign(userTokenData, config.CLIENT_SECRET, {
    expiresIn: config.CLIENT_REFRESH_TOKEN_EXPIRATION_TIME_SECOND,
  });

  const userDocSafe: any = userDoc.toJSON();
  // delete sensitive info
  delete userDocSafe.password;
  if (userDocSafe.facebook) {
    delete userDocSafe.facebook.accessToken;
  }

  return {
    accessToken: "JWT " + accessToken,
    refreshToken: "JWT " + refreshToken,
    user: userDocSafe,
  };
}

export function getNewProfilePicture(userInfo?: string) {
  return `https://ui-avatars.com/api/?name=${userInfo || ""}&size=128`;
}

export async function updateUserProfilePicture(
  userDoc: IUserDocument,
  profilePictureUrl?: string,
): Promise<IUserDocument> {
  if (!userDoc.profilePicture || !userDoc.profilePicture.includes("job-portal")) {
    // we don't have profile picture
    if (profilePictureUrl) {
      // user has sent a profile picture
      try {
        const imageResponse = await axios.get(profilePictureUrl, {
          responseType: "arraybuffer",
        });
        const imageBuffer = Buffer.from(imageResponse.data, "utf-8");
        const originalKey = `users/${userDoc._id}/profile_picture.jpeg`;

        const s3Client = new S3({
          credentials: {
            accessKeyId: config.AWS_ACCESS_KEY,
            secretAccessKey: config.AWS_ACCESS_KEY_SECRET,
          },
        });

        const s3Response = (await new Upload({
          client: s3Client,
          params: {
            Bucket: config.S3_BUCKET,
            Key: originalKey,
            Body: imageBuffer,
            ACL: "public-read",
            ContentType: "image/jpeg",
          },
        }).done()) as CompleteMultipartUploadCommandOutput;

        userDoc.profilePicture = s3Response.Location;
        userDoc = await userDoc.save();
      } catch (err) {
        logger.error("profile picture saving error: google");
      }
    } else {
      userDoc.profilePicture = getNewProfilePicture(
        userDoc.name || userDoc.email || userDoc.phoneNumber,
      );
      userDoc = await userDoc.save();
    }
  }

  return userDoc;
}

// Signup OTP email
export async function generateAndSendSignupOtpEmail(
  email: string,
): Promise<TOTPSendStatus> {
  try {
    const newOtp = generateNewOTP(4);
    const newOtpDoc = await Otp.create({
      type: OTP_TYPES.USER_SIGNUP,
      identifier: email,
      otp: newOtp.toString(),
    });

    const status = await sendSignupVerificationOTPEmail(email, newOtpDoc.otp);
    if (status) return "sent";
    else return "failed";
  } catch {
    return "failed";
  }
}

// Login email
export async function generateAndSendLoginOtpEmail(
  email: string,
): Promise<TOTPSendStatus> {
  try {
    const newOtp = generateNewOTP(4);

    const status = await sendLoginVerificationOTPEmail(
      email,
      newOtp.toString(),
    );
    if (status) {
      // Create OTP document only if email was sent successfully
      await Otp.create({
        type: OTP_TYPES.USER_LOGIN,
        identifier: email,
        otp: newOtp.toString(),
      });

      return "sent";
    } else return "failed";
  } catch {
    return "failed";
  }
}

export async function generateAndSendResetOtpEmail(
  email: string,
): Promise<TOTPSendStatus> {
  try {
    const newOtp = generateNewOTP(4);

    const status = await sendResetVerificationOTPEmail(
      email,
      newOtp.toString(),
    );
    if (status) {
      // Create OTP document only if email was sent successfully
      await Otp.create({
        type: OTP_TYPES.USER_RESET,
        identifier: email,
        otp: newOtp.toString(),
      });
      return "sent";
    } else return "failed";
  } catch {
    return "failed";
  }
}

export async function generateAndSendUpdateOtpEmail(
  email: string,
): Promise<TOTPSendStatus> {
  try {
    const newOtp = generateNewOTP(4);

    const status = await sendUpdateVerificationOTPEmail(
      email,
      newOtp.toString(),
    );
    if (status) {
      // Create OTP document only if email was sent successfully
      await Otp.create({
        type: OTP_TYPES.USER_UPDATE,
        identifier: email,
        otp: newOtp.toString(),
      });

      return "sent";
    } else return "failed";
  } catch {
    return "failed";
  }
}
