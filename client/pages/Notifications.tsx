import Layout from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";

interface NotificationItem {
  id: string;
  donationId: string;
  toRole: "ngo" | "admin" | "user";
  toUserId?: string | null;
  message: string;
  createdAt: string;
  read: boolean;
}

interface DonationRow {
  id: string;
  userId: string;
  category: string;
  quantity: number;
  expiryDate: string;
  donorLat: number | null;
  donorLng: number | null;
  receiverLat: number | null;
  receiverLng: number | null;
  status: "pending" | "accepted" | "distributed";
  createdAt: string;
}

export default function NotificationsPage() {
  const token = localStorage.getItem("fb_token");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [donations, setDonations] = useState<DonationRow[]>([]);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const [nRes, dRes] = await Promise.all([
        fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/donations"),
      ]);
      if (nRes.ok) setItems(await nRes.json());
      if (dRes.ok) setDonations(await dRes.json());
    }
    load();
  }, [token]);

  function donationById(id: string) {
    return donations.find((d) => d.id === id);
  }

  async function markRead(id: string) {
    if (!token) return;
    const res = await fetch(`/api/notifications/${id}/read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
  }

  async function updateStatus(donationId: string, status: DonationRow["status"]) {
    if (!token) return;
    const res = await fetch(`/api/donations/${donationId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setDonations((prev) => prev.map((r) => (r.id === donationId ? { ...r, status } : r)));
  }

  return (
    <Layout>
      <section className="container py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Notifications</h1>
        <p className="mt-2 text-muted-foreground">NGOs and admins can see pickup requests and updates. Open map links for directions.</p>
        <div className="mt-8 space-y-4">
          {items.map((n) => {
            const d = donationById(n.donationId);
            const mapUrl = d?.donorLat && d?.donorLng ? `https://www.google.com/maps?q=${d.donorLat},${d.donorLng}` : null;
            return (
              <div key={n.id} className={`rounded-2xl glass p-5 shadow-sm ring-1 ring-primary/5 ${n.read ? "opacity-75" : ""}`}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()} · Donation #{n.donationId} · Status: {d?.status ?? "-"}</p>
                    {mapUrl && (
                      <a className="text-sm text-primary underline" href={mapUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => markRead(n.id)} className="rounded-md border px-3 py-1">Mark read</button>
                    {d && d.status !== "accepted" && (
                      <button onClick={() => updateStatus(d.id, "accepted")} className="rounded-md border px-3 py-1">Accept</button>
                    )}
                    {d && d.status !== "distributed" && (
                      <button onClick={() => updateStatus(d.id, "distributed")} className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Distributed</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No notifications.</p>}
        </div>
      </section>
    </Layout>
  );
}
