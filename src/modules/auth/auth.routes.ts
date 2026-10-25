// modules/auth/auth.routes.ts — URL definitions only. Maps method + path to controller. No logic.
import { Router } from "express";
import { AuthController } from "./auth.controller.js";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/login", authController.login);
authRouter.post("/register", authController.register);

export default authRouter;
