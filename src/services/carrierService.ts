export interface CarrierData {
  mcNumber: string;
  dotNumber?: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  authorityAgeDays: number;
  insuranceStatus: 'Active' | 'Recently Updated' | 'Lapsed' | 'Pending';
  safetyRating: 'Satisfactory' | 'Conditional' | 'Unsatisfactory' | 'Not Rated';
  inspectionCount: number;
}

export interface RiskAnalysis {
  score: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: string[];
}

export const analyzeCarrierRisk = (carrier: CarrierData): RiskAnalysis => {
  const signals: string[] = [];
  let score: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  if (carrier.status !== 'ACTIVE') {
    signals.push(`Authority status is ${carrier.status}`);
    score = 'HIGH';
  }

  if (carrier.authorityAgeDays < 90) {
    signals.push(`Authority is less than 90 days old (${carrier.authorityAgeDays} days) - High fraud risk`);
    score = 'HIGH';
  } else if (carrier.authorityAgeDays < 180) {
    signals.push(`Authority is relatively new (${carrier.authorityAgeDays} days)`);
    if (score !== 'HIGH') score = 'MEDIUM';
  }

  if (carrier.insuranceStatus === 'Lapsed' || carrier.insuranceStatus === 'Pending') {
    signals.push(`Insurance status is ${carrier.insuranceStatus}`);
    score = 'HIGH';
  } else if (carrier.insuranceStatus === 'Recently Updated') {
    signals.push('Insurance was recently updated (verify coverage details)');
    if (score !== 'HIGH') score = 'MEDIUM';
  }

  if (carrier.safetyRating === 'Unsatisfactory' || carrier.safetyRating === 'Conditional') {
    signals.push(`Safety rating is ${carrier.safetyRating}`);
    score = 'HIGH';
  }

  if (carrier.inspectionCount === 0 && carrier.authorityAgeDays > 30) {
    signals.push('No inspection history found despite active authority');
    score = 'HIGH';
  } else if (carrier.inspectionCount < 3 && carrier.authorityAgeDays > 180) {
    signals.push('Low inspection count for authority age');
    if (score !== 'HIGH') score = 'MEDIUM';
  }

  return { score, signals };
};

// Mock FMCSA/SAFER lookup
export const lookupCarrier = async (query: string): Promise<CarrierData | null> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const cleanQuery = query.trim().toUpperCase();
  if (!cleanQuery) return null;

  // Deterministic mock data generation based on input
  
  // HIGH RISK mock (e.g. MC starts with 1)
  if (cleanQuery.startsWith('1') || cleanQuery.includes('FRAUD') || cleanQuery.includes('NEW')) {
    return {
      mcNumber: cleanQuery.replace(/\D/g, '') || '1492011',
      dotNumber: '3920112',
      name: cleanQuery.includes('FRAUD') ? cleanQuery : 'NEXUS FREIGHT LLC',
      status: 'ACTIVE',
      authorityAgeDays: 45,
      insuranceStatus: 'Recently Updated',
      safetyRating: 'Not Rated',
      inspectionCount: 0
    };
  }

  // MEDIUM RISK mock (e.g. MC starts with 5)
  if (cleanQuery.startsWith('5') || cleanQuery.includes('MID')) {
    return {
      mcNumber: cleanQuery.replace(/\D/g, '') || '592811',
      dotNumber: '1928112',
      name: 'MIDWEST TRANSIT INC',
      status: 'ACTIVE',
      authorityAgeDays: 120,
      insuranceStatus: 'Active',
      safetyRating: 'Conditional',
      inspectionCount: 12
    };
  }

  // LOW RISK mock (Default)
  return {
    mcNumber: cleanQuery.replace(/\D/g, '') || '992011',
    dotNumber: '2920112',
    name: cleanQuery.replace(/\d/g, '').trim() || 'RELIABLE CARRIERS CORP',
    status: 'ACTIVE',
    authorityAgeDays: 1450,
    insuranceStatus: 'Active',
    safetyRating: 'Satisfactory',
    inspectionCount: 145
  };
};
