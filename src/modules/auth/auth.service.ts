import prisma from "../../config/db.js";
import crypto from "crypto";
import { User } from "../../generated/prisma/client.js";

// modules/auth/auth.service.ts — Business logic + DB calls for auth. Hash, JWT, rotation live here.
export class AuthService {
  public login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      throw new Error("Invaid email or password");
    }

    const isCorrectPassword = this.verifyPassword(password, user.passwordHash);

    if (isCorrectPassword) {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }

    throw new Error("Invalid email or password");
  };
  public register = async (email: string, password: string, name: string) => {
    if (!email || !password || !name) {
      throw new Error("Email, password and name are required");
    }
    const isExisting = await prisma.user.findUnique({
      where: { email: email },
    });
    if (isExisting) {
      throw new Error("Email already exist");
    }
    const hashedPassowrd = await this.hashPassowrd(password);
    const user = await prisma.user.create({
      data: {
        email: email,
        name: name,
        passwordHash: hashedPassowrd,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return user;
  };
  public logout = async () => {};

  private hashPassowrd = async (password: string) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    return `${salt}:${hash}`;
  };

  private verifyPassword = (password: string, storedHash: string) => {
    const [salt, originalHash] = storedHash.split(":");

    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    return hash === originalHash;
  };
}
