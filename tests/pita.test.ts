import { describe, it, expect } from 'vitest';
import { PITACalculator } from '../src/domain/pita-calculator';

describe('PITACalculator — Nigerian Personal Income Tax & PAYE Engine', () => {
  it('1. should calculate CRA correctly when ₦200,000 is higher than 1% Gross', () => {
    // Gross Income = ₦1,200,000 (120,000,000 Kobo)
    // 1% Gross = ₦12,000 < ₦200,000 -> Fixed Base = ₦200,000 (20,000,000 Kobo)
    // 20% Gross = ₦240,000 (24,000,000 Kobo)
    // Total CRA = ₦440,000 (44,000,000 Kobo)
    const result = PITACalculator.calculate({
      grossAnnualIncomeKobo: 120000000,
      pensionContributionKobo: 0,
      nhfContributionKobo: 0
    });

    expect(result.cra.fixedOrPercentBaseKobo).toBe(20000000);
    expect(result.cra.twentyPercentGrossKobo).toBe(24000000);
    expect(result.cra.totalCRAKobo).toBe(44000000);
    expect(result.taxableIncomeKobo).toBe(76000000); // ₦1,200,000 - ₦440,000 = ₦760,000
  });

  it('2. should calculate CRA correctly when 1% Gross is higher than ₦200,000', () => {
    // Gross Income = ₦30,000,000 (3,000,000,000 Kobo)
    // 1% Gross = ₦300,000 (30,000,000 Kobo) > ₦200,000 -> Base = ₦300,000
    // 20% Gross = ₦6,000,000 (600,000,000 Kobo)
    // Total CRA = ₦6,300,000 (630,000,000 Kobo)
    const result = PITACalculator.calculate({
      grossAnnualIncomeKobo: 3000000000,
      pensionContributionKobo: 0,
      nhfContributionKobo: 0
    });

    expect(result.cra.fixedOrPercentBaseKobo).toBe(30000000);
    expect(result.cra.twentyPercentGrossKobo).toBe(600000000);
    expect(result.cra.totalCRAKobo).toBe(630000000);
  });

  it('3. should compute graduated bracket tax accurately on standard ₦3,600,000 salary', () => {
    // Gross = ₦3,600,000 (360,000,000 Kobo)
    // Pension 8% = ₦288,000 (28,800,000 Kobo)
    // NHF 2.5% on 50% Basic (₦1.8M) = ₦45,000 (4,500,000 Kobo)
    // Total Deductions = ₦333,000 (33,300,000 Kobo)
    // CRA: ₦200,000 + (20% * ₦3.6M = ₦720,000) = ₦920,000 (92,000,000 Kobo)
    // Total Reliefs = ₦920,000 + ₦333,000 = ₦1,253,000 (125,300,000 Kobo)
    // Taxable Income = ₦3,600,000 - ₦1,253,000 = ₦2,347,000 (234,700,000 Kobo)
    // Tax Brackets:
    // 1. 1st ₦300k @ 7% = ₦21,000
    // 2. Next ₦300k @ 11% = ₦33,000
    // 3. Next ₦500k @ 15% = ₦75,000
    // 4. Next ₦500k @ 19% = ₦95,000
    // 5. Remaining (₦2,347,000 - ₦1,600,000 = ₦747,000) @ 21% = ₦156,870
    // Total Annual Tax = ₦21k + ₦33k + ₦75k + ₦95k + ₦156.87k = ₦380,870 (38,087,000 Kobo)
    const result = PITACalculator.calculate({
      grossAnnualIncomeKobo: 360000000
    });

    expect(result.taxableIncomeKobo).toBe(234700000);
    expect(result.finalAnnualTaxKobo).toBe(38087000);
    expect(result.finalMonthlyTaxKobo).toBe(Math.round(38087000 / 12));
    expect(result.isMinimumTaxApplied).toBe(false);
  });

  it('4. should exempt minimum wage earners from minimum tax floor', () => {
    // Gross = ₦600,000 (below ₦840,000 threshold)
    const result = PITACalculator.calculate({
      grossAnnualIncomeKobo: 60000000
    });
    expect(result.isMinimumTaxApplied).toBe(false);
  });
});
