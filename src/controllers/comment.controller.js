import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { Pickup } from "../models/pickup.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})




const getAllComments = asyncHandler( async (req, res) => {
    const pickupId = req.query.pickupId;
    if (!pickupId) {
        throw new ApiError(400, " Pickup id is required")
    }

    const pickup = await Pickup.findById(pickupId)
    
        const comments = await Comment.aggregate([
            {
                "$match": {
                    "pickup": pickup._id
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "sender",
                    "foreignField": "_id",
                    "as": "sender"
                }
            },
            {
                "$unwind": "$sender"
            },
            {
                "$project": {
                    "sender.password": 0
                }
            },{
                "$sort": {
                    "createdAt": 1
                }
            }
        ])
    res.status(200).json(new ApiResponse(200, comments, "Comments Fetched Successfully"))
})


const createComment = asyncHandler( async (req, res) => {
    const {message} = req.body
    const pickupId = req.query.pickupId;
    if (!pickupId) {
        throw new ApiError(400, "Pickup id is required")
    }
    const pickup = await Pickup.findById(pickupId)
    if (!pickup) {
        throw new ApiError(404, "Pickup not found")
    }
    const sender = req.user._id
    const comment = new Comment({
        sender,
        message,
        pickup: pickup._id
    })
    await comment.save()
    res.status(201).json(new ApiResponse(201, comment, "Comment Added Successfully"))
})


export { getAllComments, createComment }