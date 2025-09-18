import Layout from "@/components/Layout";
import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<{ userId: string; name: string; totalQuantity: number; donations: number }[]>([]);
  useEffect(() => {
    fetch("/api/leaderboard").then(r=>r.json()).then(setRows).catch(()=>{});
  }, []);
  return (
    <Layout>
      <section className="container py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Top Donors</h1>
        <p className="mt-2 text-muted-foreground">Gamified rankings based on total meals contributed.</p>
        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          <ul className="divide-y">
            {rows.map((r, i) => (
              <li key={r.userId} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent font-bold">{i+1}</span>
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.donations} donations</p>
                  </div>
                </div>
                <span className="text-lg font-semibold">{r.totalQuantity} meals</span>
              </li>
            ))}
            {rows.length === 0 && <li className="py-4 text-sm text-muted-foreground">No donations yet.</li>}
          </ul>
        </div>
      </section>
    </Layout>
  );
}
