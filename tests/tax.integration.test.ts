import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server/server';

describe('Nigerian Tax Platform — End-to-End API Integration Suite', () => {
  it('1. should calculate PITA/PAYE via POST /api/pita/calculate', async () => {
    const res = await request(app)
      .post('/api/pita/calculate')
      .send({
        grossAnnualIncome: 5000000, // ₦5,000,000
        basicSalary: 2500000
      });

    expect(res.status).toBe(200);
    expect(res.body.grossIncomeNaira).toBe(5000000);
    expect(res.body.totalCRANaira).toBe(1200000); // ₦200k + (20% * ₦5M = ₦1M) = ₦1.2M
    expect(res.body.finalAnnualTaxNaira).toBeGreaterThan(0);
    expect(res.body.finalMonthlyTaxNaira).toBeCloseTo(res.body.finalAnnualTaxNaira / 12, 1);
    expect(res.body.metadata.statutorySource).toContain('Personal Income Tax Act');
  });

  it('2. should calculate SME CIT via POST /api/cita/calculate', async () => {
    const res = await request(app)
      .post('/api/cita/calculate')
      .send({
        grossTurnover: 20000000, // ₦20M (Small SME)
        assessableProfit: 5000000
      });

    expect(res.status).toBe(200);
    expect(res.body.companySizeCategory).toBe('SMALL');
    expect(res.body.citRatePercent).toBe(0);
    expect(res.body.totalCorporateTaxNaira).toBe(0);
  });

  it('3. should calculate VAT via POST /api/vat/calculate', async () => {
    const res = await request(app)
      .post('/api/vat/calculate')
      .send({
        transactionAmount: 200000,
        itemCategory: 'SOFTWARE_SERVICES'
      });

    expect(res.status).toBe(200);
    expect(res.body.vatRatePercent).toBe(7.5);
    expect(res.body.vatAmountNaira).toBe(15000);
    expect(res.body.totalWithVATNaira).toBe(215000);
  });

  it('4. should calculate WHT via POST /api/wht/calculate', async () => {
    const res = await request(app)
      .post('/api/wht/calculate')
      .send({
        transactionAmount: 1000000,
        beneficiaryType: 'INDIVIDUAL',
        serviceType: 'PROFESSIONAL_CONSULTANCY'
      });

    expect(res.status).toBe(200);
    expect(res.body.whtRatePercent).toBe(5);
    expect(res.body.whtDeductionNaira).toBe(50000);
    expect(res.body.netPayableToVendorNaira).toBe(950000);
  });

  it('5. should fetch statutory filing deadlines via GET /api/calendar/deadlines', async () => {
    const res = await request(app).get('/api/calendar/deadlines');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(6);
    expect(res.body[0].obligationName).toBe('Monthly PAYE Remittance');
  });

  it('6. should fetch versioned tax rule metadata via GET /api/rules/all', async () => {
    const res = await request(app).get('/api/rules/all');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(res.body[0].taxType).toBe('PITA');
  });
});
