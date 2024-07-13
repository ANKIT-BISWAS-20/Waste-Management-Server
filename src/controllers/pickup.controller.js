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
import { sendEmail } from "../utils/sendMail.js";
import { loadStripe } from '@stripe/stripe-js';



dotenv.config({
    path: './.env'
})

const stripe = await loadStripe(process.env.STRIPE_SECRET_KEY);


const createPickup = asyncHandler(async (req, res) => {


    const current_user = await User.findById(req.user?._id)
    const { description, location, customerPrice, itemDescription, qty } = req.body
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
        itemDescription,
        qty,
        thumbnail: thumbnail.url,
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

const customerViewPickups = asyncHandler(async (req, res) => {
    const current_user = await User.findById(req.user?._id)
    const pickups = await Pickup.find({ owner: current_user._id })
    return res.status(200).json(
        new ApiResponse(200, pickups, "Pickups retrieved successfully")
    )
})

const workerViewPickups = asyncHandler(async (req, res) => {
    const current_user = await User.findById(req.user?._id);
    const pickups = await Pickup.find({ $or: [{ status: "accepted" }, { status: "scheduled" }], worker: current_user._id })
    return res.status(200).json(
        new ApiResponse(200, pickups, "Pickups retrieved successfully")
    )
});

const pickupDetails = asyncHandler(async (req, res) => {
    const pickupId = req.query.id
    const pickup = await Pickup.findById(pickupId)
    if (!pickup) {
        throw new ApiError(404, "Pickup not found")
    }
    if (pickup.status === "pending" || pickup.status === "cancelled") {
        new ApiResponse(200, pickup, "Pickup retrieved successfully")
    }
    else {
        const worker = await User.findById(pickup.worker)
        const owner = await User.findById(pickup.owner)
        return res.status(200).json(
            new ApiResponse(200, { pickup, worker,owner }, "Pickup retrieved successfully")
        )
    }
})

const workerGiveTime = asyncHandler(async (req, res) => {
    const pickupId = req.query.id
    const { time } = req.body
    const current_user = await User.findById(req.user?._id)
    const pickup = await Pickup.findById(pickupId)
    if (!pickup) {
        throw new ApiError(404, "Pickup not found")
    }
    if (pickup.status !== "accepted") {
        throw new ApiError(400, "It is not possible to give time to a pickup that is not accepted")
    }
    if (pickup.worker.toString() !== current_user._id.toString()) {
        throw new ApiError(401, "Not Pickup Worker")
    }
    const formattedTime = new Date(time).toLocaleString()
    const pickupOwner = await User.findById(pickup.owner)
    pickup.time = new Date(time)

    pickup.status = "scheduled"
    await pickup.save()
    await sendEmail(
        [current_user.email], "Time Given Successfully", `<h1>Hello ${current_user.fullName},</h1><br><h2>Your Pickup [ id : ${pickup._id}] has been scheduled successfully at ${formattedTime}</h2>`
    );
    await sendEmail(
        [pickupOwner.email], "Time Given", `<h1>Hello ${pickupOwner.fullName},</h1><br><h2>Your Pickup [ id : ${pickup._id}] has been scheduled successfully at ${formattedTime}</h2>`
    );
    return res.status(200).json(
        new ApiResponse(200, pickup, "Time given successfully")
    )
})

const makePayment = asyncHandler(async (req, res) => {
    const current_user = await User.findById(req.user?._id);
    const pickupId = req.query.id
    const pickup = await Pickup.findById(pickupId)
    if (!pickup) {
        throw new ApiError(404, "Pickup not found")
    }
    if (pickup.status !== "scheduled") {
        throw new ApiError(400, "It is not possible to make payment to a pickup that is not scheduled")
    }
    if (pickup.worker.toString() !== current_user._id.toString()) {
        throw new ApiError(401, "Not Pickup Worker")
    }
    const pickupOwner = await User.findById(pickup.owner)
    let totalAmount = 0;
    for (let i = 0; i < pickup.workerPrice.length; i++) {
        const item = parseFloat(pickup.workerPrice[i])
        const qty = parseFloat(pickup.qty[i])
        totalAmount += Math.round(item * qty)
    }
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Pickup Payment',
                    },
                    unit_amount: totalAmount * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: ``,
        cancel_url: ``,
    });

    if (!session) {
        throw new ApiError(500, "Something went wrong while creating the session")
    }

    sendEmail(
        [current_user.email], "Payment Initiated Successfully", `<h1>Hello ${current_user.fullName},</h1><br><h2>Your Payment for Pickup [ id : ${pickup._id}] has been initiated successfully</h2>`
    );

    sendEmail(
        [pickupOwner.email], "Payment Initiated", `<h1>Hello ${pickupOwner.fullName},</h1><br><h2>Your Payment for Pickup [ id : ${pickup._id}] has been initiated successfully</h2>`
    );

    return res.status(200).json(
        new ApiResponse(200, { session }, "Payment initiated successfully")
    )

})


const markAsPaid = asyncHandler(async (req, res) => {
    const pickupId = req.query.id
    const current_user = await User.findById(req.user?._id);
    const pickup = await Pickup.findById(pickupId)
    if (!pickup) {
        throw new ApiError(404, "Pickup not found")
    }
    if (pickup.status !== "scheduled") {
        throw new ApiError(400, "It is not possible to make payment to a pickup that is not scheduled")
    }
    if (pickup.owner.toString() !== current_user._id.toString()) {
        throw new ApiError(401, "Not Pickup Customer")
    }
    const pickupWorker = await User.findById(pickup.worker)
    pickup.paymentDone = true
    pickup.status = "completed"
    await pickup.save()
    await sendEmail(
        [current_user.email], "Payment Done Successfully", `<h1>Hello ${current_user.fullName},</h1><br><h2>Your Payment for Pickup [ id : ${pickup._id}] has been done successfully</h2>`
    );

    await sendEmail(
        [pickupWorker.email], "Payment Done", `<h1>Hello ${pickupWorker.fullName},</h1><br><h2>Your Payment for Pickup [ id : ${pickup._id}] has been done successfully</h2>`
    );
    return res.status(200).json(
        new ApiResponse(200, pickup, "Payment done successfully")
    )
})


export { createPickup, deletePickup, customerViewPickups, workerViewPickups, pickupDetails, workerGiveTime, makePayment, markAsPaid };