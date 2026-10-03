/**
 * REST API Endpoints for Nigerian Tax Platform
 */

import { Router, Request, Response } from 'express';
import { PITACalculator } from '../../domain/pita-calculator';
import { CITACalculator } from '../../domain/cita-calculator';
import { VATCalculator, WHTCalculator } from '../../domain/vat-wht-calculator';
import { FilingCalendar } from '../../domain/filing-calendar';
import { RulesRegistry } from '../../domain/rules-registry';

export const apiRouter = Router();

// Helper to convert major Naira amount to integer Kobo
const toKobo = (naira: any): number => Math.round(Number(naira || 0) * 100);

// 1. Personal Income Tax (PITA / PAYE)
apiRouter.post('/pita/calculate', (req: Request, res: Response): void => {
  try {
    const { 
      grossAnnualIncome, 
      basicSalary, 
      pensionContribution, 
      nhfContribution, 
      nhisContribution, 
      lifeAssurancePremium,
      taxYear,
      jurisdiction 
    } = req.body;

    if (grossAnnualIncome === undefined || Number(grossAnnualIncome) < 0) {
      res.status(400).json({ error: 'grossAnnualIncome is required and must be non-negative' });
      return;
    }

    const result = PITACalculator.calculate({
      grossAnnualIncomeKobo: toKobo(grossAnnualIncome),
      basicSalaryKobo: basicSalary !== undefined ? toKobo(basicSalary) : undefined,
      pensionContributionKobo: pensionContribution !== undefined ? toKobo(pensionContribution) : undefined,
      nhfContributionKobo: nhfContribution !== undefined ? toKobo(nhfContribution) : undefined,
      nhisContributionKobo: nhisContribution !== undefined ? toKobo(nhisContribution) : undefined,
      lifeAssurancePremiumKobo: lifeAssurancePremium !== undefined ? toKobo(lifeAssurancePremium) : undefined,
      taxYear: taxYear ? Number(taxYear) : undefined,
      jurisdiction: jurisdiction || 'FEDERAL_FIRS'
    });

    res.status(200).json({
      ...result,
      // Major Naira formatted numbers for display convenience
      grossIncomeNaira: result.grossIncomeKobo / 100,
      totalReliefDeductionsNaira: result.statutoryDeductions.totalReliefDeductionsKobo / 100,
      totalCRANaira: result.cra.totalCRAKobo / 100,
      totalNonTaxableReliefsNaira: result.totalNonTaxableReliefsKobo / 100,
      taxableIncomeNaira: result.taxableIncomeKobo / 100,
      finalAnnualTaxNaira: result.finalAnnualTaxKobo / 100,
      finalMonthlyTaxNaira: result.finalMonthlyTaxKobo / 100,
      netAnnualTakeHomeNaira: result.netAnnualTakeHomeKobo / 100,
      netMonthlyTakeHomeNaira: result.netMonthlyTakeHomeKobo / 100
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Companies Income Tax (CITA)
apiRouter.post('/cita/calculate', (req: Request, res: Response): void => {
  try {
    const { grossTurnover, assessableProfit, taxYear } = req.body;

    if (grossTurnover === undefined || assessableProfit === undefined) {
      res.status(400).json({ error: 'grossTurnover and assessableProfit are required' });
      return;
    }

    const result = CITACalculator.calculate({
      grossTurnoverKobo: toKobo(grossTurnover),
      assessableProfitKobo: toKobo(assessableProfit),
      taxYear: taxYear ? Number(taxYear) : undefined
    });

    res.status(200).json({
      ...result,
      grossTurnoverNaira: result.grossTurnoverKobo / 100,
      assessableProfitNaira: result.assessableProfitKobo / 100,
      citTaxPayableNaira: result.citTaxPayableKobo / 100,
      tetPayableNaira: result.tetPayableKobo / 100,
      totalCorporateTaxNaira: result.totalCorporateTaxKobo / 100
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Value Added Tax (VAT)
apiRouter.post('/vat/calculate', (req: Request, res: Response): void => {
  try {
    const { transactionAmount, itemCategory, isExport } = req.body;

    if (transactionAmount === undefined) {
      res.status(400).json({ error: 'transactionAmount is required' });
      return;
    }

    const result = VATCalculator.calculate({
      transactionAmountKobo: toKobo(transactionAmount),
      itemCategory: itemCategory || 'STANDARD_GOODS',
      isExport: Boolean(isExport)
    });

    res.status(200).json({
      ...result,
      transactionAmountNaira: result.transactionAmountKobo / 100,
      vatAmountNaira: result.vatAmountKobo / 100,
      totalWithVATNaira: result.totalWithVATKobo / 100
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Withholding Tax (WHT)
apiRouter.post('/wht/calculate', (req: Request, res: Response): void => {
  try {
    const { transactionAmount, beneficiaryType, serviceType } = req.body;

    if (transactionAmount === undefined || !beneficiaryType || !serviceType) {
      res.status(400).json({ error: 'transactionAmount, beneficiaryType, and serviceType are required' });
      return;
    }

    const result = WHTCalculator.calculate({
      transactionAmountKobo: toKobo(transactionAmount),
      beneficiaryType: beneficiaryType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL',
      serviceType
    });

    res.status(200).json({
      ...result,
      transactionAmountNaira: result.transactionAmountKobo / 100,
      whtDeductionNaira: result.whtDeductionKobo / 100,
      netPayableToVendorNaira: result.netPayableToVendorKobo / 100
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Statutory Filing Calendar & Deadlines
apiRouter.get('/calendar/deadlines', (_req: Request, res: Response): void => {
  try {
    const deadlines = FilingCalendar.getUpcomingDeadlines();
    res.status(200).json(deadlines);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Versioned Statutory Rule Metadata
apiRouter.get('/rules/all', (_req: Request, res: Response): void => {
  try {
    const metadataList = RulesRegistry.getAllRuleMetadata();
    res.status(200).json(metadataList);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
