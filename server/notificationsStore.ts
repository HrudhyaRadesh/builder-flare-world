import fs from "fs";
import path from "path";

export type RecipientRole = "ngo" | "admin" | "user";

export interface Notification {
  id: string;
  donationId: string;
  toRole: RecipientRole;
  toUserId?: string | null;
  message: string;
  createdAt: string; // ISO
  read: boolean;
}

const dataDir = path.join(process.cwd(), "server", "data");
const notifFile = path.join(dataDir, "notifications.json");

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(notifFile))
    fs.writeFileSync(notifFile, JSON.stringify([], null, 2), "utf-8");
}

function readAll(): Notification[] {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(notifFile, "utf-8")) as Notification[];
  } catch {
    return [];
  }
}

function writeAll(list: Notification[]) {
  ensure();
  fs.writeFileSync(notifFile, JSON.stringify(list, null, 2), "utf-8");
}

function uid(prefix = "ntf"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export const notifications = {
  add(n: Omit<Notification, "id" | "createdAt" | "read">): Notification {
    const all = readAll();
    const item: Notification = {
      id: uid(),
      createdAt: new Date().toISOString(),
      read: false,
      ...n,
    };
    all.push(item);
    writeAll(all);
    return item;
  },
  listForRole(role: RecipientRole, userId?: string | null): Notification[] {
    const all = readAll();
    return all
      .filter(
        (n) =>
          n.toRole === role &&
          (!n.toUserId || !userId || n.toUserId === userId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  markRead(id: string): Notification | undefined {
    const all = readAll();
    const idx = all.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    all[idx].read = true;
    writeAll(all);
    return all[idx];
  },
};
