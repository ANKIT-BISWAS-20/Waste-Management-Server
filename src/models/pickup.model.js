import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const pickupSchema = new Schema(
    {
        description: {
            type: String,
            required: true
        },
        worker: {
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
        status: {
            type: String,
            default: "pending"
        },
        location: {
            type: [String],
        },
        items: {
            type: [String],
            default: ['Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste', 'Others']
        },
        itemDescription: {
            type: [String],
        },
        timeArrival: {
            type: Date,
        },
        qty: {
            type: [String],
        },
        customerPrice: {
            type: [String],
        },
        workerPrice: {
            type: [String],
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