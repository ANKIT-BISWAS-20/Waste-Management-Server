import express from "express"
import cors from "cors"


const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

// Server Status
import serverStatusRouter from "./src/routes/serverStatus.routes.js"
app.use("/",serverStatusRouter);

// User Endpoints
import userRouter from './src/routes/user.routes.js'
app.use("/api/v1/users", userRouter)

// Pickup Endpoints
import pickupRouter from './src/routes/pickup.routes.js'
app.use("/api/v1/pickup", pickupRouter)

// Request Endpoints
import requestRouter from './src/routes/request.routes.js'
app.use("/api/v1/request", requestRouter)

export { app }