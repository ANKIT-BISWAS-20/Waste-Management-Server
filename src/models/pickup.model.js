import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const pickupSchema = new Schema(
    {
        description: {
            type: String,
            required: true
        },
        acceptedWorker: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        thumbnail: {
            type: String, 
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        acceptedPrice: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            default: "pending"
        },
        location: {
            type: [Number],
        },
        customerPrice: {
            type: [Number],
        },
        workerPrice: {
            type: [Number],
        },
        paymentDone: {
            type: Boolean,
            default: false
        },
        paymentId: {
            type: String
        },
    }, 
    {
        timestamps: true
    }
)

pickupSchema.plugin(mongooseAggregatePaginate)

export const Pickup = mongoose.model("Pickup", pickupSchema)