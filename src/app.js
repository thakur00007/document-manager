import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  express.json({
    limit: "10kb",
  })
);
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));
app.use(
  cookieParser({
    httpOnly: true,
    secure: process.env.NODE_ENVIRONMENT === "production",
  })
);

//routers
import userRouter from "./routers/user.route.js";
import folderRouter from "./routers/folder.route.js";
import fileRouter from "./routers/file.route.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/folder", folderRouter);
app.use("/api/v1/file", fileRouter);

export default app;
