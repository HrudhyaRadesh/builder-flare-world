import Layout from "@/components/Layout";

export default function DashboardPage() {
  const user = localStorage.getItem("fb_user");
  const name = user ? JSON.parse(user).name : "Guest";
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
      </section>
    </Layout>
  );
}
