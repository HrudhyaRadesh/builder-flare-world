import { RequestHandler } from "express";
import { decodeToken } from "./auth";
import { notifications } from "../notificationsStore";

export const listMyNotifications: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const decoded = decodeToken(token || "");
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });
  const items = notifications.listForRole(decoded.role, decoded.userId);
  return res.json(items);
};

export const markNotificationRead: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const decoded = decodeToken(token || "");
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params as { id: string };
  const n = notifications.markRead(id);
  if (!n) return res.status(404).json({ error: "Not found" });
  return res.json(n);
};
