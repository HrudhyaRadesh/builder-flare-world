import { RequestHandler } from "express";
import crypto from "crypto";
import { db, Role } from "../db";

const AUTH_SECRET = process.env.AUTH_SECRET || "dev_secret_change_me";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function sign(data: string): string {
  return crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("hex");
}

function encodeToken(userId: string, role: Role): string {
  const payload = `${userId}.${role}.${Date.now()}`;
  const sig = sign(payload);
  const b64 = Buffer.from(payload).toString("base64url");
  return `${b64}.${sig}`;
}

export function decodeToken(token: string | undefined): { userId: string; role: Role } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadB64 = parts.slice(0, parts.length - 1).join(".");
  const sig = parts[parts.length - 1];
  const payloadRaw = Buffer.from(payloadB64, "base64url").toString("utf8");
  if (sign(payloadRaw) !== sig) return null;
  const [userId, role] = payloadRaw.split(".");
  if (!userId || !role) return null;
  return { userId, role: role as Role };
}

export const register: RequestHandler = (req, res) => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: Role;
  };
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!["user", "ngo", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  const existing = db.findUserByEmail(email);
  if (existing) return res.status(409).json({ error: "Email already in use" });
  const user = db.addUser({ name, email, passwordHash: hashPassword(password), role });
  const token = encodeToken(user.id, user.role);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};

export const login: RequestHandler = (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });
  const user = db.findUserByEmail(email);
  if (!user || user.passwordHash !== hashPassword(password)) return res.status(401).json({ error: "Invalid credentials" });
  const token = encodeToken(user.id, user.role);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};

export const me: RequestHandler = (req, res) => {
  const auth = req.headers.authorization?.replace("Bearer ", "");
  const decoded = decodeToken(auth);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });
  const user = db.getUserById(decoded.userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
};
