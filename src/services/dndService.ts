export interface DnDAuditResult {
  containerNumber: string;
  availabilityDate: string;
  pickupDate: string;
  freeTimeDays: number;
  billedDays: number;
  dailyRate: number;
  totalBilled: number;
  isValid: boolean;
  estimatedOvercharge: number;
  issues: string[];
}

export const auditInvoice = (
  containerNumber: string,
  availabilityDateStr: string,
  pickupDateStr: string,
  freeTimeDays: number,
  billedDays: number,
  dailyRate: number,
  totalBilled: number
): DnDAuditResult => {
  const issues: string[] = [];
  let estimatedOvercharge = 0;

  const availabilityDate = new Date(availabilityDateStr);
  const pickupDate = new Date(pickupDateStr);

  // 1. Calculate actual days between availability and pickup
  // Add 1 because both availability day and pickup day usually count, or depends on terminal.
  // Let's assume standard: difference in days + 1
  const diffTime = Math.abs(pickupDate.getTime() - availabilityDate.getTime());
  const actualDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // 2. Calculate expected chargeable days
  const expectedChargeableDays = Math.max(0, actualDays - freeTimeDays);

  // 3. Check for weekends (Terminal closures)
  // Simple check: count weekends between availability and pickup
  let weekendDays = 0;
  let currentDate = new Date(availabilityDate);
  while (currentDate <= pickupDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 4. Audit Checks
  if (billedDays > expectedChargeableDays) {
    issues.push(`Free Time Error: Billed days (${billedDays}) exceeds expected chargeable days (${expectedChargeableDays}) based on dates provided.`);
  }

  if (weekendDays > 0 && billedDays > 0) {
    issues.push(`Terminal Closure: Chargeable period includes ${weekendDays} weekend day(s) which may be exempt depending on terminal rules.`);
  }

  const expectedTotal = billedDays * dailyRate;
  if (totalBilled > expectedTotal) {
    issues.push(`Math Error: Total billed ($${totalBilled}) exceeds expected total ($${expectedTotal}) based on billed days and daily rate.`);
    estimatedOvercharge += (totalBilled - expectedTotal);
  }

  // Calculate overcharge based on days if billed days > expected
  if (billedDays > expectedChargeableDays) {
    const extraDays = billedDays - expectedChargeableDays;
    estimatedOvercharge += (extraDays * dailyRate);
  }

  // If weekends are included, flag potential savings
  if (weekendDays > 0 && billedDays === actualDays - freeTimeDays) {
    // If they billed for weekends, that might be an overcharge
    const potentialWeekendSavings = Math.min(weekendDays, billedDays) * dailyRate;
    if (!issues.some(i => i.includes('Free Time Error'))) {
       estimatedOvercharge += potentialWeekendSavings;
    }
  }

  return {
    containerNumber,
    availabilityDate: availabilityDateStr,
    pickupDate: pickupDateStr,
    freeTimeDays,
    billedDays,
    dailyRate,
    totalBilled,
    isValid: issues.length === 0,
    estimatedOvercharge,
    issues
  };
};
