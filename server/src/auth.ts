import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

type CurrentUser = {
  id: number;
  email: string;
  role: string;
};

export type AuthRequest = Request & {
  currentUser?: CurrentUser;
};

const jwtSecret: string = process.env.JWT_SECRET ?? "";

if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET is missing or too short in server/.env");
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = request.cookies?.accessToken;

    if (!token) {
      response.status(401).json({ error: "Please sign in." });
      return;
    }

    const payload = jwt.verify(token, jwtSecret);

    if (typeof payload === "string" || typeof payload.userId !== "number") {
      response.status(401).json({ error: "Invalid sign-in." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      response.status(401).json({ error: "User not found." });
      return;
    }

    (request as AuthRequest).currentUser = user;
    next();
  } catch {
    response.status(401).json({ error: "Sign-in expired or invalid." });
  }
}

export function requireRole(role: "REQUESTER" | "REVIEWER") {
  return (
    request: Request,
    response: Response,
    next: NextFunction
  ): void => {
    const user = (request as AuthRequest).currentUser;

    if (!user) {
      response.status(401).json({ error: "Please sign in." });
      return;
    }

    if (user.role !== role) {
      response.status(403).json({ error: "You do not have permission." });
      return;
    }

    next();
  };
}

export const authRouter = Router();

authRouter.post("/login", async (request, response): Promise<void> => {
  try {
    const { email, password } = request.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      response.status(400).json({ error: "Enter your email and password." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      response.status(401).json({ error: "Email or password is incorrect." });
      return;
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: "1h",
    });

    response.cookie("accessToken", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    response.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch {
    response.status(500).json({ error: "Could not sign in." });
  }
});

authRouter.post("/logout", (_request, response): void => {
  response.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  response.status(204).end();
});

authRouter.get("/me", requireAuth, (request, response): void => {
  response.json((request as AuthRequest).currentUser);
});