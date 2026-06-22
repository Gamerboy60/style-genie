import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Creating Wardrobe AI products in Stripe...');

    // --- Plus Plan ---
    const existingPlus = await stripe.products.search({ query: "name:'Wardrobe AI Plus' AND active:'true'" });
    if (existingPlus.data.length > 0) {
      console.log('Plus Plan already exists:', existingPlus.data[0].id);
    } else {
      const plus = await stripe.products.create({
        name: 'Wardrobe AI Plus',
        description: 'Unlimited wardrobe, advanced AI stylist, occasion outfits, packing lists & more.',
        metadata: { plan: 'plus' },
      });
      const monthly = await stripe.prices.create({
        product: plus.id,
        unit_amount: 499,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { billing: 'monthly' },
      });
      const yearly = await stripe.prices.create({
        product: plus.id,
        unit_amount: 3999,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { billing: 'yearly' },
      });
      console.log(`Created Plus Plan: ${plus.id}`);
      console.log(`  Monthly price: $4.99/mo → ${monthly.id}`);
      console.log(`  Yearly price:  $39.99/yr → ${yearly.id}`);
    }

    // --- Founder's Lifetime Plan ---
    const existingLifetime = await stripe.products.search({ query: "name:\"Wardrobe AI Founder's\" AND active:'true'" });
    if (existingLifetime.data.length > 0) {
      console.log("Founder's Lifetime Plan already exists:", existingLifetime.data[0].id);
    } else {
      const lifetime = await stripe.products.create({
        name: "Wardrobe AI Founder's",
        description: 'One-time payment. All Plus features forever. Early adopters only.',
        metadata: { plan: 'lifetime' },
      });
      const lifetimePrice = await stripe.prices.create({
        product: lifetime.id,
        unit_amount: 4900,
        currency: 'usd',
        metadata: { billing: 'lifetime' },
      });
      console.log(`Created Founder's Lifetime Plan: ${lifetime.id}`);
      console.log(`  One-time price: $49 → ${lifetimePrice.id}`);
    }

    console.log('\nDone! Run the app and webhooks will sync these products to your database.');
  } catch (err: unknown) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

createProducts();
