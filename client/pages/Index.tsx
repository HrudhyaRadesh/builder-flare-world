import Layout from "@/components/Layout";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useMemo, useState } from "react";

const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem("fb_token"));
  }, []);
  return token;
}

function DonationForm() {
  const token = useAuthToken();
  const [category, setCategory] = useState("Cooked Meals");
  const [quantity, setQuantity] = useState(1);
  const [expiry, setExpiry] = useState<string>("");
  const [donorLat, setDonorLat] = useState<number | null>(null);
  const [donorLng, setDonorLng] = useState<number | null>(null);
  const [receiverLat, setReceiverLat] = useState<number | null>(null);
  const [receiverLng, setReceiverLng] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function geolocate(setLat: (n: number) => void, setLng: (n: number) => void) {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      (err) => setMessage(err.message),
      { enableHighAccuracy: true }
    );
  }

  async function submit() {
    setMessage(null);
    if (!token) {
      setMessage("Please login first.");
      return;
    }
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, quantity: Number(quantity), expiryDate: expiry, donorLat, donorLng, receiverLat, receiverLng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to donate");
      setMessage("Thank you! Your donation was recorded.");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <div className="rounded-2xl glass p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Donate Surplus Food</h3>
      <p className="mt-1 text-sm text-muted-foreground">Specify food category, quantity, expiry, and pickup location. Receiver location is optional.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select className="w-full rounded-md border bg-background px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
            <option>Cooked Meals</option>
            <option>Dry Rations</option>
            <option>Fruits & Vegetables</option>
            <option>Bread & Bakery</option>
            <option>Dairy</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity (meals/items)</label>
          <input type="number" min={1} className="w-full rounded-md border bg-background px-3 py-2" value={quantity} onChange={(e)=>setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Expiry Date</label>
          <input type="date" className="w-full rounded-md border bg-background px-3 py-2" value={expiry} onChange={(e)=>setExpiry(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Donor Lat</label>
            <input className="w-full rounded-md border bg-background px-3 py-2" value={donorLat ?? ""} onChange={(e)=>setDonorLat(Number(e.target.value))} placeholder="e.g. 12.97" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Donor Lng</label>
            <input className="w-full rounded-md border bg-background px-3 py-2" value={donorLng ?? ""} onChange={(e)=>setDonorLng(Number(e.target.value))} placeholder="e.g. 77.59" />
          </div>
          <button type="button" onClick={()=>geolocate((v)=>setDonorLat(v),(v)=>setDonorLng(v))} className="col-span-2 rounded-md bg-secondary px-3 py-2 text-sm">Use my current location</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Receiver Lat</label>
            <input className="w-full rounded-md border bg-background px-3 py-2" value={receiverLat ?? ""} onChange={(e)=>setReceiverLat(Number(e.target.value))} placeholder="optional" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Receiver Lng</label>
            <input className="w-full rounded-md border bg-background px-3 py-2" value={receiverLng ?? ""} onChange={(e)=>setReceiverLng(Number(e.target.value))} placeholder="optional" />
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <button onClick={submit} className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Donate Food</button>
        <p className="text-sm text-muted-foreground">Log in required</p>
      </div>
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

function PaymentInner({ onStatus }: { onStatus: (s: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  async function pay() {
    if (!stripe || !elements) return;
    onStatus("Processing...");
    const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: window.location.href }, redirect: "if_required" });
    if (error) onStatus(error.message || "Payment failed");
    else onStatus("Payment processed. Thank you!");
  }
  return (
    <div className="mt-4">
      <PaymentElement />
      <div className="mt-4 flex items-center gap-2">
        <button onClick={pay} className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Pay</button>
        <span className="text-sm text-muted-foreground">Login recommended to attribute rewards</span>
      </div>
    </div>
  );
}

function MoneyDonation() {
  const [amount, setAmount] = useState<number>(500);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const stripePromise = useMemo(() => (stripePk ? loadStripe(stripePk) : null), []);

  async function initialize() {
    setStatus(null);
    const user = localStorage.getItem("fb_user");
    const userId = user ? JSON.parse(user).id : null;
    const res = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(amount), currency: "usd", userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to initialize payment");
    setClientSecret(data.clientSecret);
  }

  return (
    <div className="rounded-2xl glass p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Donate Money</h3>
      <p className="mt-1 text-sm text-muted-foreground">Support logistics and storage. Real payments via Stripe.</p>
      {!stripePk && (
        <div className="mt-4 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          Stripe is not yet configured. Set STRIPE_SECRET_KEY (server) and VITE_STRIPE_PUBLISHABLE_KEY (client). You can deploy with Netlify or Vercel and set env vars there. To use managed hosting, connect via Open MCP popover.
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Amount (USD cents)</label>
          <input type="number" min={100} step={100} className="w-full rounded-md border bg-background px-3 py-2" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} />
        </div>
        <div className="flex items-end">
          <button onClick={initialize} className="rounded-md bg-secondary px-4 py-2">Create Payment</button>
        </div>
      </div>
      {clientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <PaymentInner onStatus={(s)=>setStatus(s)} />
        </Elements>
      )}
      {status && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}

function Leaderboard() {
  const [rows, setRows] = useState<{ userId: string; name: string; totalQuantity: number; donations: number }[]>([]);
  useEffect(() => {
    fetch("/api/leaderboard").then(r=>r.json()).then(setRows).catch(()=>{});
  }, []);
  return (
    <div className="rounded-2xl glass p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Top Donors</h3>
      <ul className="mt-4 space-y-3">
        {rows.slice(0,5).map((r, i)=> (
          <li key={r.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent font-bold">{i+1}</span>
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.donations} donations</p>
              </div>
            </div>
            <span className="font-semibold">{r.totalQuantity} meals</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted-foreground">No donations yet.</li>}
      </ul>
    </div>
  );
}

function Analytics() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch("/api/analytics").then(r=>r.json()).then(setStats).catch(()=>{});
  }, []);
  if (!stats) return (
    <div className="rounded-2xl glass p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Impact Analytics</h3>
      <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
    </div>
  );
  return (
    <div className="rounded-2xl glass p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Impact Analytics</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Total Donations</p><p className="mt-1 text-2xl font-bold">{stats.totalDonations}</p></div>
        <div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Total Meals</p><p className="mt-1 text-2xl font-bold">{stats.totalQuantity}</p></div>
        <div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Distributed</p><p className="mt-1 text-2xl font-bold">{stats.distributedCount}</p></div>
        <div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="mt-1 text-2xl font-bold">{stats.pendingCount}</p></div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-medium">By Category</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {Object.entries(stats.categories as Record<string, number>).map(([k,v]) => (
            <div key={k} className="flex items-center justify-between rounded-md border p-3">
              <span>{k}</span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
          {Object.keys(stats.categories||{}).length===0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <Layout>
      <section className="container py-16 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 mix-blend-multiply mesh-bg" />
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-5xl/tight font-extrabold tracking-tight gradient-text">End Hunger. Share Surplus. Power Communities.</h1>
            <p className="mt-4 text-lg text-muted-foreground">Plateful connects donors, NGOs, and the hungry to reduce food waste and improve food security. Donate meals or funds and climb the leaderboard with impact badges.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/donate" className="rounded-md px-5 py-3 font-semibold btn-gradient">Donate Now</a>
              <a href="/login" className="rounded-md border px-5 py-3">Sign in</a>
            </div>
          </div>
          <div className="rounded-3xl glass p-6 shadow-xl ring-1 ring-primary/5">
            <Analytics />
          </div>
        </div>
      </section>
      <section id="donate" className="container pb-16">
        <div className="grid gap-8 md:grid-cols-2">
          <DonationForm />
          <MoneyDonation />
        </div>
      </section>
      <section className="container pb-24">
        <div className="grid gap-8 md:grid-cols-2">
          <Leaderboard />
          <div className="rounded-2xl glass p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Your Badge Progress</h3>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to track your rank and earn badges as you donate more food.</p>
            <div className="mt-4 h-3 w-full rounded-full bg-muted">
              <div className="h-3 rounded-full bg-primary" style={{ width: "20%" }} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Next badge at 10 meals donated.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
