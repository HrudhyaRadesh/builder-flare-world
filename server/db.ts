import fs from "fs";
import path from "path";

export type Role = "user" | "ngo" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string; // ISO
}

export interface Donation {
  id: string;
  userId: string;
  category: string;
  quantity: number;
  expiryDate: string; // ISO date string
  donorLat: number | null;
  donorLng: number | null;
  receiverLat: number | null;
  receiverLng: number | null;
  status: "pending" | "accepted" | "distributed";
  createdAt: string; // ISO
}

export interface PaymentRecord {
  id: string;
  userId: string | null;
  amount: number; // in smallest currency unit (e.g., cents)
  currency: string;
  stripePaymentIntentId: string;
  status: string;
  createdAt: string; // ISO
}

interface DBShape {
  users: User[];
  donations: Donation[];
  payments: PaymentRecord[];
}

const dataDir = path.join(process.cwd(), "server", "data");
const dbFile = path.join(dataDir, "db.json");

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function initDB(): DBShape {
  ensureDir();
  if (!fs.existsSync(dbFile)) {
    const initial: DBShape = { users: [], donations: [], payments: [] };
    fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(dbFile, "utf-8");
    const parsed = JSON.parse(raw) as DBShape;
    if (!parsed.users || !parsed.donations || !parsed.payments) throw new Error("Invalid DB file");
    return parsed;
  } catch {
    const initial: DBShape = { users: [], donations: [], payments: [] };
    fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

let cache: DBShape | null = null;

function read(): DBShape {
  if (cache) return cache;
  cache = initDB();
  return cache;
}

function write(data: DBShape) {
  ensureDir();
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf-8");
  cache = data;
}

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export const db = {
  read,
  write,
  uid,
  addUser(u: Omit<User, "id" | "createdAt"> & Partial<Pick<User, "createdAt">>): User {
    const data = read();
    const user: User = { id: uid("usr"), createdAt: u.createdAt ?? new Date().toISOString(), ...u } as User;
    data.users.push(user);
    write(data);
    return user;
  },
  findUserByEmail(email: string): User | undefined {
    return read().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserById(id: string): User | undefined {
    return read().users.find((u) => u.id === id);
  },
  addDonation(d: Omit<Donation, "id" | "createdAt" | "status"> & Partial<Pick<Donation, "status" | "createdAt">>): Donation {
    const data = read();
    const donation: Donation = {
      id: uid("don"),
      createdAt: d.createdAt ?? new Date().toISOString(),
      status: d.status ?? "pending",
      ...d,
    } as Donation;
    data.donations.push(donation);
    write(data);
    return donation;
  },
  updateDonationStatus(id: string, status: Donation["status"]): Donation | undefined {
    const data = read();
    const idx = data.donations.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    data.donations[idx].status = status;
    write(data);
    return data.donations[idx];
  },
  listDonations() {
    return read().donations.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  addPayment(p: Omit<PaymentRecord, "id" | "createdAt"> & Partial<Pick<PaymentRecord, "createdAt">>): PaymentRecord {
    const data = read();
    const payment: PaymentRecord = { id: uid("pay"), createdAt: p.createdAt ?? new Date().toISOString(), ...p } as PaymentRecord;
    data.payments.push(payment);
    write(data);
    return payment;
  },
  leaderboard(limit = 10) {
    const map = new Map<string, { user: User | undefined; total: number; count: number }>();
    for (const d of read().donations) {
      const prev = map.get(d.userId) ?? { user: this.getUserById(d.userId), total: 0, count: 0 };
      prev.total += d.quantity;
      prev.count += 1;
      map.set(d.userId, prev);
    }
    return Array.from(map.entries())
      .map(([userId, v]) => ({ userId, name: v.user?.name ?? "Anonymous", totalQuantity: v.total, donations: v.count }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  },
  analytics() {
    const all = read().donations;
    const distributed = all.filter((d) => d.status === "distributed");
    const pending = all.filter((d) => d.status !== "distributed");
    const categories = all.reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + d.quantity;
      return acc;
    }, {});
    return {
      totalDonations: all.length,
      totalQuantity: all.reduce((s, d) => s + d.quantity, 0),
      distributedCount: distributed.length,
      pendingCount: pending.length,
      categories,
    };
  },
};
