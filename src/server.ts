import express from "express";
import dotenv from "dotenv";
import prisma from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.get("/", async (req: express.Request, res: express.Response) => {
  console.log(await prisma.user.count());
  res.send("Server is up and ruuning");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
