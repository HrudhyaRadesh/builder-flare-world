import { RequestHandler } from "express";
import { db } from "../db";
import { decodeToken } from "./auth";

export const mySummary: RequestHandler = (_req, res) => {
  const auth = _req.headers.authorization?.replace("Bearer ", "");
  const decoded = decodeToken(auth || "");
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });
  const userId = decoded.userId;
  const donations = db.listDonations().filter((d) => d.userId === userId);
  const totalMeals = donations.reduce((s, d) => s + d.quantity, 0);
  const board = db.leaderboard(1000);
  const idx = board.findIndex((r) => r.userId === userId);
  const rank = idx === -1 ? null : idx + 1;
  return res.json({ totalMeals, donationCount: donations.length, rank });
};
