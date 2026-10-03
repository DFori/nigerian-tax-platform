/**
 * Statutory Nigerian Tax Filing Calendar & Compliance Tracker
 */

import { FilingDeadline } from './types';

export class FilingCalendar {
  public static getUpcomingDeadlines(referenceDate: Date = new Date()): FilingDeadline[] {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth(); // 0-indexed

    // 1. Monthly PAYE Remittance: 10th of succeeding month
    const payeDueDate = new Date(year, month + 1, 10);
    const payeDaysRemaining = this.daysBetween(referenceDate, payeDueDate);

    // 2. Monthly VAT Return: 21st of succeeding month
    const vatDueDate = new Date(year, month + 1, 21);
    const vatDaysRemaining = this.daysBetween(referenceDate, vatDueDate);

    // 3. Monthly WHT Remittance: 21st of succeeding month
    const whtDueDate = new Date(year, month + 1, 21);
    const whtDaysRemaining = this.daysBetween(referenceDate, whtDueDate);

    // 4. Annual Employer Return (Form H1): January 31
    let formH1Year = month === 0 ? year : year + 1;
    const formH1DueDate = new Date(formH1Year, 0, 31);
    const formH1DaysRemaining = this.daysBetween(referenceDate, formH1DueDate);

    // 5. Annual Individual Return (Form A): March 31
    let formAYear = month <= 2 ? year : year + 1;
    const formADueDate = new Date(formAYear, 2, 31);
    const formADaysRemaining = this.daysBetween(referenceDate, formADueDate);

    // 6. Companies Income Tax (CIT) Annual Return: 6 months after fiscal year end (June 30 for Dec 31 FY)
    let citYear = month <= 5 ? year : year + 1;
    const citDueDate = new Date(citYear, 5, 30);
    const citDaysRemaining = this.daysBetween(referenceDate, citDueDate);

    return [
      {
        obligationName: 'Monthly PAYE Remittance',
        taxType: 'PITA',
        jurisdiction: 'STATE_SIRS',
        frequency: 'MONTHLY',
        statutoryDeadlineDescription: '10th day of the month following deduction',
        nextFilingDueDate: payeDueDate.toISOString().split('T')[0],
        daysRemaining: payeDaysRemaining,
        penaltiesForDefault: '10% penalty per annum plus interest at CBN Monetary Policy Rate (MPR)',
        statutorySource: 'PITA 2011 Section 81 & PAYE Regulations'
      },
      {
        obligationName: 'Monthly Value Added Tax (VAT) Return',
        taxType: 'VAT',
        jurisdiction: 'FEDERAL_FIRS',
        frequency: 'MONTHLY',
        statutoryDeadlineDescription: '21st day of the month following the transaction',
        nextFilingDueDate: vatDueDate.toISOString().split('T')[0],
        daysRemaining: vatDaysRemaining,
        penaltiesForDefault: '₦50,000 for the first month and ₦25,000 for each subsequent month of default',
        statutorySource: 'VAT Act Section 15 (as amended by Finance Act 2020)'
      },
      {
        obligationName: 'Monthly Withholding Tax (WHT) Remittance',
        taxType: 'WHT',
        jurisdiction: 'FEDERAL_FIRS',
        frequency: 'MONTHLY',
        statutoryDeadlineDescription: '21st day of the month following deduction',
        nextFilingDueDate: whtDueDate.toISOString().split('T')[0],
        daysRemaining: whtDaysRemaining,
        penaltiesForDefault: '10% penalty of the tax not remitted plus statutory interest',
        statutorySource: 'CITA Section 81 & PITA Section 73'
      },
      {
        obligationName: 'Annual Employer Tax Return (Form H1)',
        taxType: 'PITA',
        jurisdiction: 'STATE_SIRS',
        frequency: 'ANNUAL',
        statutoryDeadlineDescription: '31st of January each year for previous year payroll',
        nextFilingDueDate: formH1DueDate.toISOString().split('T')[0],
        daysRemaining: formH1DaysRemaining,
        penaltiesForDefault: '₦500,000 for corporate employers; ₦50,000 for individuals',
        statutorySource: 'PITA 2011 Section 81(2)'
      },
      {
        obligationName: 'Annual Individual Self-Assessment Return (Form A)',
        taxType: 'PITA',
        jurisdiction: 'STATE_SIRS',
        frequency: 'ANNUAL',
        statutoryDeadlineDescription: '31st of March each year',
        nextFilingDueDate: formADueDate.toISOString().split('T')[0],
        daysRemaining: formADaysRemaining,
        penaltiesForDefault: '₦50,000 plus ₦5,000 for every day default continues',
        statutorySource: 'PITA 2011 Section 41'
      },
      {
        obligationName: 'Companies Income Tax (CIT) Annual Return',
        taxType: 'CITA',
        jurisdiction: 'FEDERAL_FIRS',
        frequency: 'ANNUAL',
        statutoryDeadlineDescription: '6 months after the end of the accounting financial year',
        nextFilingDueDate: citDueDate.toISOString().split('T')[0],
        daysRemaining: citDaysRemaining,
        penaltiesForDefault: '₦25,000 for first month of default and ₦5,000 for each subsequent month',
        statutorySource: 'CITA Cap C21 Section 55'
      }
    ];
  }

  private static daysBetween(date1: Date, date2: Date): number {
    const diff = date2.getTime() - date1.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
