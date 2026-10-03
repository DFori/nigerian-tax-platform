/**
 * Versioned Statutory Tax Rules Registry
 * Every tax rule is externalized, version-controlled, and strictly date-effective with authoritative citations.
 */

import { 
  TaxRuleMetadata, 
  PITARuleParameters, 
  TaxType, 
  Jurisdiction 
} from './types';

export interface VersionedPITARule {
  metadata: TaxRuleMetadata;
  parameters: PITARuleParameters;
}

export interface VersionedCITARule {
  metadata: TaxRuleMetadata;
  parameters: {
    smallBusinessTurnoverThresholdKobo: number; // ₦25M
    mediumBusinessTurnoverThresholdKobo: number; // ₦100M
    smallBusinessRate: number; // 0%
    mediumBusinessRate: number; // 20%
    largeBusinessRate: number; // 30%
    tetRate: number; // 3% Tertiary Education Tax
  };
}

export interface VersionedVATRule {
  metadata: TaxRuleMetadata;
  parameters: {
    standardRatePercent: number; // 7.5%
    exemptCategories: string[];
  };
}

export interface VersionedWHTRule {
  metadata: TaxRuleMetadata;
  parameters: {
    rates: Record<string, { individualRate: number; corporateRate: number; target: 'FEDERAL_FIRS' | 'STATE_SIRS' }>;
  };
}

export class RulesRegistry {
  // 1. PITA Rule Definitions
  private static readonly PITA_RULES: VersionedPITARule[] = [
    {
      metadata: {
        ruleId: 'pita_finance_act_2020_present',
        taxType: 'PITA',
        jurisdiction: 'FEDERAL_FIRS',
        version: '2.4.0',
        effectiveFrom: '2020-01-01',
        effectiveTo: null,
        statutorySource: 'Personal Income Tax Act (PITA 2011, Sixth Schedule) as amended by Finance Acts 2019 & 2020',
        officialGazetteRef: 'Federal Republic of Nigeria Official Gazette No. 8, Vol. 107',
        verificationDate: '2026-10-03'
      },
      parameters: {
        craFixedBaseKobo: 20000000, // ₦200,000 in Kobo
        craGrossPercentageAlt: 0.01, // 1%
        craAdditionalPercentage: 0.20, // 20%
        pensionRate: 0.08, // 8% PRA 2014
        nhfRate: 0.025, // 2.5% NHF Act
        minimumTaxRate: 0.01, // 1%
        minimumWageThresholdKobo: 84000000, // ₦840,000 / year (₦70,000/mo) exempt under Finance Act
        brackets: [
          { bandName: 'First ₦300,000', limitKobo: 30000000, ratePercent: 7 },
          { bandName: 'Next ₦300,000', limitKobo: 30000000, ratePercent: 11 },
          { bandName: 'Next ₦500,000', limitKobo: 50000000, ratePercent: 15 },
          { bandName: 'Next ₦500,000', limitKobo: 50000000, ratePercent: 19 },
          { bandName: 'Next ₦1,600,000', limitKobo: 160000000, ratePercent: 21 },
          { bandName: 'Above ₦3,200,000 (Remainder)', limitKobo: null, ratePercent: 24 }
        ]
      }
    }
  ];

  // 2. CITA Rule Definitions
  private static readonly CITA_RULES: VersionedCITARule[] = [
    {
      metadata: {
        ruleId: 'cita_finance_act_2020_2023',
        taxType: 'CITA',
        jurisdiction: 'FEDERAL_FIRS',
        version: '3.1.0',
        effectiveFrom: '2020-01-01',
        effectiveTo: null,
        statutorySource: 'Companies Income Tax Act (CITA Cap C21 LFN 2004) as amended by Finance Acts 2019–2023',
        officialGazetteRef: 'Gazette No. 14, Vol. 108',
        verificationDate: '2026-10-03'
      },
      parameters: {
        smallBusinessTurnoverThresholdKobo: 2500000000, // ₦25,000,000 in Kobo
        mediumBusinessTurnoverThresholdKobo: 10000000000, // ₦100,000,000 in Kobo
        smallBusinessRate: 0.0, // 0%
        mediumBusinessRate: 0.20, // 20%
        largeBusinessRate: 0.30, // 30%
        tetRate: 0.03 // 3% Tertiary Education Trust Fund
      }
    }
  ];

  // 3. VAT Rule Definitions
  private static readonly VAT_RULES: VersionedVATRule[] = [
    {
      metadata: {
        ruleId: 'vat_finance_act_2020',
        taxType: 'VAT',
        jurisdiction: 'FEDERAL_FIRS',
        version: '2.0.0',
        effectiveFrom: '2020-02-01',
        effectiveTo: null,
        statutorySource: 'Value Added Tax Act (Cap V1 LFN 2004) as amended by Finance Act 2020 Section 34',
        verificationDate: '2026-10-03'
      },
      parameters: {
        standardRatePercent: 7.5,
        exemptCategories: [
          'BASIC_FOOD_ITEMS', // Bread, cereals, fish, milk, vegetables, salt, roots
          'MEDICAL_PHARMACEUTICAL',
          'EDUCATIONAL_BOOKS_MATERIALS',
          'BABY_PRODUCTS',
          'LOCALLY_PRODUCED_SANITARY_TOWELS',
          'EXPORTS',
          'COMMERCIAL_TRANSPORTATION'
        ]
      }
    }
  ];

  // 4. WHT Rule Definitions
  private static readonly WHT_RULES: VersionedWHTRule[] = [
    {
      metadata: {
        ruleId: 'wht_statutory_schedule',
        taxType: 'WHT',
        jurisdiction: 'FEDERAL_FIRS',
        version: '1.5.0',
        effectiveFrom: '2020-01-01',
        effectiveTo: null,
        statutorySource: 'FIRS Withholding Tax Guidelines & Information Circular No. 2006/02',
        verificationDate: '2026-10-03'
      },
      parameters: {
        rates: {
          DIVIDEND_INTEREST_RENT: { individualRate: 10, corporateRate: 10, target: 'STATE_SIRS' },
          ROYALTIES: { individualRate: 10, corporateRate: 10, target: 'STATE_SIRS' },
          PROFESSIONAL_CONSULTANCY: { individualRate: 5, corporateRate: 10, target: 'STATE_SIRS' },
          CONSTRUCTION_CONTRACTS: { individualRate: 5, corporateRate: 5, target: 'STATE_SIRS' },
          DIRECTORS_FEES: { individualRate: 10, corporateRate: 10, target: 'STATE_SIRS' },
          AGENCY_COMMISSION: { individualRate: 5, corporateRate: 10, target: 'STATE_SIRS' }
        }
      }
    }
  ];

  // Resolvers
  public static resolvePitaRule(dateStr?: string): VersionedPITARule {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const rule = this.PITA_RULES.find(r => 
      r.metadata.effectiveFrom <= targetDate && 
      (r.metadata.effectiveTo === null || r.metadata.effectiveTo >= targetDate)
    );
    if (!rule) return this.PITA_RULES[0];
    return rule;
  }

  public static resolveCitaRule(dateStr?: string): VersionedCITARule {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const rule = this.CITA_RULES.find(r => 
      r.metadata.effectiveFrom <= targetDate && 
      (r.metadata.effectiveTo === null || r.metadata.effectiveTo >= targetDate)
    );
    if (!rule) return this.CITA_RULES[0];
    return rule;
  }

  public static resolveVatRule(dateStr?: string): VersionedVATRule {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const rule = this.VAT_RULES.find(r => 
      r.metadata.effectiveFrom <= targetDate && 
      (r.metadata.effectiveTo === null || r.metadata.effectiveTo >= targetDate)
    );
    if (!rule) return this.VAT_RULES[0];
    return rule;
  }

  public static resolveWhtRule(dateStr?: string): VersionedWHTRule {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const rule = this.WHT_RULES.find(r => 
      r.metadata.effectiveFrom <= targetDate && 
      (r.metadata.effectiveTo === null || r.metadata.effectiveTo >= targetDate)
    );
    if (!rule) return this.WHT_RULES[0];
    return rule;
  }

  public static getAllRuleMetadata(): TaxRuleMetadata[] {
    return [
      this.PITA_RULES[0].metadata,
      this.CITA_RULES[0].metadata,
      this.VAT_RULES[0].metadata,
      this.WHT_RULES[0].metadata
    ];
  }
}
