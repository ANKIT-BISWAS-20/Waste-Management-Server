import nodemailer from 'nodemailer';
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})

const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    secure: true,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
});


const sendEmail = async (emails,subject,html) => {
    const info = await transporter.sendMail({
        from: `"Waste Management ♻️" <${process.env.USER}>`, // sender address
        to: emails, // list of receivers
        subject: subject, // Subject line
        text: "You are Here ✅", // plain text body
        html: html, // html body
    });
}

export { sendEmail };