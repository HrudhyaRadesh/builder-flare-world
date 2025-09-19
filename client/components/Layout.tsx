import { Link, NavLink } from "react-router-dom";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const BASE_NAV = [
  { to: "/", label: "Home", key: "home" },
  { to: "/donate", label: "Donate", key: "donate" },
  { to: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
  { to: "/analytics", label: "Analytics", key: "analytics" },
  { to: "/login", label: "Login", key: "login" },
  { to: "/dashboard", label: "Dashboard", key: "dashboard" },
  { to: "/notifications", label: "Notifications", key: "notifications" },
];

export default function Layout({ children }: PropsWithChildren) {
  const [role, setRole] = useState<"user" | "ngo" | "admin" | null>(null);

  useEffect(() => {
    function read() {
      try {
        const u = localStorage.getItem("fb_user");
        if (!u) return setRole(null);
        const parsed = JSON.parse(u);
        setRole(parsed?.role ?? null);
      } catch {
        setRole(null);
      }
    }
    read();
    const onAuth = () => read();
    window.addEventListener("auth-changed", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("auth-changed", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  const navItems = useMemo(() => {
    return BASE_NAV.filter((item) => {
      if (item.key === "donate" && role && role !== "user") return false;
      return true;
    });
  }, [role]);

  return (
    <div className="relative min-h-screen mesh-bg text-foreground flex flex-col">
      <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-50" style={{ backgroundImage: "url(https://images.pexels.com/photos/31095001/pexels-photo-31095001.jpeg)" }} />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 mix-blend-multiply vignette" />
      <header className="sticky top-0 z-40 border-b supports-[backdrop-filter]:backdrop-blur bg-background/70">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-xl">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">🍚</span>
            <span className="tracking-tight">Plateful</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium hover:text-primary transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full",
                    isActive ? "text-primary after:w-full" : "text-foreground/70",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Plateful · Hunger & Food Security</p>
          <div className="flex gap-6">
            <a className="hover:text-foreground" href="#">Privacy</a>
            <a className="hover:text-foreground" href="#">Terms</a>
            <a className="hover:text-foreground" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
