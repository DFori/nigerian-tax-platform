/**
 * Companies Income Tax (CITA) & SME Exemption Calculation Engine
 * Governed by CITA Cap C21 LFN 2004 as amended by Finance Acts 2019-2023.
 */

import { CITACalculationInput, CITACalculationResult } from './types';
import { RulesRegistry } from './rules-registry';

export class CITACalculator {
  /**
   * Calculate corporate income tax and tertiary education tax based on company turnover tiers
   */
  public static calculate(input: CITACalculationInput): CITACalculationResult {
    const turnover = Math.round(input.grossTurnoverKobo || 0);
    const profit = Math.round(input.assessableProfitKobo || 0);

    const rule = RulesRegistry.resolveCitaRule(input.taxYear ? `${input.taxYear}-06-01` : undefined);
    const params = rule.parameters;

    let companySizeCategory: 'SMALL' | 'MEDIUM' | 'LARGE' = 'SMALL';
    let citRatePercent = 0;
    let tetRatePercent = 0;
    const statutoryNotes: string[] = [];

    if (turnover < params.smallBusinessTurnoverThresholdKobo) {
      // Small Company (Turnover < ₦25,000,000)
      companySizeCategory = 'SMALL';
      citRatePercent = 0;
      tetRatePercent = 0; // Small companies exempt from Tertiary Education Tax under Finance Act 2020
      statutoryNotes.push(
        'Small Company Exemption: Gross turnover is below ₦25 Million. 0% CIT rate applies under Section 23(1) of CITA.',
        'Exempt from Tertiary Education Tax (TET) under Finance Act 2020.'
      );
    } else if (turnover <= params.mediumBusinessTurnoverThresholdKobo) {
      // Medium Company (₦25,000,000 to ₦100,000,000)
      companySizeCategory = 'MEDIUM';
      citRatePercent = 20;
      tetRatePercent = 3;
      statutoryNotes.push(
        'Medium Company Tier: Turnover between ₦25M and ₦100M. 20% CIT applies on Assessable Profit.',
        '3% Tertiary Education Tax (TET) applies on assessable profit.'
      );
    } else {
      // Large Company (> ₦100,000,000)
      companySizeCategory = 'LARGE';
      citRatePercent = 30;
      tetRatePercent = 3;
      statutoryNotes.push(
        'Large Company Tier: Turnover exceeds ₦100 Million. Standard 30% CIT applies on Assessable Profit.',
        '3% Tertiary Education Tax (TET) applies on assessable profit.'
      );
    }

    const citTaxPayable = profit > 0 ? Math.round((profit * citRatePercent) / 100) : 0;
    const tetPayable = profit > 0 ? Math.round((profit * tetRatePercent) / 100) : 0;
    const totalCorporateTax = citTaxPayable + tetPayable;

    const effectiveTaxRatePercent = profit > 0 ? Math.round((totalCorporateTax / profit) * 1000) / 10 : 0;

    return {
      metadata: rule.metadata,
      grossTurnoverKobo: turnover,
      assessableProfitKobo: profit,
      companySizeCategory,
      citRatePercent,
      citTaxPayableKobo: citTaxPayable,
      tetRatePercent,
      tetPayableKobo: tetPayable,
      totalCorporateTaxKobo: totalCorporateTax,
      effectiveTaxRatePercent,
      statutoryNotes
    };
  }
}
