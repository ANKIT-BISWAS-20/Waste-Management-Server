import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateUserAvatar,
    getUserAnalytics,
    getWorkerAnalytics
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isCustomer } from "../middlewares/isCustomer.middleware.js";
import { isWorker } from "../middlewares/isWorker.middleware.js";

const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/analytics").get(verifyJWT, isCustomer, getUserAnalytics)
router.route("/worker-analytics").get(verifyJWT,isWorker, getUserAnalytics)

export default router