import mongoose, {Schema} from "mongoose";

const requestSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        pickup: {
            type: Schema.Types.ObjectId,
            ref: "Pickup",
            required: true
        },
        reqPrice: {
            type: [Number],
        },
    }, 
    {
        timestamps: true
    }
)


export const Request = mongoose.model("Request", requestSchema)