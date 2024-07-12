import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Pickup } from "../models/pickup.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import dotenv from "dotenv"
const { ObjectId } = mongoose.Types;
import axios from "axios"
import {sendEmail} from "../utils/sendMail.js";

dotenv.config({
    path: './.env'
})


const createPickup = asyncHandler(async (req, res) => {


    const current_user = await User.findById(req.user?._id)
    const { description, location, customerPrice } = req.body
    if (
        [description].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail file is required")
    }


    const myPickup = await Pickup.create({
        description,
        location,
        customerPrice,
        thumbnail:thumbnail.url,
        owner: current_user._id,
    })

    const createdPickup = await Pickup.findById(myPickup._id)

    if (!createdPickup) {
        throw new ApiError(500, "Something went wrong while creating the pickup")
    }

    await sendEmail(
        [current_user.email], "Pickup Created Successfully", `<h1>Hello ${current_user.fullName},</h1><br><h2>Your Pickup [ id : ${myPickup._id}] has been created successfully</h2>`
    );


    return res.status(201).json(
        new ApiResponse(200, {
            user: current_user,
            createdPickup: createdPickup,
        }, "Pickup Created Successfully")
    )

});

const deletePickup = asyncHandler(async (req, res) => {
    const pickupId = req.query.id
    const current_user = await User.findById(req.user?._id)
    const myPickup = await Pickup.findById(pickupId)
    if (!myPickup) {
        throw new ApiError(404, "Pickup not found")
    }
    if (myPickup.owner.toString() !== current_user._id.toString()) {
        throw new ApiError(401, "Not Pickup Customer")
    }
    if (myPickup.status !== "pending") {
        throw new ApiError(400, "It is not possible to delete a pickup that is not pending")
    }
    await Pickup.findByIdAndDelete(pickupId)
    return res.status(200).json(
        new ApiResponse(200, null, "Pickup deleted successfully")
    )
})

export { createPickup, deletePickup };