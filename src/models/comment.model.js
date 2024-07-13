import mongoose, {Schema} from "mongoose";

const commentSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String, 
            required: true,
        },
        pickup: {
            type: Schema.Types.ObjectId,
            ref: "Pickup",
            required: true

        }
    }, 
    {
        timestamps: true
    }
)


export const Comment = mongoose.model("Comment", commentSchema)