import { Link, useLocation } from "wouter";
import { Shirt, Sparkles, LayoutGrid, BarChart2, Crown, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const navItems = [
    { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
    { href: "/analyze", label: "Analyze", icon: Sparkles },
    { href: "/outfits", label: "Outfits", icon: LayoutGrid },
    { href: "/stats", label: "Stats", icon: BarChart2 },
    { href: "/pricing", label: "Pricing", icon: Crown },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <nav className="md:w-64 border-r border-border bg-sidebar/50 backdrop-blur-sm p-6 flex flex-col gap-8 shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-sidebar-foreground">
              Wardrobe AI
            </h1>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-100"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:scale-95"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto hidden md:block">
          <div className="border-t border-border/60 pt-4">
            {user && (
              <div className="flex items-center gap-3 px-2 mb-3">
                <div className="bg-primary/10 p-1.5 rounded-full shrink-0">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.firstName ?? "User"}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.firstName ?? user.emailAddresses[0]?.emailAddress?.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground px-2"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto bg-background/50">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
