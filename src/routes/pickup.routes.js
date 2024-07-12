import { Router } from "express";
import {
    createPickup,
    deletePickup
} from "../controllers/pickup.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isCustomer } from "../middlewares/isCustomer.middleware.js";
import { isWorker } from "../middlewares/isWorker.middleware.js";

const router = Router()

router.route("/create").post(
    verifyJWT,
    isCustomer,
    upload.fields([
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    createPickup
)

router.route("/delete").delete(
    verifyJWT,
    deletePickup
)


export default router