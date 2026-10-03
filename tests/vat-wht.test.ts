import { describe, it, expect } from 'vitest';
import { VATCalculator, WHTCalculator } from '../src/domain/vat-wht-calculator';

describe('VATCalculator & WHTCalculator — Indirect Tax & Withholding Tax Suite', () => {
  it('1. should calculate standard 7.5% VAT on taxable goods/services', () => {
    // ₦100,000 (10,000,000 Kobo) -> 7.5% = ₦7,500 (750,000 Kobo) -> Total = ₦107,500
    const result = VATCalculator.calculate({
      transactionAmountKobo: 10000000,
      itemCategory: 'ELECTRONICS'
    });

    expect(result.isExempt).toBe(false);
    expect(result.vatRatePercent).toBe(7.5);
    expect(result.vatAmountKobo).toBe(750000);
    expect(result.totalWithVATKobo).toBe(10750000);
  });

  it('2. should recognize statutory VAT exemptions (Basic Food, Medicines, Books)', () => {
    const food = VATCalculator.calculate({
      transactionAmountKobo: 5000000,
      itemCategory: 'BASIC_FOOD_ITEMS'
    });
    expect(food.isExempt).toBe(true);
    expect(food.vatAmountKobo).toBe(0);

    const med = VATCalculator.calculate({
      transactionAmountKobo: 8000000,
      itemCategory: 'MEDICAL_PHARMACEUTICAL'
    });
    expect(med.isExempt).toBe(true);
    expect(med.vatAmountKobo).toBe(0);
  });

  it('3. should calculate Withholding Tax (WHT) correctly by beneficiary and service type', () => {
    // Individual Professional Consultancy: 5% WHT
    const indConsult = WHTCalculator.calculate({
      transactionAmountKobo: 200000000, // ₦2,000,000
      beneficiaryType: 'INDIVIDUAL',
      serviceType: 'PROFESSIONAL_CONSULTANCY'
    });
    expect(indConsult.whtRatePercent).toBe(5);
    expect(indConsult.whtDeductionKobo).toBe(10000000); // ₦100,000
    expect(indConsult.netPayableToVendorKobo).toBe(190000000); // ₦1,900,000
    expect(indConsult.statutoryRemittanceTarget).toBe('STATE_SIRS');

    // Corporate Professional Consultancy: 10% WHT
    const corpConsult = WHTCalculator.calculate({
      transactionAmountKobo: 200000000,
      beneficiaryType: 'CORPORATE',
      serviceType: 'PROFESSIONAL_CONSULTANCY'
    });
    expect(corpConsult.whtRatePercent).toBe(10);
    expect(corpConsult.whtDeductionKobo).toBe(20000000); // ₦200,000
    expect(corpConsult.netPayableToVendorKobo).toBe(180000000); // ₦1,800,000
    expect(corpConsult.statutoryRemittanceTarget).toBe('FEDERAL_FIRS');
  });
});
