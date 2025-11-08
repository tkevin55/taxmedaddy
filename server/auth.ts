import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: number;
  accountId: number;
  role: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = await db.query.users.findFirst({
    where: and(
      eq(schema.users.id, payload.userId),
      eq(schema.users.isActive, true)
    ),
  });

  if (!user) {
    return res.status(401).json({ error: "User not found or inactive" });
  }

  req.user = payload;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

export async function logAudit(
  accountId: number,
  userId: number | null,
  action: string,
  targetType: string,
  targetId: number | null,
  before: any = null,
  after: any = null
) {
  await db.insert(schema.auditLogs).values({
    accountId,
    userId,
    action,
    targetType,
    targetId,
    beforeJson: before,
    afterJson: after,
  });
}
