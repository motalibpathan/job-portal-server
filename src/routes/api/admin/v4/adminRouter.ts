import bcrypt from "bcryptjs";
import express, { Request } from "express";
import jwt from "jsonwebtoken";
import Admin from "../../../../database/models/admin/admin";
import {
  authenticator,
  IAdminTokenData,
} from "../../../../middlewares/authenticator";
import { flatYupInputValidator } from "../../../../middlewares/inputValidator";
import config from "../../../../settings/config";
import * as adminValidator from "../../../../validators/admin/adminValidator";
const router = express.Router();

router.post(
  "/signup",
  flatYupInputValidator(adminValidator.signupUsername),
  async (req, res) => {
    const data = req.body;
    let admin = await Admin.findOne({ username: data.username });
    if (admin) {
      return res.status(400).json({ message: "Username not available" });
    }
    admin = await Admin.findOne({ email: data.email });
    if (admin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newAdmin = new Admin({
      name: data.name,
      username: data.username,
      phone: data.phone,
      email: data.email,
      password: passwordHash,
      level: data.level,
      avatar: "https://ui-avatars.com/api/?name=" + data.name + "&size=128",
    });

    await newAdmin.save();

    return res.json({ message: "success" });
  },
);

router.post(
  "/login",
  flatYupInputValidator(adminValidator.loginUsername),
  async (req, res) => {
    const data = req.body;
    const admin = await Admin.findOne({ username: data.username });
    // Check for user
    if (!admin) {
      return res
        .status(400)
        .json({ message: "Username or Password not found" });
    }
    // is admin verified?
    if (!admin.isVerified) {
      return res.status(400).json({ message: "Admin is not verified" });
    }
    // Check Password
    const isMatch = await bcrypt.compare(data.password, admin.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Username or Password not found" });
    }
    const tokenAdmin: IAdminTokenData = {
      adminId: admin._id,
      username: admin.username,
      level: admin.level,
      type: "admin",
    };

    const accessToken = jwt.sign(tokenAdmin, config.ADMIN_SECRET, {
      expiresIn: config.ADMIN_ACCESS_TOKEN_EXPIRATION_TIME_SECOND,
    });
    const refreshToken = jwt.sign(tokenAdmin, config.ADMIN_SECRET, {
      expiresIn: config.ADMIN_REFRESH_TOKEN_EXPIRATION_TIME_SECOND,
    });

    const { _id, isVerified, name, username, phone, email, level, avatar } =
      admin;

    return res.json({
      accessToken: "JWT " + accessToken,
      refreshToken: "JWT " + refreshToken,
      admin: {
        _id,
        isVerified,
        name,
        username,
        phone,
        email,
        level,
        avatar,
      },
    });
  },
);

router.post(
  "/changepassword",
  authenticator(["min-admin"]),
  flatYupInputValidator(adminValidator.changePassword),
  async (req: Request, res) => {
    const data = req.body;
    const userId = req.admin?._id;
    const admin = await Admin.findOne({ _id: userId });
    // Check for admin
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }
    // Check Password
    const isMatch = await bcrypt.compare(data.oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password not correct" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.newPassword, salt);
    admin.password = passwordHash;

    await admin.save();

    return res.json({ message: "success" });
  },
);

router.post(
  "/changepassword/super",
  authenticator(["super-admin"]),
  flatYupInputValidator(adminValidator.changePasswordSuperAdmin),
  async (req, res) => {
    const data = req.body;
    const admin = await Admin.findOne({ _id: data.adminId });
    // Check for user
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    admin.password = passwordHash;

    await admin.save();

    return res.json({ message: "success" });
  },
);

router.get("/list", authenticator(["super-admin"]), async (req, res) => {
  const admins = await Admin.find({}, { password: 0 });
  return res.json(admins);
});

router.get("/", authenticator(["min-admin"]), async (req, res) => {
  const admin = await Admin.findOne({ _id: req.admin?._id }, { password: 0 });
  return res.json(admin);
});

router.put(
  "/verify/:adminId",
  authenticator(["super-admin"]),
  flatYupInputValidator(undefined, adminValidator.verifyAdmin),
  async (req, res) => {
    const query = { _id: req.params.adminId };
    const update = {
      isVerified: true,
    };
    const options = { new: true };
    const admin = await Admin.findOneAndUpdate(query, update, options);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "success" });
  },
);

router.delete(
  "/:adminId",
  authenticator(["super-admin"]),
  flatYupInputValidator(undefined, adminValidator.verifyAdmin),
  async (req, res) => {
    const admin = await Admin.deleteOne({ _id: req.params.adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "success" });
  },
);

router.put("/edit", authenticator(["min-admin"]), async (req, res) => {
  const query = { _id: req.admin?._id };
  const update = {
    name: req.body.name,
    phone: req.body.phone,
  };
  const options = { new: true };
  const newAdmin = await Admin.findOneAndUpdate(query, update, options).select({
    password: 0,
    "facebook.accessToken": 0,
  });

  res.json(newAdmin);
});

router.put(
  "/upgrade/super/:adminId",
  authenticator(["super-admin"]),
  flatYupInputValidator(undefined, adminValidator.verifyAdmin),
  async (req, res) => {
    const query = { _id: req.params.adminId };
    const update = { level: 0 }; // level 0 for super admin
    const options = { new: true };
    const admin = await Admin.findOneAndUpdate(query, update, options);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "success" });
  },
);

router.put(
  "/downgrade/super/:adminId",
  authenticator(["super-admin"]),
  flatYupInputValidator(undefined, adminValidator.verifyAdmin),
  async (req, res) => {
    const query = { _id: req.params.adminId };
    const update = { level: 1 }; // level 1 for admin
    const options = { new: true };
    const admin = await Admin.findOneAndUpdate(query, update, options);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "success" });
  },
);

// admin refresh token route
router.post("/token/refresh", async (req, res) => {
  const data = req.body;
  const tokenData = data.token;

  if (!tokenData) {
    return res.status(401).send();
  }
  const tokenString = tokenData.split(" ")[1];

  try {
    const decodedAdmin = jwt.verify(
      tokenString,
      config.ADMIN_SECRET,
    ) as IAdminTokenData;
    if (typeof decodedAdmin === "object") {
      const tokenAdmin: IAdminTokenData = {
        adminId: decodedAdmin.adminId,
        username: decodedAdmin.username,
        level: decodedAdmin.level,
        type: "admin",
      };

      const newAccessToken = jwt.sign(tokenAdmin, config.ADMIN_SECRET, {
        expiresIn: config.ADMIN_ACCESS_TOKEN_EXPIRATION_TIME_SECOND,
      });
      const newRefreshToken = jwt.sign(tokenAdmin, config.ADMIN_SECRET, {
        expiresIn: config.ADMIN_REFRESH_TOKEN_EXPIRATION_TIME_SECOND,
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

export default router;
