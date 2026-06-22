import { ClothingItem } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClothingCardProps {
  item: ClothingItem;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
}

export function ClothingCard({ item, onDelete, isDeleting }: ClothingCardProps) {
  const imageUrl = item.imagePath 
    ? `/api/storage${item.imagePath}` 
    : item.imageUrl;

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card hover-elevate transition-all duration-500 shadow-sm hover:shadow-xl">
      <div className="aspect-[3/4] overflow-hidden bg-secondary/30 relative">
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {!item.analyzed && (
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm border border-border/50">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Pending Analysis
          </div>
        )}
        
        {onDelete && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                onDelete(item.id);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div>
          <h3 className="font-serif text-lg font-medium line-clamp-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">
            {item.category} {item.brand ? `• ${item.brand}` : ""}
          </p>
        </div>

        {item.analyzed ? (
          <div className="flex flex-wrap gap-1.5">
            {item.color && (
              <Badge variant="secondary" className="bg-secondary/50 font-normal">
                {item.color}
              </Badge>
            )}
            {item.style && (
              <Badge variant="secondary" className="bg-secondary/50 font-normal">
                {item.style}
              </Badge>
            )}
            {item.season && (
              <Badge variant="secondary" className="bg-secondary/50 font-normal">
                {item.season}
              </Badge>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary/60" />
            <span>AI will assign tags shortly</span>
          </div>
        )}
      </div>
    </div>
  );
}
