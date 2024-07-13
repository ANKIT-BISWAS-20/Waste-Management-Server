import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Request } from "../models/request.model.js"
import { Pickup } from "../models/pickup.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import dotenv from "dotenv"
import axios from "axios"
import { sendEmail } from "../utils/sendMail.js";


dotenv.config({
    path: './.env'
})

const createRequest = asyncHandler(async (req, res) => {
    const pickupId = req.query.pickupId
    const userId = req.user._id
    const current_user = await User.findById(userId)
    const { reqPrice } = req.body

    const pickup = await Pickup.findById(pickupId)
    if (!pickup) {
        throw new ApiError(400, "Pickup not found")
    }

    const myRequest = await Request.create({
        owner: userId,
        pickup: pickup._id,
        reqPrice,
    })

    const createdRequest = await Request.findById(myRequest._id)

    if (!createdRequest) {
        throw new ApiError(500, "Something went wrong while creating the request")
    }

    // await sendEmail(
    //     [current_user.email], "Request Created Successfully", `<h1>Hello ${current_user.fullName},</h1><br><h2>Your Request [ id : ${myRequest._id}] has been created successfully for Pickup [id : ${myRequest.pickup}] </h2>`
    // );

    const pickupOwner = await User.findById(pickup.owner)
    if (!pickupOwner) {
        throw new ApiError(400, "Pickup Owner not found")
    }

    // await sendEmail(
    //     [pickupOwner.email], "New Pickup Request", `<h1>Hello ${pickupOwner.fullName},</h1><br><h2>You have a new request from ${current_user.fullName} , for your Pickup [id : ${myRequest.pickup}] </h2>`
    // );

    return res.status(201).json(
        new ApiResponse(200, {
            user: current_user,
            createdRequest: createdRequest,
        }, "Request Added Successfully")
    )
})

const AcceptRequest = asyncHandler(async (req, res) => {
    const requestId = req.query.requestId
    const userId = req.user._id
    const current_user = await User.findById(userId)
    const request = await Request.findById(requestId)
    if (!request) {
        throw new ApiError(400, "Request not found")
    }
    const pickup = await Pickup.findById(request.pickup)
    if (!pickup) {
        throw new ApiError(400, "Pickup not found")
    }
    const owner = await User.findById(pickup.owner)
    if (!owner) {
        throw new ApiError(400, "Owner not found")
    }
    if (owner._id.toString() !== userId.toString()) {
        throw new ApiError(400, "You are not the owner of the pickup")
    }

    const updatedPickup = await Pickup.findOneAndUpdate(
        {
            _id: request.pickup
        },
        {
            acceptedWorker: request.owner,
            workerPrice: request.reqPrice,
            status: "accepted"
        }
    )

    if (!updatedPickup) {
        throw new ApiError(500, "Something went wrong while accepting the request")
    }

    const worker = await User.findById(request.owner)
    if (!worker) {
        throw new ApiError(400, "Worker not found")
    }

    // await sendEmail(
    //     [current_user.email], "Request Accepted Successfully", `<h1>Hello ${current_user.fullName},</h1><br><h2>Request [ id : ${request._id}] has been accepted successfully for Pickup [id : ${request.pickup}] </h2>`
    // );

    // await sendEmail(
    //     [worker.email], "Request Accepted", `<h1>Hello ${worker.fullName},</h1><br><h2>Your Request [ id : ${request._id}] has been accepted successfully for Pickup [id : ${request.pickup}] </h2>`
    // );

    return res.status(200).json(
        new ApiResponse(200, {
            user: current_user,
            updatedPickup: updatedPickup,
        }, "Request Accepted Successfully")
    )
})

const viewRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const pickupId = req.query.pickupId;
    const current_user = await User.findById(userId);
    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
        throw new ApiError(400, "Pickup not found");
    }
    const owner = await User.findById(pickup.owner);
    if (!owner) {
        throw new ApiError(400, "Owner not found");
    }
    if (owner._id.toString() !== userId.toString()) {
        throw new ApiError(400, "You are not the owner of the pickup");
    }
    const requests = await Request.aggregate([
        {
            $match: {
                pickup: pickup._id,
                status: "pending",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner",
        },
    ]);

    if (!requests) {
        throw new ApiError(400, "Requests not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            user: current_user,
            requests: requests,
        }, "Requests fetched Successfully")
    );

})

export { createRequest, AcceptRequest, viewRequests }