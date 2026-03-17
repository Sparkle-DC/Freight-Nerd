export interface Provider {
  id: string;
  name: string;
  description: string;
  locations: string[];
  services: string[];
  integrations: string[];
  minVolume: number;
  maxVolume: number;
  specialties: string[];
  logo?: string;
}

export interface MatchRequirements {
  volume: number;
  productType: string;
  avgWeight: string;
  regions: string[];
  platforms: string[];
  specialNeeds: string[];
}

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'p1',
    name: 'ShipBob',
    description: 'Global fulfillment solution built for e-commerce.',
    locations: ['US', 'EU', 'Global'],
    services: ['Pick & Pack', '2-Day Shipping', 'Returns'],
    integrations: ['Shopify', 'BigCommerce', 'WooCommerce'],
    minVolume: 500,
    maxVolume: 100000,
    specialties: ['Apparel', 'Supplements', 'Electronics']
  },
  {
    id: 'p2',
    name: 'Red Stag Fulfillment',
    description: 'Specialized in heavy, bulky, and high-value products.',
    locations: ['US'],
    services: ['Heavy Freight', 'High Value', 'Kitting'],
    integrations: ['Shopify', 'Magento'],
    minVolume: 100,
    maxVolume: 50000,
    specialties: ['Heavy', 'Fragile', 'High Value']
  },
  {
    id: 'p3',
    name: 'ShipMonk',
    description: 'Tech-forward fulfillment for growing brands.',
    locations: ['US', 'EU'],
    services: ['Subscription Boxes', 'Retail Dropshipping'],
    integrations: ['Shopify', 'Amazon', 'Walmart'],
    minVolume: 1000,
    maxVolume: 200000,
    specialties: ['Subscription', 'Apparel']
  },
  {
    id: 'p4',
    name: 'ColdChain Logistics',
    description: 'Temperature-controlled fulfillment for food and bev.',
    locations: ['US'],
    services: ['Cold Storage', 'FDA Approved'],
    integrations: ['Shopify'],
    minVolume: 500,
    maxVolume: 10000,
    specialties: ['Cold Storage', 'Food & Beverage']
  },
  {
    id: 'p5',
    name: 'Global Freight Solutions',
    description: 'Enterprise-grade international forwarding and 3PL.',
    locations: ['Global', 'EU', 'Asia'],
    services: ['B2B', 'Freight Forwarding', 'Customs'],
    integrations: ['NetSuite', 'SAP', 'Amazon'],
    minVolume: 5000,
    maxVolume: 1000000,
    specialties: ['Hazmat', 'B2B']
  }
];

export const matchProviders = (reqs: MatchRequirements): { provider: Provider, score: number }[] => {
  return MOCK_PROVIDERS.map(provider => {
    let score = 0;

    // Volume match
    if (reqs.volume >= provider.minVolume && reqs.volume <= provider.maxVolume) {
      score += 30;
    } else if (reqs.volume < provider.minVolume && reqs.volume >= provider.minVolume * 0.5) {
      score += 10; // Close enough
    }

    // Location match
    const locationMatch = reqs.regions.some(r => provider.locations.includes(r));
    if (locationMatch) score += 25;

    // Integration match
    const integrationMatch = reqs.platforms.some(p => provider.integrations.includes(p));
    if (integrationMatch) score += 20;

    // Specialization / Needs match
    const needsMatch = reqs.specialNeeds.some(n => provider.specialties.includes(n) || provider.services.includes(n));
    if (needsMatch || reqs.specialNeeds.length === 0) score += 25;

    return { provider, score };
  })
  .filter(match => match.score > 40) // Only return decent matches
  .sort((a, b) => b.score - a.score);
};
