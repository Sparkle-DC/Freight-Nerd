export interface HsCodeSuggestion {
  code: string;
  description: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  dutyRate: number;
  vatRate: number;
}

export interface LandedCostEstimate {
  productValue: number;
  shippingCost: number;
  hsCode: string;
  dutyRate: number;
  vatRate: number;
  totalDuty: number;
  totalVat: number;
  landedCost: number;
}

// Mock HS Code lookup
export const suggestHsCode = async (description: string, origin: string, destination: string): Promise<HsCodeSuggestion[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('headphone') || lowerDesc.includes('audio')) {
    return [
      { code: '8518.30', description: 'Headphones and earphones', confidence: 'HIGH', dutyRate: 5.0, vatRate: 20.0 },
      { code: '8518.29', description: 'Loudspeakers', confidence: 'LOW', dutyRate: 2.5, vatRate: 20.0 }
    ];
  }

  if (lowerDesc.includes('shirt') || lowerDesc.includes('clothing') || lowerDesc.includes('apparel')) {
    return [
      { code: '6109.10', description: 'T-shirts, singlets and other vests, of cotton', confidence: 'HIGH', dutyRate: 16.5, vatRate: 20.0 },
      { code: '6205.20', description: 'Men\'s or boys\' shirts of cotton', confidence: 'MEDIUM', dutyRate: 12.0, vatRate: 20.0 }
    ];
  }

  if (lowerDesc.includes('laptop') || lowerDesc.includes('computer')) {
    return [
      { code: '8471.30', description: 'Portable automatic data processing machines', confidence: 'HIGH', dutyRate: 0.0, vatRate: 20.0 },
      { code: '8471.41', description: 'Other automatic data processing machines', confidence: 'MEDIUM', dutyRate: 0.0, vatRate: 20.0 }
    ];
  }

  // Default fallback
  return [
    { code: '3926.90', description: 'Other articles of plastics', confidence: 'LOW', dutyRate: 6.5, vatRate: 20.0 },
    { code: '9503.00', description: 'Tricycles, scooters, pedal cars and similar toys', confidence: 'LOW', dutyRate: 0.0, vatRate: 20.0 }
  ];
};

export const calculateLandedCost = (
  productValue: number,
  shippingCost: number,
  dutyRate: number,
  vatRate: number,
  hsCode: string
): LandedCostEstimate => {
  // Duty is usually calculated on the product value (FOB) or product + shipping (CIF) depending on the country.
  // For this generic MVP, we'll assume CIF (Cost, Insurance, Freight) for VAT, and FOB for Duty to show different calculations.
  // Actually, let's do standard CIF for both to keep it simple and conservative.
  const customsValue = productValue + shippingCost;
  
  const totalDuty = customsValue * (dutyRate / 100);
  
  // VAT is usually calculated on (Customs Value + Duty)
  const valueForVat = customsValue + totalDuty;
  const totalVat = valueForVat * (vatRate / 100);

  const landedCost = customsValue + totalDuty + totalVat;

  return {
    productValue,
    shippingCost,
    hsCode,
    dutyRate,
    vatRate,
    totalDuty,
    totalVat,
    landedCost
  };
};
