/**
 * Personal Income Tax (PITA / PAYE) Calculation Engine
 * Strictly follows the Personal Income Tax Act (PITA 2011) as amended by Finance Acts 2019, 2020.
 * All internal arithmetic operates in integer kobo to eliminate floating-point drift.
 */

import { 
  PITACalculationInput, 
  PITACalculationResult, 
  PITABracketBreakdown 
} from './types';
import { RulesRegistry } from './rules-registry';

export class PITACalculator {
  /**
   * Calculate statutory Personal Income Tax (PAYE / Direct Assessment)
   */
  public static calculate(input: PITACalculationInput): PITACalculationResult {
    const gross = Math.round(input.grossAnnualIncomeKobo || 0);
    if (gross <= 0) {
      return this.emptyResult();
    }

    const rule = RulesRegistry.resolvePitaRule(input.taxYear ? `${input.taxYear}-06-01` : undefined);
    const params = rule.parameters;

    // 1. Statutory Allowable Non-Taxable Deductions
    // Pension: 8% of gross (or basic) if not provided
    const pension = input.pensionContributionKobo !== undefined
      ? Math.round(input.pensionContributionKobo)
      : Math.round(gross * params.pensionRate);

    // NHF: 2.5% of basic salary (or 2.5% of gross if basic not separately provided)
    const nhfBase = input.basicSalaryKobo !== undefined ? input.basicSalaryKobo : gross * 0.5; // typical basic is ~50% gross
    const nhf = input.nhfContributionKobo !== undefined
      ? Math.round(input.nhfContributionKobo)
      : Math.round(nhfBase * params.nhfRate);

    const nhis = Math.round(input.nhisContributionKobo || 0);
    const lifeAssurance = Math.round(input.lifeAssurancePremiumKobo || 0);
    const totalReliefDeductions = pension + nhf + nhis + lifeAssurance;

    // 2. Consolidated Relief Allowance (CRA)
    // Higher of ₦200,000 (20,000,000 kobo) OR 1% of Gross
    // PLUS 20% of Gross
    const fixedOrPercentBase = Math.max(params.craFixedBaseKobo, Math.round(gross * params.craGrossPercentageAlt));
    const twentyPercentGross = Math.round(gross * params.craAdditionalPercentage);
    const totalCRA = fixedOrPercentBase + twentyPercentGross;

    const formulaUsed = fixedOrPercentBase === params.craFixedBaseKobo
      ? '₦200,000 Fixed Base + 20% Gross Income'
      : '1% Gross Income + 20% Gross Income';

    const totalNonTaxableReliefs = totalCRA + totalReliefDeductions;

    // 3. Taxable / Chargeable Income
    const taxableIncome = Math.max(0, gross - totalNonTaxableReliefs);

    // 4. Progressive Tax Brackets (Sixth Schedule)
    const bracketBreakdown: PITABracketBreakdown[] = [];
    let remainingToTax = taxableIncome;
    let grossComputedTax = 0;

    for (const b of params.brackets) {
      if (remainingToTax <= 0) {
        bracketBreakdown.push({
          bandName: b.bandName,
          taxableAmountKobo: 0,
          ratePercent: b.ratePercent,
          taxPayableKobo: 0
        });
        continue;
      }

      let bandTaxable = 0;
      if (b.limitKobo === null) {
        // Top tier (all remaining)
        bandTaxable = remainingToTax;
      } else {
        bandTaxable = Math.min(remainingToTax, b.limitKobo);
      }

      const bandTax = Math.round((bandTaxable * b.ratePercent) / 100);
      grossComputedTax += bandTax;
      remainingToTax -= bandTaxable;

      bracketBreakdown.push({
        bandName: b.bandName,
        taxableAmountKobo: bandTaxable,
        ratePercent: b.ratePercent,
        taxPayableKobo: bandTaxable > 0 ? bandTax : 0
      });
    }

    // 5. Minimum Tax Check (Finance Act 2020)
    // Minimum Tax = 1% of Gross Income
    const minimumTax = Math.round(gross * params.minimumTaxRate);
    let finalAnnualTax = grossComputedTax;
    let isMinimumTaxApplied = false;

    // Individuals earning National Minimum Wage (₦840,000/yr / ₦70,000/mo) are exempt from Minimum Tax
    if (gross <= params.minimumWageThresholdKobo) {
      finalAnnualTax = grossComputedTax; // Exempt from mandatory minimum tax floor
    } else if (grossComputedTax < minimumTax) {
      finalAnnualTax = minimumTax;
      isMinimumTaxApplied = true;
    }

    const finalMonthlyTax = Math.round(finalAnnualTax / 12);
    const effectiveTaxRatePercent = gross > 0 ? Math.round((finalAnnualTax / gross) * 1000) / 10 : 0;
    const netAnnualTakeHome = gross - finalAnnualTax - totalReliefDeductions;
    const netMonthlyTakeHome = Math.round(netAnnualTakeHome / 12);

    const statutoryNotes: string[] = [
      `CRA calculated under Section 33 PITA 2011 (as amended): ${formulaUsed}.`,
      `Statutory deductions (Pension 8%, NHF 2.5%, NHIS) deducted before computing chargeable income.`,
      isMinimumTaxApplied 
        ? `Minimum Tax of 1% (₦${(minimumTax / 100).toLocaleString()}) applied as computed tax was below the statutory floor.`
        : `Progressive rates applied across ${params.brackets.length} graduated statutory brackets.`
    ];

    return {
      metadata: rule.metadata,
      grossIncomeKobo: gross,
      statutoryDeductions: {
        pensionKobo: pension,
        nhfKobo: nhf,
        nhisKobo: nhis,
        lifeAssuranceKobo: lifeAssurance,
        totalReliefDeductionsKobo: totalReliefDeductions
      },
      cra: {
        fixedOrPercentBaseKobo: fixedOrPercentBase,
        twentyPercentGrossKobo: twentyPercentGross,
        totalCRAKobo: totalCRA,
        formulaUsed
      },
      totalNonTaxableReliefsKobo: totalNonTaxableReliefs,
      taxableIncomeKobo: taxableIncome,
      bracketBreakdown,
      grossComputedTaxKobo: grossComputedTax,
      isMinimumTaxApplied,
      minimumTaxKobo: minimumTax,
      finalAnnualTaxKobo: finalAnnualTax,
      finalMonthlyTaxKobo: finalMonthlyTax,
      effectiveTaxRatePercent,
      netAnnualTakeHomeKobo: netAnnualTakeHome,
      netMonthlyTakeHomeKobo: netMonthlyTakeHome,
      statutoryNotes
    };
  }

  private static emptyResult(): PITACalculationResult {
    const rule = RulesRegistry.resolvePitaRule();
    return {
      metadata: rule.metadata,
      grossIncomeKobo: 0,
      statutoryDeductions: { pensionKobo: 0, nhfKobo: 0, nhisKobo: 0, lifeAssuranceKobo: 0, totalReliefDeductionsKobo: 0 },
      cra: { fixedOrPercentBaseKobo: 0, twentyPercentGrossKobo: 0, totalCRAKobo: 0, formulaUsed: 'N/A' },
      totalNonTaxableReliefsKobo: 0,
      taxableIncomeKobo: 0,
      bracketBreakdown: [],
      grossComputedTaxKobo: 0,
      isMinimumTaxApplied: false,
      minimumTaxKobo: 0,
      finalAnnualTaxKobo: 0,
      finalMonthlyTaxKobo: 0,
      effectiveTaxRatePercent: 0,
      netAnnualTakeHomeKobo: 0,
      netMonthlyTakeHomeKobo: 0,
      statutoryNotes: ['Zero gross income provided.']
    };
  }
}
