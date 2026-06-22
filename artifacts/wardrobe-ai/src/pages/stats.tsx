import { useGetWardrobeStats } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Loader2, PieChart, Tag, Layers, Thermometer } from "lucide-react";

export default function Stats() {
  const { data: stats, isLoading } = useGetWardrobeStats();

  return (
    <Layout>
      <div className="mb-10">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
          Wardrobe Analytics
        </h1>
        <p className="text-muted-foreground text-lg">
          Insights into your personal collection.
        </p>
      </div>

      {isLoading || !stats ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <div className="grid gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pieces</p>
                <p className="text-4xl font-serif font-bold text-foreground mt-1">{stats.totalItems}</p>
              </div>
            </div>
            {/* More stats summary could go here */}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <StatsCard title="By Category" data={stats.byCategory} icon={Tag} />
            <StatsCard title="By Color" data={stats.byColor} icon={PieChart} />
            <StatsCard title="By Season" data={stats.bySeason} icon={Thermometer} />
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatsCard({ title, data, icon: Icon }: { title: string, data: Record<string, number>, icon: any }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(e => e[1]), 1);

  return (
    <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-serif text-xl font-medium">{title}</h3>
      </div>
      
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data available</p>
      ) : (
        <div className="space-y-4">
          {entries.map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="capitalize font-medium text-foreground">{key || "Unknown"}</span>
                <span className="text-muted-foreground">{value} items</span>
              </div>
              <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/80 rounded-full" 
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
