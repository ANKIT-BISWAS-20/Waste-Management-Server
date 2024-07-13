import { Router } from "express";
import {
    createPickup,
    deletePickup,
    customerViewPickups,
    workerViewPickups,
    pickupDetails,
    workerGiveTime,
    makePayment,
    markAsPaid
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

router.route("/customer/view").get(
    verifyJWT,
    isCustomer,
    customerViewPickups
)

router.route("/worker/view").get(
    verifyJWT,
    isWorker,
    workerViewPickups
)

router.route("/details").get(
    verifyJWT,
    pickupDetails
)

router.route("/worker/giveTime").post(
    verifyJWT,
    isWorker,
    workerGiveTime
)

router.route("/makePayment").post(
    verifyJWT,
    isWorker,
    makePayment
)

router.route("/markAsPaid").post(
    verifyJWT,
    isCustomer,
    markAsPaid
)


export default router