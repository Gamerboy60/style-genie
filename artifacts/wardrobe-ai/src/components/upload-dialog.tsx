import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useCreateClothingItem, getListClothingItemsQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ImagePlus, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createItem = useCreateClothingItem();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
    }
  };

  const handleUpload = async () => {
    if (!file || !name || !category) return;

    try {
      setIsUploading(true);

      // 1. Upload file directly through our server (avoids GCS CORS issues)
      // Get Clerk Bearer token so the request works cross-origin (Vercel→Replit)
      // without relying on session cookies, which are domain-scoped.
      const token = await getToken();
      const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";
      const uploadRes = await fetch(`${apiBase}/api/storage/uploads`, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Upload failed (HTTP ${uploadRes.status})`);
      }

      const { objectPath } = await uploadRes.json() as { objectPath: string };

      // 2. Create clothing item record
      await createItem.mutateAsync({
        data: {
          name,
          category,
          imageUrl: "",
          imagePath: objectPath,
        },
      });

      queryClient.invalidateQueries({ queryKey: getListClothingItemsQueryKey() });
      toast({ title: "Item added to wardrobe", description: "It will be analyzed shortly." });

      setOpen(false);
      setFile(null);
      setPreview(null);
      setName("");
      setCategory("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "There was a problem uploading your item.";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-lg gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add to Wardrobe</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-2">
            <Label>Photo</Label>
            <div className="relative aspect-square sm:aspect-video rounded-xl border-2 border-dashed border-muted-foreground/25 bg-secondary/20 flex items-center justify-center overflow-hidden hover:bg-secondary/40 transition-colors">
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <span className="font-medium text-sm">Change Photo</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-2 text-muted-foreground">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                  <span className="font-medium">Click to upload photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">What is it?</Label>
              <Input 
                id="name" 
                placeholder="e.g. Camel Wool Coat" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="bg-secondary/20 border-border/50 focus-visible:ring-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary/20 border-border/50">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="outerwear">Outerwear</SelectItem>
                  <SelectItem value="dress">Dress</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                  <SelectItem value="accessory">Accessory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleUpload} 
            disabled={!file || !name || !category || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save to Wardrobe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
