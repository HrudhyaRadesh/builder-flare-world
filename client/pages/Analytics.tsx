import Layout from "@/components/Layout";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { fetch("/api/analytics").then(r=>r.json()).then(setStats).catch(()=>{}); }, []);
  return (
    <Layout>
      <section className="container py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Impact Analytics</h1>
        <p className="mt-2 text-muted-foreground">Real-time view of donations and distributions.</p>
        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          {!stats && <p className="text-sm text-muted-foreground">Loading...</p>}
          {stats && (
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Total Donations</p><p className="mt-1 text-2xl font-bold">{stats.totalDonations}</p></div>
                <div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Total Meals</p><p className="mt-1 text-2xl font-bold">{stats.totalQuantity}</p></div>
                <div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Distributed</p><p className="mt-1 text-2xl font-bold">{stats.distributedCount}</p></div>
                <div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="mt-1 text-2xl font-bold">{stats.pendingCount}</p></div>
              </div>
              <div>
                <p className="text-sm font-medium">By Category</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {Object.entries(stats.categories as Record<string, number>).map(([k,v]) => (
                    <div key={k} className="flex items-center justify-between rounded-md border p-3">
                      <span>{k}</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
