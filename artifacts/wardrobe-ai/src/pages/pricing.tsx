import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, Sparkles, Star } from "lucide-react";
import { useGetStripePlans, useCreateCheckoutSession } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function Pricing() {
  const { data: plans, isLoading: plansLoading } = useGetStripePlans();
  const createCheckoutSession = useCreateCheckoutSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const handleUpgrade = async (priceId: string) => {
    try {
      const result = await createCheckoutSession.mutateAsync({ data: { priceId } });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    }
  };

  // Find actual prices from Stripe or fallback
  const plusPlan = plans?.find(p => p.metadata?.plan === 'plus');
  const lifetimePlan = plans?.find(p => p.metadata?.plan === 'lifetime');

  const monthlyPrice = plusPlan?.prices?.find(p => p.metadata?.billing === 'monthly')?.id || "price_dummy_monthly";
  const yearlyPrice = plusPlan?.prices?.find(p => p.metadata?.billing === 'yearly')?.id || "price_dummy_yearly";
  const lifetimePrice = lifetimePlan?.prices?.find(p => p.metadata?.billing === 'lifetime')?.id || "price_dummy_lifetime";

  const monthlyAmount = plusPlan?.prices?.find(p => p.metadata?.billing === 'monthly')?.unit_amount ? (plusPlan.prices.find(p => p.metadata?.billing === 'monthly')!.unit_amount / 100) : 4.99;
  const yearlyAmount = plusPlan?.prices?.find(p => p.metadata?.billing === 'yearly')?.unit_amount ? (plusPlan.prices.find(p => p.metadata?.billing === 'yearly')!.unit_amount / 100) : 39.99;
  const lifetimeAmount = lifetimePlan?.prices?.find(p => p.metadata?.billing === 'lifetime')?.unit_amount ? (lifetimePlan.prices.find(p => p.metadata?.billing === 'lifetime')!.unit_amount / 100) : 49.00;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 md:py-20 px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Elevate your personal style
          </h1>
          <p className="text-xl text-muted-foreground">
            Get dressed in 5 seconds. Unlock unlimited items and our most advanced AI stylist features.
          </p>
          
          <div className="flex items-center justify-center gap-3 mt-10">
            <span className={cn("text-sm font-medium transition-colors", billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
            <Switch
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
              className="data-[state=checked]:bg-primary"
            />
            <span className={cn("text-sm font-medium transition-colors", billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground")}>
              Yearly <span className="text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-full ml-1">Save 33%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {/* Free Tier */}
          <div className="bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col">
            <div className="mb-8">
              <h3 className="text-2xl font-serif font-semibold mb-2">Free</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">$0</span>
              </div>
              <p className="text-muted-foreground">Perfect for getting started with Wardrobe AI.</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <FeatureItem>Up to 50 clothing items</FeatureItem>
              <FeatureItem>Basic AI outfit recommendations</FeatureItem>
              <FeatureItem>Weather suggestions</FeatureItem>
              <FeatureItem>Outfit history</FeatureItem>
            </ul>
            
            <Button variant="outline" className="w-full rounded-xl" disabled>
              Current Plan
            </Button>
          </div>

          {/* Plus Tier */}
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-xl relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-foreground text-background px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Star className="w-4 h-4" /> Most Popular
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-serif font-semibold mb-2">Plus</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">${billingCycle === "yearly" ? yearlyAmount : monthlyAmount}</span>
                <span className="text-primary-foreground/70">/{billingCycle === "yearly" ? "yr" : "mo"}</span>
              </div>
              <p className="text-primary-foreground/80">Everything you need to dress beautifully every day.</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1 text-primary-foreground/90">
              <FeatureItem iconColor="text-primary-foreground">Unlimited items</FeatureItem>
              <FeatureItem iconColor="text-primary-foreground">Advanced AI stylist</FeatureItem>
              <FeatureItem iconColor="text-primary-foreground">Occasion-specific outfits</FeatureItem>
              <FeatureItem iconColor="text-primary-foreground">Smart packing lists</FeatureItem>
              <FeatureItem iconColor="text-primary-foreground">Priority AI processing</FeatureItem>
            </ul>
            
            <Button 
              className="w-full rounded-xl bg-background text-foreground hover:bg-background/90"
              onClick={() => handleUpgrade(billingCycle === "yearly" ? yearlyPrice : monthlyPrice)}
              disabled={createCheckoutSession.isPending}
            >
              {createCheckoutSession.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Upgrade to Plus
            </Button>
          </div>

          {/* Founder's Lifetime Tier */}
          <div className="bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-3 py-1 rounded-bl-xl text-xs font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" /> Early Adopter
            </div>
            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-serif font-semibold mb-2 flex items-center gap-2">
                Founder's
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">${lifetimeAmount}</span>
              </div>
              <p className="text-muted-foreground">Pay once, enjoy Plus features forever.</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1 relative z-10">
              <FeatureItem>All Plus features included</FeatureItem>
              <FeatureItem>One-time payment</FeatureItem>
              <FeatureItem>Early access to new features</FeatureItem>
              <FeatureItem>Exclusive founder's badge</FeatureItem>
            </ul>
            
            <Button 
              variant="outline" 
              className="w-full rounded-xl border-primary text-primary hover:bg-primary/5 relative z-10"
              onClick={() => handleUpgrade(lifetimePrice)}
              disabled={createCheckoutSession.isPending}
            >
              {createCheckoutSession.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Get Lifetime Access
            </Button>
            
            {/* Decorative background element */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        {/* Feature Comparison Table */}
        <div className="mt-20 border-t border-border pt-16">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-6 border-b border-border font-medium text-muted-foreground">Features</th>
                  <th className="py-4 px-6 border-b border-border font-serif text-lg text-center">Free</th>
                  <th className="py-4 px-6 border-b border-border font-serif text-lg text-center text-primary">Plus</th>
                  <th className="py-4 px-6 border-b border-border font-serif text-lg text-center">Founder's</th>
                </tr>
              </thead>
              <tbody>
                <TableRow feature="Clothing items" free="Up to 50" plus="Unlimited" founder="Unlimited" />
                <TableRow feature="AI Outfit Recommendations" free="Basic" plus="Advanced" founder="Advanced" />
                <TableRow feature="Occasion Filters" free="-" plus={<Check className="w-5 h-5 text-primary mx-auto" />} founder={<Check className="w-5 h-5 text-primary mx-auto" />} />
                <TableRow feature="Weather Suggestions" free={<Check className="w-5 h-5 text-primary mx-auto" />} plus={<Check className="w-5 h-5 text-primary mx-auto" />} founder={<Check className="w-5 h-5 text-primary mx-auto" />} />
                <TableRow feature="Smart Packing Lists" free="-" plus={<Check className="w-5 h-5 text-primary mx-auto" />} founder={<Check className="w-5 h-5 text-primary mx-auto" />} />
                <TableRow feature="Priority AI Processing" free="-" plus={<Check className="w-5 h-5 text-primary mx-auto" />} founder={<Check className="w-5 h-5 text-primary mx-auto" />} />
                <TableRow feature="Early Access to Features" free="-" freeColor="" plus="-" founder={<Check className="w-5 h-5 text-primary mx-auto" />} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FeatureItem({ children, iconColor = "text-primary" }: { children: React.ReactNode, iconColor?: string }) {
  return (
    <li className="flex items-start gap-3">
      <Check className={cn("w-5 h-5 shrink-0 mt-0.5", iconColor)} />
      <span>{children}</span>
    </li>
  );
}

function TableRow({ feature, free, plus, founder, freeColor = "text-muted-foreground" }: { feature: string, free: React.ReactNode, plus: React.ReactNode, founder: React.ReactNode, freeColor?: string }) {
  return (
    <tr>
      <td className="py-4 px-6 border-b border-border/50 font-medium">{feature}</td>
      <td className={cn("py-4 px-6 border-b border-border/50 text-center", freeColor)}>{free}</td>
      <td className="py-4 px-6 border-b border-border/50 text-center font-medium">{plus}</td>
      <td className="py-4 px-6 border-b border-border/50 text-center font-medium">{founder}</td>
    </tr>
  );
}
