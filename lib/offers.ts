import type { Tool } from "@/lib/types";

function offerPrice(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export type VerifiedOffer = {
  "@type": "Offer";
  name: string;
  price: string;
  priceCurrency: "USD";
  url?: string;
};

/** Offers only when a free plan or a USD monthly starting price was verified. */
export function verifiedOffers(tool: Tool): VerifiedOffer | VerifiedOffer[] | undefined {
  const url = tool.pricingUrl ?? undefined;
  const offers: VerifiedOffer[] = [];
  if (tool.freeTier === true) {
    offers.push({
      "@type": "Offer",
      name: "Free plan",
      price: "0",
      priceCurrency: "USD",
      ...(url ? { url } : {}),
    });
  }
  if (typeof tool.startingPrice === "number") {
    offers.push({
      "@type": "Offer",
      name: "Starting paid plan",
      price: offerPrice(tool.startingPrice),
      priceCurrency: "USD",
      ...(url ? { url } : {}),
    });
  }
  if (offers.length === 0) return undefined;
  return offers.length === 1 ? offers[0] : offers;
}
