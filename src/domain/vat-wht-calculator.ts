/**
 * Value Added Tax (VAT) & Withholding Tax (WHT) Calculation Engine
 */

import { 
  VATCalculationInput, 
  VATCalculationResult, 
  WHTCalculationInput, 
  WHTCalculationResult 
} from './types';
import { RulesRegistry } from './rules-registry';

export class VATCalculator {
  public static calculate(input: VATCalculationInput): VATCalculationResult {
    const amount = Math.round(input.transactionAmountKobo || 0);
    const rule = RulesRegistry.resolveVatRule();
    const params = rule.parameters;

    const normalizedCategory = (input.itemCategory || '').toUpperCase().replace(/\s+/g, '_');
    const isExempt = params.exemptCategories.includes(normalizedCategory) || Boolean(input.isExport);

    let exemptionReason: string | undefined = undefined;
    if (input.isExport) {
      exemptionReason = 'Zero-rated: Exported goods and services are zero-rated under VAT Act First Schedule.';
    } else if (isExempt) {
      exemptionReason = `Statutory Exemption: '${input.itemCategory}' is exempt from VAT under Part 1 First Schedule of VAT Act (as amended).`;
    }

    const vatRate = isExempt ? 0 : params.standardRatePercent;
    const vatAmount = isExempt ? 0 : Math.round((amount * vatRate) / 100);
    const totalWithVAT = amount + vatAmount;

    return {
      metadata: rule.metadata,
      transactionAmountKobo: amount,
      isExempt,
      exemptionReason,
      vatRatePercent: vatRate,
      vatAmountKobo: vatAmount,
      totalWithVATKobo: totalWithVAT
    };
  }
}

export class WHTCalculator {
  public static calculate(input: WHTCalculationInput): WHTCalculationResult {
    const amount = Math.round(input.transactionAmountKobo || 0);
    const rule = RulesRegistry.resolveWhtRule();
    const params = rule.parameters;

    const rateEntry = params.rates[input.serviceType] || { individualRate: 10, corporateRate: 10, target: 'STATE_SIRS' };
    const whtRate = input.beneficiaryType === 'INDIVIDUAL' ? rateEntry.individualRate : rateEntry.corporateRate;
    const whtDeduction = Math.round((amount * whtRate) / 100);
    const netPayable = amount - whtDeduction;

    const remittanceTarget = input.beneficiaryType === 'INDIVIDUAL' ? 'STATE_SIRS' : 'FEDERAL_FIRS';

    return {
      metadata: rule.metadata,
      transactionAmountKobo: amount,
      beneficiaryType: input.beneficiaryType,
      serviceType: input.serviceType,
      whtRatePercent: whtRate,
      whtDeductionKobo: whtDeduction,
      netPayableToVendorKobo: netPayable,
      statutoryRemittanceTarget: remittanceTarget
    };
  }
}
