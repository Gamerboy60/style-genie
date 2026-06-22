import { useListClothingItems, useDeleteClothingItem, getListClothingItemsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ClothingCard } from "@/components/clothing-card";
import { UploadDialog } from "@/components/upload-dialog";
import { Loader2, Shirt } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Wardrobe() {
  const { data: items, isLoading } = useListClothingItems();
  const deleteItem = useDeleteClothingItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      await deleteItem.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListClothingItemsQueryKey() });
      toast({ title: "Item deleted" });
    } catch (e) {
      toast({ title: "Failed to delete item", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
            My Wardrobe
          </h1>
          <p className="text-muted-foreground text-lg">
            Your curated collection, ready to wear.
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
