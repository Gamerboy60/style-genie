import { useListClothingItems, useAnalyzeClothingItem, getListClothingItemsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ClothingCard } from "@/components/clothing-card";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Analyze() {
  const { data: items, isLoading } = useListClothingItems();
  const analyzeMutation = useAnalyzeClothingItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  const pendingItems = items?.filter(item => !item.analyzed) || [];
  const analyzedItems = items?.filter(item => item.analyzed) || [];

  const handleAnalyze = async (id: number) => {
    try {
      setAnalyzingId(id);
      await analyzeMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListClothingItemsQueryKey() });
      toast({ title: "Analysis complete", description: "AI has tagged your item." });
    } catch (e) {
      toast({ title: "Analysis failed", variant: "destructive" });
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <Layout>
      <div className="mb-10">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
          AI Stylist Studio
        </h1>
        <p className="text-muted-foreground text-lg">
          Let the AI analyze your pieces to build better outfits.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-2xl font-medium">Pending Analysis</h2>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                {pendingItems.length}
              </span>
            </div>

            {pendingItems.length === 0 ? (
              <div className="text-center p-12 bg-secondary/20 rounded-3xl border border-border/50">
                <p className="text-muted-foreground font-medium">All your clothes are fully analyzed!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-secondary/30">
                      <img 
                        src={item.imagePath ? `/api/storage${item.imagePath}` : item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-medium text-foreground line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAnalyze(item.id)}
                        disabled={analyzingId === item.id}
                        className="w-full gap-2 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                      >
                        {analyzingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                        Analyze Piece
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
              <h2 className="font-serif text-2xl font-medium">Recently Analyzed</h2>
            </div>
            
            {analyzedItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items analyzed yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {analyzedItems.slice(0, 5).map((item) => (
                  <ClothingCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Layout>
  );
}
