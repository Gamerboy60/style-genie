import { Link, useLocation } from "wouter";
import { Shirt, Sparkles, LayoutGrid, BarChart2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Wardrobe", icon: Shirt },
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
      </nav>

      <main className="flex-1 overflow-auto bg-background/50">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
