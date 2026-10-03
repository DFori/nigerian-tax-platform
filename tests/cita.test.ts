import { describe, it, expect } from 'vitest';
import { CITACalculator } from '../src/domain/cita-calculator';

describe('CITACalculator — Nigerian Companies Income Tax Engine', () => {
  it('1. should apply 0% CIT and 0% TET for small businesses with turnover < ₦25M', () => {
    // Turnover: ₦18,000,000, Profit: ₦4,000,000
    const result = CITACalculator.calculate({
      grossTurnoverKobo: 1800000000,
      assessableProfitKobo: 400000000
    });

    expect(result.companySizeCategory).toBe('SMALL');
    expect(result.citRatePercent).toBe(0);
    expect(result.citTaxPayableKobo).toBe(0);
    expect(result.tetRatePercent).toBe(0);
    expect(result.totalCorporateTaxKobo).toBe(0);
  });

  it('2. should apply 20% CIT and 3% TET for medium businesses (₦25M to ₦100M)', () => {
    // Turnover: ₦60,000,000, Profit: ₦15,000,000 (1,500,000,000 Kobo)
    // CIT 20% = ₦3,000,000 (300,000,000 Kobo)
    // TET 3% = ₦450,000 (45,000,000 Kobo)
    // Total = ₦3,450,000 (345,000,000 Kobo)
    const result = CITACalculator.calculate({
      grossTurnoverKobo: 6000000000,
      assessableProfitKobo: 1500000000
    });

    expect(result.companySizeCategory).toBe('MEDIUM');
    expect(result.citRatePercent).toBe(20);
    expect(result.citTaxPayableKobo).toBe(300000000);
    expect(result.tetRatePercent).toBe(3);
    expect(result.tetPayableKobo).toBe(45000000);
    expect(result.totalCorporateTaxKobo).toBe(345000000);
  });

  it('3. should apply 30% CIT and 3% TET for large businesses (> ₦100M)', () => {
    // Turnover: ₦250,000,000, Profit: ₦50,000,000 (5,000,000,000 Kobo)
    // CIT 30% = ₦15,000,000 (1,500,000,000 Kobo)
    // TET 3% = ₦1,500,000 (150,000,000 Kobo)
    // Total = ₦16,500,000 (1,650,000,000 Kobo)
    const result = CITACalculator.calculate({
      grossTurnoverKobo: 25000000000,
      assessableProfitKobo: 5000000000
    });

    expect(result.companySizeCategory).toBe('LARGE');
    expect(result.citRatePercent).toBe(30);
    expect(result.citTaxPayableKobo).toBe(1500000000);
    expect(result.tetRatePercent).toBe(3);
    expect(result.tetPayableKobo).toBe(150000000);
    expect(result.totalCorporateTaxKobo).toBe(1650000000);
  });
});
