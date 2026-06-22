import { useState } from "react";
import { 
  useListOutfits, 
  useGenerateOutfit, 
  useCreateOutfit, 
  useDeleteOutfit,
  getListOutfitsQueryKey,
  OutfitSuggestion,
  ClothingItem
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Bookmark, Trash2, CalendarDays } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Outfits() {
  const { data: savedOutfits, isLoading } = useListOutfits();
  const generateMutation = useGenerateOutfit();
  const createMutation = useCreateOutfit();
  const deleteMutation = useDeleteOutfit();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [occasion, setOccasion] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [weather, setWeather] = useState<string>("");
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        data: {
          occasion: occasion || undefined,
          mood: mood || undefined,
          weather: weather || undefined,
          count: 3
        }
      });
      setSuggestions(result || []);
      toast({ title: "Generated new looks", description: "AI has created some outfits for you." });
    } catch (e) {
      toast({ title: "Failed to generate outfits", variant: "destructive" });
    }
  };

  const handleSave = async (suggestion: OutfitSuggestion) => {
    try {
      await createMutation.mutateAsync({
        data: {
          name: `${suggestion.style} Look`,
          occasion: suggestion.occasion,
          notes: suggestion.reasoning,
          clothingItemIds: suggestion.clothingItems.map(i => i.id)
        }
      });
      queryClient.invalidateQueries({ queryKey: getListOutfitsQueryKey() });
      toast({ title: "Outfit saved!" });
    } catch (e) {
      toast({ title: "Failed to save outfit", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListOutfitsQueryKey() });
      toast({ title: "Outfit deleted" });
    } catch (e) {
      toast({ title: "Failed to delete outfit", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
            Looks & Outfits
          </h1>
          <p className="text-muted-foreground text-lg">
            Curated combinations for every moment.
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg gap-2 px-6">
              <Sparkles className="w-4 h-4" />
              Generate New Looks
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <Sparkles className="text-primary w-5 h-5" />
                Ask your AI Stylist
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label>Occasion</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger className="bg-secondary/20 border-border/50">
                    <SelectValue placeholder="Where are you going?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual / Everyday</SelectItem>
                    <SelectItem value="work">Work / Office</SelectItem>
                    <SelectItem value="formal">Formal / Event</SelectItem>
                    <SelectItem value="date">Date Night</SelectItem>
                    <SelectItem value="sport">Active / Sport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weather</Label>
                <Select value={weather} onValueChange={setWeather}>
                  <SelectTrigger className="bg-secondary/20 border-border/50">
                    <SelectValue placeholder="What's the weather like?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mood / Vibe</Label>
                <Input 
                  placeholder="e.g. cozy, edgy, minimalist, bold..." 
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="bg-secondary/20 border-border/50"
                />
              </div>
              
              <Button 
                onClick={handleGenerate} 
                className="w-full mt-4 bg-primary text-primary-foreground shadow-lg"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                Create Magic
              </Button>
            </div>
            
            {suggestions.length > 0 && (
              <div className="mt-4 space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                <h3 className="font-serif text-lg font-medium border-b border-border/50 pb-2">Suggestions</h3>
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-foreground capitalize">{s.style} Look</h4>
                        <p className="text-xs text-muted-foreground capitalize">{s.occasion}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 gap-1.5 rounded-full"
                        onClick={() => handleSave(s)}
                        disabled={createMutation.isPending}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        Save
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed bg-secondary/30 p-3 rounded-xl italic">
                      "{s.reasoning}"
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {s.clothingItems.map(item => (
                        <div key={item.id} className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-secondary/30 border border-border/50">
                          <img src={item.imagePath ? `/api/storage${item.imagePath}` : item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : !savedOutfits || savedOutfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 bg-card border border-border/50 border-dashed rounded-3xl">
          <div className="bg-secondary p-4 rounded-full mb-4">
            <CalendarDays className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-serif font-medium mb-2">No saved looks yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Generate some outfits using the AI stylist and save your favorites here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedOutfits.map((outfit) => (
            <div key={outfit.id} className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
              <div className="p-6 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground mb-1">{outfit.name}</h3>
                  {outfit.occasion && (
                    <span className="text-xs font-medium px-2.5 py-1 bg-secondary/50 text-secondary-foreground rounded-full capitalize">
                      {outfit.occasion}
                    </span>
                  )}
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(outfit.id)}
                  disabled={deleteMutation.isPending && deleteMutation.variables?.id === outfit.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {outfit.notes && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground italic line-clamp-2">
                    "{outfit.notes}"
                  </p>
                </div>
              )}
              
              <div className="bg-secondary/20 p-6 flex gap-3 overflow-x-auto border-t border-border/50 items-center">
                {outfit.clothingItems?.map((item, i) => (
                  <div key={item.id} className="flex items-center">
                    <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-background shadow-sm border border-border/50">
                      <img src={item.imagePath ? `/api/storage${item.imagePath}` : item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    {i < (outfit.clothingItems?.length || 0) - 1 && (
                      <div className="mx-3 text-muted-foreground/30 font-medium">+</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
