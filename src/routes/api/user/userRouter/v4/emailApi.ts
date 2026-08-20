import bcrypt from "bcryptjs";
import express from "express";
import { OTP_TYPES } from "../../../../../constants/smsEnums";
import {
  generateAndSendLoginOtpEmail,
  generateAndSendResetOtpEmail,
  generateAndSendSignupOtpEmail,
  generateAndSendUpdateOtpEmail,
  generateUserCredentials,
  getNewProfilePicture,
} from "../../../../../controllers/user/userController";
import Otp from "../../../../../database/models/otp/otp";
import User, { IUserModel } from "../../../../../database/models/user/user";
import Company from "../../../../../database/models/company/company";
import JobCategory from "../../../../../database/models/jobCategory/jobCategory";
import { generateUsername } from "../../../../../util/stringUtils";
import { authenticator } from "../../../../../middlewares/authenticator";
import { flatYupInputValidator } from "../../../../../middlewares/inputValidator";
import { ipChecker } from "../../../../../middlewares/ipBlacklist";
import { userAuthAPIsRateLimiter } from "../../../../../middlewares/rateLimiter";
import {
  emailLoginCheckValidator,
  emailLoginValidator,
  emailOtpValidator,
  emailPasswordResetValidator,
  emailResetValidator,
  emailSignupCheckValidator,
  emailSignupValidator,
  emailSignupWithoutOtpValidator,
  emailUpdateOtpValidator,
  emailUpdateValidator,
  signupWithCompanyValidator,
} from "../../../../../validators/user/userValidator";

const DEFAULT_CATEGORIES = [
  "Technology",
  "Marketing",
  "Finance",
  "Human Resources",
  "Operations",
  "Design",
  "Sales",
  "Customer Service",
];

async function seedCompanyCategories(companyId: any) {
  const categories = DEFAULT_CATEGORIES.map((name) => ({
    name,
    companyId,
  }));
  await JobCategory.insertMany(categories, { ordered: false }).catch(() => {});
}

const router = express.Router();

// email check
router.post(
  "/signup/check",
  ipChecker(),
  userAuthAPIsRateLimiter,
  flatYupInputValidator(emailSignupCheckValidator),
  async (req, res) => {
    const { email } = req.body;

    const userDoc = await User.findOne({ email });

    if (userDoc) {
      return res
        .status(400)
        .json({ message: "Email is already registered, please try login" });
    }

    // sign up, send otp
    const status = await generateAndSendSignupOtpEmail(email);
    if (status === "failed") {
      return res.status(400).json({ message: "Failed to send OTP" });
    }

    return res.json({
      message: "OTP sent in email successfully",
      smsStatus: "sent",
      command: "signup",
    });
  },
);

// Signup
router.post(
  "/signup",
  flatYupInputValidator(emailSignupWithoutOtpValidator),
  async (req, res) => {
    const { name, email, password, otp } = req.body;

    let userDoc = await User.findOne({ email });

    if (userDoc) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // OTP verify (optional — skip if no otp provided)
    if (otp) {
      const otpDoc = await Otp.findOne({
        identifier: email,
        type: OTP_TYPES.USER_SIGNUP,
        otp: otp,
      });
      if (!otpDoc) {
        return res.status(400).json({ message: "OTP is not correct/expired" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const userModel: IUserModel = {
      name,
      email,
      password: hashedPassword,
      profilePicture: getNewProfilePicture(name),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userDoc = await User.create(userModel);

    return res.json(generateUserCredentials(userDoc));
  },
);

async function generateUniqueCompanyUsername(name: string): Promise<string> {
  const baseUsername = generateUsername(name);
  let userName = baseUsername;
  let count = 1;
  while (true) {
    const existing = await Company.findOne({ userName });
    if (!existing) {
      return userName;
    }
    userName = `${baseUsername}-${count}`;
    count++;
  }
}

// Signup with company (No email verification / OTP required)
router.post(
  "/signup-with-company",
  flatYupInputValidator(signupWithCompanyValidator),
  async (req, res) => {
    const { name, email, password, companyName, companyUserName } = req.body;

    let userDoc = await User.findOne({ email });
    if (userDoc) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const userModel: IUserModel = {
      name,
      email,
      password: hashedPassword,
      isEmailVerified: true,
      profilePicture: getNewProfilePicture(name),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userDoc = await User.create(userModel);

    // use the provided username or auto-generate one from the company name
    let companyUsername: string;
    if (companyUserName) {
      const existing = await Company.findOne({ userName: companyUserName });
      if (existing) {
        return res.status(400).json({ message: "Company username is already taken" });
      }
      companyUsername = companyUserName;
    } else {
      companyUsername = await generateUniqueCompanyUsername(companyName);
    }

    // create company
    const company = await Company.create({
      name: companyName,
      userName: companyUsername,
      creatorUserId: userDoc._id,
    });

    await seedCompanyCategories(company._id);

    return res.json(generateUserCredentials(userDoc));
  },
);


// email check
router.post(
  "/login/check",
  ipChecker(),
  userAuthAPIsRateLimiter,
  flatYupInputValidator(emailLoginCheckValidator),
  async (req, res) => {
    const { email } = req.body;

    const userDoc = await User.findOne({ email });

    if (!userDoc) {
      return res
        .status(400)
        .json({ message: "User is not registered, Please signup" });
    }

    if (!userDoc.password) {
      // send otp when no password
      const status = await generateAndSendLoginOtpEmail(email);
      if (status === "failed") {
        return res.status(400).json({ message: "Failed to send OTP" });
      }
      return res.json({
        message: "OTP sent in email successfully",
        smsStatus: "sent",
        command: "verify",
      });
    }

    // we can login
    return res.json({ message: "Login with email", command: "login" });
  },
);

router.post(
  "/login/verify",
  flatYupInputValidator(emailOtpValidator),
  async (req, res) => {
    const { email, otp } = req.body;
    const otpDoc = await Otp.findOne({
      identifier: email,
      type: OTP_TYPES.USER_LOGIN,
      otp: otp,
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "OTP is not correct/expired" });
    }
    return res.json({ message: "OTP verified" });
  },
);

// login email - password
// tested - ok
router.post(
  "/login",
  flatYupInputValidator(emailLoginValidator),
  async (req, res) => {
    const { email, password, otp } = req.body;

    let userDoc = await User.findOne({ email });

    if (!userDoc) {
      return res
        .status(400)
        .json({ message: "User is not registered, Please signup" });
    }

    // set password
    if (!userDoc.password) {
      if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
      }
      // verify OTP
      const otpDoc = await Otp.findOne({
        identifier: email,
        type: OTP_TYPES.USER_LOGIN,
        otp: otp,
      });
      if (!otpDoc) {
        return res.status(400).json({ message: "OTP is not correct/expired" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // update password
      userDoc.password = hashedPassword;
      userDoc = await User.findOneAndUpdate(
        { _id: userDoc._id },
        { $set: { password: hashedPassword } },
        { new: true },
      );
    }

    if (!userDoc || !userDoc.password) {
      return res
        .status(400)
        .json({ message: "User is not registered, Please signup" });
    }

    // verify password
    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email/Password not found" });
    }

    return res.json(generateUserCredentials(userDoc));
  },
);

// reset check
router.post(
  "/reset/check",
  ipChecker(),
  userAuthAPIsRateLimiter,
  flatYupInputValidator(emailResetValidator),
  async (req, res) => {
    const { email } = req.body;

    const userDoc = await User.findOne({ email });

    if (!userDoc) {
      return res.status(400).json({ message: "User email not found" });
    }

    // send reset email OTP
    const status = await generateAndSendResetOtpEmail(email);
    if (status === "failed") {
      return res.status(400).json({ message: "Failed to send OTP" });
    }
    return res.json({ message: "OTP sent successfully" });
  },
);

// reset verify
router.post(
  "/reset/verify",
  flatYupInputValidator(emailOtpValidator),
  async (req, res) => {
    const { email, otp } = req.body;
    const otpDoc = await Otp.findOne({
      identifier: email,
      type: OTP_TYPES.USER_RESET,
      otp: otp,
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "OTP is not correct/expired" });
    }

    return res.json({ message: "OTP verified" });
  },
);

// reset email on otp
router.post(
  "/reset",
  flatYupInputValidator(emailPasswordResetValidator),
  async (req, res) => {
    const { email, password, otp } = req.body;

    let userDoc = await User.findOne({ email });

    if (!userDoc) {
      return res.status(400).json({ message: "Email not found" });
    }

    // we have the account
    const otpDoc = await Otp.findOne({
      identifier: email,
      type: OTP_TYPES.USER_RESET,
      otp: otp,
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "OTP is not correct/expired" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // update password
    userDoc.password = hashedPassword;
    userDoc = await userDoc.save();

    return res.json(generateUserCredentials(userDoc));
  },
);

// update email check
router.post(
  "/update/check",
  ipChecker(),
  userAuthAPIsRateLimiter,
  flatYupInputValidator(emailUpdateValidator),
  authenticator(["user"]),
  async (req, res) => {
    const { email } = req.body;

    const userDoc = await User.findOne({ email });

    if (userDoc) {
      return res.status(400).json({ message: "Email already in use" });
    }
    // we have the account
    const status = await generateAndSendUpdateOtpEmail(email);
    if (status === "failed") {
      return res.status(400).json({ message: "Failed to send OTP" });
    }
    return res.json({ message: "OTP sent successfully" });
  },
);

router.post(
  "/update",
  flatYupInputValidator(emailUpdateOtpValidator),
  authenticator(["user"]),
  async (req, res) => {
    const { email, otp } = req.body;

    const userDoc = await User.findOne({ _id: req.user?._id });

    const otpDoc = await Otp.findOne({
      identifier: email,
      type: OTP_TYPES.USER_UPDATE,
      otp: otp,
    });

    if (!userDoc || !otpDoc) {
      return res.status(400).json({ message: "OTP in not correct/expired" });
    }

    // prevent email duplication
    const userDocWithEmail = await User.findOne({ email });

    if (userDocWithEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // we have the account
    const updatedUserDoc = await User.findByIdAndUpdate(
      { _id: userDoc._id },
      { $set: { email } },
      { new: true, omitUndefined: true },
    ).select({ password: 0, "facebook.accessToken": 0 });

    return res.json(updatedUserDoc);
  },
);

export default router;
