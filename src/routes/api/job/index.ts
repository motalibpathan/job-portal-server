import express from "express";
import companyApi from "./v1/companyApi";
import jobApi from "./v1/jobApi";
import jobCategoryApi from "./v1/jobCategoryApi";
import jobApplicationApi from "./v1/jobApplicationApi";
import billingApi from "./v1/billingApi";
import publicApi from "./v1/publicApi";

const router = express.Router();

router.use(companyApi);
router.use(jobApi);
router.use(jobCategoryApi);
router.use(jobApplicationApi);
router.use(billingApi);
router.use(publicApi);

export default router;
