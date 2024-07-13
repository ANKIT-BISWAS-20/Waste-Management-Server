import { Router } from "express";
import {
    createRequest, 
    AcceptRequest, 
    viewRequests
} from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isCustomer } from "../middlewares/isCustomer.middleware.js";
import { isWorker } from "../middlewares/isWorker.middleware.js";

const router = Router()

router.route("/create").post(
    verifyJWT,
    isWorker,
    createRequest
)

router.route("/accept").post(
    verifyJWT,
    isCustomer,
    AcceptRequest
)

router.route("/view").get(
    verifyJWT,
    isCustomer,
    viewRequests
)


export default router