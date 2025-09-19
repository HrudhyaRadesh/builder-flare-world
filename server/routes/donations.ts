import { RequestHandler } from "express";
import { db, Donation } from "../db";
import { decodeToken } from "./auth";
import { notifications } from "../notificationsStore";

export const createDonation: RequestHandler = (req, res) => {
  const auth = req.headers.authorization?.replace("Bearer ", "");
  const decoded = decodeToken(auth || "");
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  const {
    category,
    quantity,
    expiryDate,
    donorLat,
    donorLng,
    receiverLat,
    receiverLng,
  } = req.body as {
    category: string;
    quantity: number;
    expiryDate: string;
    donorLat?: number | null;
    donorLng?: number | null;
    receiverLat?: number | null;
    receiverLng?: number | null;
  };

  if (
    !category ||
    !expiryDate ||
    typeof quantity !== "number" ||
    quantity <= 0
  ) {
    return res.status(400).json({ error: "Invalid donation data" });
  }

  const donation = db.addDonation({
    userId: decoded.userId,
    category,
    quantity,
    expiryDate,
    donorLat: donorLat ?? null,
    donorLng: donorLng ?? null,
    receiverLat: receiverLat ?? null,
    receiverLng: receiverLng ?? null,
  });
  res.status(201).json(donation);
};

export const listDonations: RequestHandler = (_req, res) => {
  res.json(db.listDonations());
};

export const updateDonationStatus: RequestHandler = (req, res) => {
  const auth = req.headers.authorization?.replace("Bearer ", "");
  const decoded = decodeToken(auth || "");
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });
  if (!(decoded.role === "admin" || decoded.role === "ngo"))
    return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params as { id: string };
  const { status } = req.body as { status: Donation["status"] };
  if (!id || !status) return res.status(400).json({ error: "Invalid request" });
  const updated = db.updateDonationStatus(id, status);
  if (!updated) return res.status(404).json({ error: "Donation not found" });
  res.json(updated);
};

export const notifyNgoForDonation: RequestHandler = (req, res) => {
  const auth = req.headers.authorization?.replace("Bearer ", "");
  const decoded = decodeToken(auth || "");
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });
  if (decoded.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params as { id: string };
  const donation = db.listDonations().find((d) => d.id === id);
  if (!donation) return res.status(404).json({ error: "Donation not found" });
  const msg = `Pickup requested: ${donation.quantity} x ${donation.category} at (${donation.donorLat ?? "?"}, ${donation.donorLng ?? "?"}).`;
  const note = notifications.add({
    donationId: donation.id,
    toRole: "ngo",
    message: msg,
  });
  res.json({ ok: true, notification: note });
};

export const getLeaderboard: RequestHandler = (_req, res) => {
  res.json(db.leaderboard(10));
};

export const getAnalytics: RequestHandler = (_req, res) => {
  res.json(db.analytics());
};
