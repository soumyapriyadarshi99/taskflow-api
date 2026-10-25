import express from "express";
import dotenv from "dotenv";
import prisma from "./config/db.js";
import authRouter from "./modules/auth/auth.routes.js";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8000;

app.get("/", async (req: express.Request, res: express.Response) => {
  console.log(await prisma.user.count());
  res.send("Server is up and ruuning");
});

app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
