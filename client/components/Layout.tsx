import { Link, NavLink } from "react-router-dom";
import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/donate", label: "Donate" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/login", label: "Login" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/notifications", label: "Notifications" },
];

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-emerald-50/30 dark:from-[hsl(24_50%_7%)] dark:to-[hsl(152_35%_10%)] text-foreground flex flex-col">
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
