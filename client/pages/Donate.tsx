import Layout from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined;

function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem("fb_token"));
  }, []);
  return token;
}

function FoodDonationForm() {
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
      { enableHighAccuracy: true },
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          quantity: Number(quantity),
          expiryDate: expiry,
          donorLat,
          donorLng,
          receiverLat,
          receiverLng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to donate");
      setMessage("Thank you! Your food donation was recorded.");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <div className="rounded-2xl glass p-6 shadow-lg ring-1 ring-primary/5">
      <h3 className="text-xl font-semibold">Donate Surplus Food</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Specify food details and locations. Receiver location is optional.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Cooked Meals</option>
            <option>Dry Rations</option>
            <option>Fruits & Vegetables</option>
            <option>Bread & Bakery</option>
            <option>Dairy</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Quantity (meals/items)
          </label>
          <input
            type="number"
            min={1}
            className="w-full rounded-md border bg-background px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Expiry Date</label>
          <input
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Donor Lat</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              value={donorLat ?? ""}
              onChange={(e) => setDonorLat(Number(e.target.value))}
              placeholder="e.g. 12.97"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Donor Lng</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              value={donorLng ?? ""}
              onChange={(e) => setDonorLng(Number(e.target.value))}
              placeholder="e.g. 77.59"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              geolocate(
                (v) => setDonorLat(v),
                (v) => setDonorLng(v),
              )
            }
            className="col-span-2 rounded-md bg-secondary px-3 py-2 text-sm"
          >
            Use my current location
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Receiver Lat
            </label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              value={receiverLat ?? ""}
              onChange={(e) => setReceiverLat(Number(e.target.value))}
              placeholder="optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Receiver Lng
            </label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              value={receiverLng ?? ""}
              onChange={(e) => setReceiverLng(Number(e.target.value))}
              placeholder="optional"
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          onClick={submit}
          className="rounded-md px-5 py-2.5 font-semibold btn-gradient"
        >
          Donate Food
        </button>
        <p className="text-sm text-muted-foreground">Log in required</p>
      </div>
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

function PaymentInner({ onStatus }: { onStatus: (s: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  async function pay() {
    if (!stripe || !elements) return;
    onStatus("Processing...");
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (error) onStatus(error.message || "Payment failed");
    else onStatus("Payment processed. Thank you!");
  }
  return (
    <div className="mt-4">
      <PaymentElement />
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={pay}
          className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          Pay
        </button>
        <span className="text-sm text-muted-foreground">
          Payments are processed in INR via Stripe.
        </span>
      </div>
    </div>
  );
}

function MoneyDonationINR() {
  const stripePromise = useMemo(
    () => (stripePk ? loadStripe(stripePk) : null),
    [],
  );
  const [amountInr, setAmountInr] = useState<number>(500);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function initialize() {
    setStatus(null);
    const user = localStorage.getItem("fb_user");
    const userId = user ? JSON.parse(user).id : null;
    const res = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(amountInr * 100),
        currency: "inr",
        userId,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to initialize payment");
    setClientSecret(data.clientSecret);
  }

  return (
    <div className="rounded-2xl glass p-6 shadow-lg ring-1 ring-primary/5">
      <h3 className="text-xl font-semibold">Donate Money (INR)</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Support operations. Real payments in Indian Rupees via Stripe.
      </p>
      {!stripePk && (
        <div className="mt-4 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          Stripe not configured. Set STRIPE_SECRET_KEY and
          VITE_STRIPE_PUBLISHABLE_KEY.
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Amount (INR)</label>
          <input
            type="number"
            min={50}
            step={50}
            className="w-full rounded-md border bg-background px-3 py-2"
            value={amountInr}
            onChange={(e) => setAmountInr(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={initialize}
            className="rounded-md px-5 py-2.5 btn-gradient"
          >
            Create Payment
          </button>
        </div>
      </div>
      {clientSecret && stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: "stripe" } }}
        >
          <PaymentInner onStatus={(s) => setStatus(s)} />
        </Elements>
      )}
      {status && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}

export default function DonatePage() {
  const userStr = localStorage.getItem("fb_user");
  const role = userStr ? JSON.parse(userStr)?.role : null;
  const allowed = role === "user" || !role; // show for guests and users
  return (
    <Layout>
      <section className="container py-16 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-amber-100/60 to-emerald-100/60 dark:from-transparent dark:to-transparent" />
        <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
          Donate
        </h1>
        <p className="mt-2 text-muted-foreground">
          Contribute surplus food or donate in Indian Rupees to support
          Plateful.
        </p>
        {allowed ? (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <FoodDonationForm />
            <MoneyDonationINR />
          </div>
        ) : (
          <div className="mt-8 rounded-2xl glass p-8 shadow-lg ring-1 ring-primary/5">
            <h3 className="text-xl font-semibold">
              Donations are for User accounts
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please sign in as a User to donate food or funds.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
