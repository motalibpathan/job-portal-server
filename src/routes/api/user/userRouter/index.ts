import express from "express";
import emailApi from "./v4/emailApi";
import oAuthApi from "./v4/oAuthApi";
import userProfileApi from "./v4/userProfileApi";

const router = express.Router();

router.use(emailApi);
router.use(oAuthApi);
router.use(userProfileApi);

export default router;
