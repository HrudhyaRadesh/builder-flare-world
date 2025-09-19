import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { register, login, me } from "./routes/auth";
import { createDonation, listDonations, updateDonationStatus, getLeaderboard, getAnalytics, notifyNgoForDonation } from "./routes/donations";
import { createPaymentIntent } from "./routes/payments";
import { mySummary } from "./routes/users";
import { listMyNotifications, markNotificationRead } from "./routes/notifications";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Demo
  app.get("/api/demo", handleDemo);

  // Auth
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/me", me);

  // Donations
  app.post("/api/donations", createDonation);
  app.get("/api/donations", listDonations);
  app.post("/api/donations/:id/status", updateDonationStatus);
  app.post("/api/donations/:id/notify", notifyNgoForDonation);
  app.get("/api/leaderboard", getLeaderboard);
  app.get("/api/analytics", getAnalytics);

  // Payments
  app.post("/api/payments/create-intent", createPaymentIntent);

  // Users
  app.get("/api/users/me/summary", mySummary);

  // Notifications
  app.get("/api/notifications", listMyNotifications);
  app.post("/api/notifications/:id/read", markNotificationRead);

  return app;
}
