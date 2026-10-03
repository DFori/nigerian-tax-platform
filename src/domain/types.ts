/**
 * Domain Types for Nigerian Statutory Tax Compliance Engine
 */

export type TaxType = 'PITA' | 'CITA' | 'VAT' | 'WHT' | 'CGT' | 'TET';

export type Jurisdiction = 
  | 'FEDERAL_FIRS'
  | 'STATE_SIRS'
  | 'LAGOS_LIRS'
  | 'ABUJA_FCT_IRS'
  | 'RIVERS_RIRS'
  | 'KANO_KIRS'
  | 'OGUN_OGIRS';

export interface TaxRuleMetadata {
  ruleId: string;
  taxType: TaxType;
  jurisdiction: Jurisdiction;
  version: string;
  effectiveFrom: string; // ISO Date YYYY-MM-DD
  effectiveTo: string | null; // null if currently active
  statutorySource: string; // e.g. "Personal Income Tax Act (PITA 2011) as amended by Finance Act 2020"
  officialGazetteRef?: string;
  verificationDate: string;
}

export interface PITABracket {
  bandName: string;
  limitKobo: number | null; // null for highest bracket (remainder above ₦3.2M)
  ratePercent: number; // e.g. 7, 11, 15, 19, 21, 24
}

export interface PITARuleParameters {
  craFixedBaseKobo: number; // 200,000 Naira = 20,000,000 Kobo
  craGrossPercentageAlt: number; // 1% of Gross
  craAdditionalPercentage: number; // 20% of Gross
  pensionRate: number; // 8% employee contribution
  nhfRate: number; // 2.5% of basic salary
  minimumTaxRate: number; // 1% of Gross Income
  minimumWageThresholdKobo: number; // ₦840,000 / year (₦70,000/mo) exempt from Minimum Tax under Finance Act
  brackets: PITABracket[];
}

export interface PITACalculationInput {
  grossAnnualIncomeKobo: number;
  basicSalaryKobo?: number; // Needed for NHF (2.5% of basic)
  pensionContributionKobo?: number; // Custom or 8% auto-computed
  nhfContributionKobo?: number; // Custom or 2.5% auto-computed
  nhisContributionKobo?: number;
  lifeAssurancePremiumKobo?: number;
  taxYear?: number;
  jurisdiction?: Jurisdiction;
}

export interface PITABracketBreakdown {
  bandName: string;
  taxableAmountKobo: number;
  ratePercent: number;
  taxPayableKobo: number;
}

export interface PITACalculationResult {
  metadata: TaxRuleMetadata;
  grossIncomeKobo: number;
  statutoryDeductions: {
    pensionKobo: number;
    nhfKobo: number;
    nhisKobo: number;
    lifeAssuranceKobo: number;
    totalReliefDeductionsKobo: number;
  };
  cra: {
    fixedOrPercentBaseKobo: number;
    twentyPercentGrossKobo: number;
    totalCRAKobo: number;
    formulaUsed: string;
  };
  totalNonTaxableReliefsKobo: number;
  taxableIncomeKobo: number;
  bracketBreakdown: PITABracketBreakdown[];
  grossComputedTaxKobo: number;
  isMinimumTaxApplied: boolean;
  minimumTaxKobo: number;
  finalAnnualTaxKobo: number;
  finalMonthlyTaxKobo: number; // Monthly PAYE
  effectiveTaxRatePercent: number;
  netAnnualTakeHomeKobo: number;
  netMonthlyTakeHomeKobo: number;
  statutoryNotes: string[];
}

export interface CITACalculationInput {
  grossTurnoverKobo: number;
  assessableProfitKobo: number;
  taxYear?: number;
  isExemptSmallBusiness?: boolean;
}

export interface CITACalculationResult {
  metadata: TaxRuleMetadata;
  grossTurnoverKobo: number;
  assessableProfitKobo: number;
  companySizeCategory: 'SMALL' | 'MEDIUM' | 'LARGE';
  citRatePercent: number;
  citTaxPayableKobo: number;
  tetRatePercent: number; // Tertiary Education Tax (3%)
  tetPayableKobo: number;
  totalCorporateTaxKobo: number;
  effectiveTaxRatePercent: number;
  statutoryNotes: string[];
}

export interface VATCalculationInput {
  transactionAmountKobo: number;
  itemCategory: string;
  isExport?: boolean;
}

export interface VATCalculationResult {
  metadata: TaxRuleMetadata;
  transactionAmountKobo: number;
  isExempt: boolean;
  exemptionReason?: string;
  vatRatePercent: number; // 7.5% or 0%
  vatAmountKobo: number;
  totalWithVATKobo: number;
}

export interface WHTCalculationInput {
  transactionAmountKobo: number;
  beneficiaryType: 'INDIVIDUAL' | 'CORPORATE';
  serviceType: 
    | 'DIVIDEND_INTEREST_RENT'
    | 'ROYALTIES'
    | 'PROFESSIONAL_CONSULTANCY'
    | 'CONSTRUCTION_CONTRACTS'
    | 'DIRECTORS_FEES'
    | 'AGENCY_COMMISSION';
}

export interface WHTCalculationResult {
  metadata: TaxRuleMetadata;
  transactionAmountKobo: number;
  beneficiaryType: 'INDIVIDUAL' | 'CORPORATE';
  serviceType: string;
  whtRatePercent: number;
  whtDeductionKobo: number;
  netPayableToVendorKobo: number;
  statutoryRemittanceTarget: 'FEDERAL_FIRS' | 'STATE_SIRS';
}

export interface FilingDeadline {
  obligationName: string;
  taxType: TaxType;
  jurisdiction: Jurisdiction;
  frequency: 'MONTHLY' | 'ANNUAL';
  statutoryDeadlineDescription: string;
  nextFilingDueDate: string; // ISO Date YYYY-MM-DD
  daysRemaining: number;
  penaltiesForDefault: string;
  statutorySource: string;
}
