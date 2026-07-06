import { Link } from "wouter";
import { Sparkles, Shirt, Wand2, BarChart2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Wardrobe AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-foreground/70 hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Personal Stylist
        </div>

        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-foreground max-w-3xl leading-tight mb-6">
          Your wardrobe,{" "}
          <span className="text-primary">reimagined</span>
        </h1>

        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          Upload your clothes, let AI analyze them, and get personalized outfit suggestions every day. Build your digital closet in minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/sign-up">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base gap-2">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border">
              Sign in to your wardrobe
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            {
              icon: Shirt,
              title: "Digital Wardrobe",
              desc: "Upload photos of your clothes to build a complete digital closet.",
            },
            {
              icon: Wand2,
              title: "AI Analysis",
              desc: "AI tags each piece with color, style, occasion, and season automatically.",
            },
            {
              icon: BarChart2,
              title: "Smart Outfits",
              desc: "Get AI-generated outfit suggestions tailored to your mood and the weather.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-card border border-border/60 rounded-2xl p-6 text-left"
            >
              <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-muted-foreground/60 text-sm border-t border-border/40">
        © {new Date().getFullYear()} Wardrobe AI — Your personal AI stylist
      </footer>
    </div>
  );
}
