import { FormEvent, useState } from "react";
import Layout from "@/components/Layout";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"user" | "ngo" | "admin">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { name, email, password, role },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      localStorage.setItem("fb_token", data.token);
      localStorage.setItem("fb_user", JSON.stringify(data.user));
      setMessage("Success. You can now donate and access your dashboard.");
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  return (
    <Layout>
      <section className="container py-16">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl/tight font-extrabold tracking-tight">Join Plateful</h1>
            <p className="mt-3 text-muted-foreground">Create an account or sign in to donate surplus food or funds. Roles: Users (donors), NGOs (distributors), Admin (oversight).</p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Users can donate food and money</li>
              <li>• NGOs can mark distributions and manage pickups</li>
              <li>• Admin can oversee analytics and verify NGOs</li>
            </ul>
          </div>
          <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-8 shadow-sm">
            <div className="flex gap-2 mb-6">
              <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-md border px-4 py-2 ${mode === "login" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Login</button>
              <button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-md border px-4 py-2 ${mode === "register" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Register</button>
            </div>
            {mode === "register" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Role</label>
                <div className="flex gap-2">
                  {(["user","ngo","admin"] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)} className={`flex-1 rounded-md border px-3 py-2 capitalize ${role===r?"bg-secondary":"bg-muted"}`}>{r}</button>
                  ))}
                </div>
              </div>
            )}
            {mode === "register" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2" placeholder="Your name"/>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} required type="email" className="w-full rounded-md border bg-background px-3 py-2" placeholder="you@example.com"/>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} required type="password" className="w-full rounded-md border bg-background px-3 py-2" placeholder="••••••••"/>
            </div>
            <button className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">{mode === "login" ? "Sign in" : "Create account"}</button>
            {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
          </form>
        </div>
      </section>
    </Layout>
  );
}
