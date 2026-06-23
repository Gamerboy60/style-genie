import { useState } from "react";
import { useListClothingItems, useDeleteClothingItem, getListClothingItemsQueryKey, useGenerateOutfit } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ClothingCard } from "@/components/clothing-card";
import { UploadDialog } from "@/components/upload-dialog";
import { Loader2, Shirt, Sparkles, Crown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

export default function Wardrobe() {
  const { data: items, isLoading } = useListClothingItems();
  const deleteItem = useDeleteClothingItem();
  const generateOutfit = useGenerateOutfit();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [occasion, setOccasion] = useState<string>("casual");
  const [weather, setWeather] = useState<string>("warm");

  const handleDelete = async (id: number) => {
    try {
      await deleteItem.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListClothingItemsQueryKey() });
      toast({ title: "Item deleted" });
    } catch (e) {
      toast({ title: "Failed to delete item", variant: "destructive" });
    }
  };

  const handleGenerate = async () => {
    try {
      await generateOutfit.mutateAsync({ data: { occasion, weather, count: 1 } });
    } catch (e) {
      toast({ title: "Failed to generate outfit", variant: "destructive" });
    }
  };

  const generatedOutfit = generateOutfit.data?.[0];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-card rounded-3xl p-8 md:p-12 border border-border shadow-sm mb-12 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-start max-w-3xl">
          <div className="flex items-center gap-2 mb-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" /> AI Stylist
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            What should I wear today?
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Tell us the vibe and weather, and we'll assemble the perfect look in seconds.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mb-8 w-full">
            <div className="w-full sm:w-48">
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger>
                  <SelectValue placeholder="Occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger>
                  <SelectValue placeholder="Weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cool">Cool</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              size="lg" 
              onClick={handleGenerate}
              disabled={generateOutfit.isPending || (items && items.length === 0)}
              className="w-full sm:w-auto"
            >
              {generateOutfit.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Get Outfit
            </Button>
          </div>

          {/* Generated Result */}
          {generatedOutfit && (
            <div className="w-full mt-6 bg-background rounded-2xl p-6 border border-border">
              <p className="text-lg font-medium mb-6 font-serif">
                {generatedOutfit.reasoning || "Here is your perfect outfit for the day."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {generatedOutfit.items?.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-secondary border border-border">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </div>

      {/* Upgrade Banner */}
      {items && items.length >= 15 && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-background p-3 rounded-full shadow-sm">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">You've reached the 15-item limit on the Free plan</h3>
              <p className="text-muted-foreground">Upgrade to Plus for unlimited items, advanced styling, and packing lists.</p>
            </div>
          </div>
          <Link href="/pricing" className="shrink-0">
            <Button variant="default" className="shadow-md">
              Upgrade to Plus
            </Button>
          </Link>
        </div>
      )}

      {/* Wardrobe Grid */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground mb-2">
            My Wardrobe
          </h2>
          <p className="text-muted-foreground">
            {items?.length || 0} {items?.length === 1 ? 'item' : 'items'} in your collection.
          </p>
        </div>
        <UploadDialog />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-card border border-border/50 border-dashed rounded-3xl">
          <div className="bg-secondary p-4 rounded-full mb-4">
            <Shirt className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-serif font-medium mb-2">Your closet is empty</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Add your first piece of clothing to start building your personal style profile.
          </p>
          <UploadDialog />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.map((item, i) => (
            <div 
              key={item.id} 
              className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <ClothingCard 
                item={item} 
                onDelete={handleDelete}
                isDeleting={deleteItem.isPending && deleteItem.variables?.id === item.id}
              />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}