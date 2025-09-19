import Layout from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";

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

export default function DashboardPage() {
  const userStr = localStorage.getItem("fb_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const name = user?.name ?? "Guest";
  const role = user?.role as "admin" | "ngo" | "user" | undefined;
  const token = localStorage.getItem("fb_token");

  const [rows, setRows] = useState<DonationRow[]>([]);
  const isAdmin = role === "admin";

  useEffect(() => {
    async function load() {
      if (!isAdmin) return;
      const res = await fetch("/api/donations");
      if (res.ok) setRows(await res.json());
    }
    load();
  }, [isAdmin]);

  async function updateStatus(id: string, status: DonationRow["status"]) {
    if (!token) return alert("Login required");
    const res = await fetch(`/api/donations/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      alert("Status updated");
    } else {
      const e = await res.json();
      alert(e.error || "Failed to update");
    }
  }

  async function notifyNgo(id: string) {
    if (!token) return alert("Login required");
    const res = await fetch(`/api/donations/${id}/notify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) alert("NGOs notified for pickup");
    else {
      const e = await res.json();
      alert(e.error || "Failed to notify");
    }
  }

  return (
    <Layout>
      <section className="container py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Welcome, {name}</h1>
        <p className="mt-2 text-muted-foreground">This dashboard will show your badges, rank, and donation history.</p>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Badges</h3>
            <p className="mt-2 text-sm text-muted-foreground">Earn badges as you donate more meals. Your next milestone is at 10 meals.</p>
            <div className="mt-4 h-3 w-full rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: "20%" }} /></div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Your Donations</h3>
            <p className="mt-2 text-sm text-muted-foreground">Coming soon: a list of your recent donations and statuses.</p>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-12 rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Admin · Manage Donations</h3>
            <p className="mt-2 text-sm text-muted-foreground">Update statuses and notify NGOs for pickup.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Qty</th>
                    <th className="py-2 pr-4">Expiry</th>
                    <th className="py-2 pr-4">Donor (lat,lng)</th>
                    <th className="py-2 pr-4">Receiver (lat,lng)</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-3 pr-4">{r.category}</td>
                      <td className="py-3 pr-4">{r.quantity}</td>
                      <td className="py-3 pr-4">{new Date(r.expiryDate).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">{r.donorLat ?? "-"}, {r.donorLng ?? "-"}</td>
                      <td className="py-3 pr-4">{r.receiverLat ?? "-"}, {r.receiverLng ?? "-"}</td>
                      <td className="py-3 pr-4">
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(r.id, e.target.value as any)}
                          className="rounded-md border bg-background px-2 py-1"
                        >
                          <option value="pending">pending</option>
                          <option value="accepted">accepted</option>
                          <option value="distributed">distributed</option>
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <button onClick={() => notifyNgo(r.id)} className="rounded-md border px-3 py-1">Notify NGO</button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td className="py-4 text-muted-foreground" colSpan={7}>No donations yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
