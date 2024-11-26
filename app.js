import express from "express";
import cors from "cors";
import user from "./src/routes/userRouter.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//router connection
app.use("/api/", user);

export default app;
