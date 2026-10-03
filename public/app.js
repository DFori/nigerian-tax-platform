/**
 * TaxNigeria — Frontend Application Logic
 * Implements interactive statutory calculations for PITA, CITA, VAT, WHT,
 * and live filing deadline tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupCalculators();
  loadCalendarDeadlines();
  loadRulesLibrary();

  // Run initial calculations
  calculatePITA();
  calculateCITA();
  calculateVAT();
  calculateWHT();
});

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

function setupCalculators() {
  // PITA Form
  const formPita = document.getElementById('form-pita');
  formPita.addEventListener('submit', (e) => {
    e.preventDefault();
    calculatePITA();
  });
  document.getElementById('pita-gross').addEventListener('input', calculatePITA);

  // CITA Form
  const formCita = document.getElementById('form-cita');
  formCita.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateCITA();
  });
  ['cita-turnover', 'cita-profit'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateCITA);
  });

  // VAT Form
  const formVat = document.getElementById('form-vat');
  formVat.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateVAT();
  });
  ['vat-amount', 'vat-category'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateVAT);
  });

  // WHT Form
  const formWht = document.getElementById('form-wht');
  formWht.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateWHT();
  });
  ['wht-amount', 'wht-beneficiary', 'wht-service'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateWHT);
  });
}

// 1. PITA / PAYE Calculation
async function calculatePITA() {
  const gross = parseFloat(document.getElementById('pita-gross').value) || 0;
  const pensionInput = document.getElementById('pita-pension').value;
  const nhfInput = document.getElementById('pita-nhf').value;
  const nhis = parseFloat(document.getElementById('pita-nhis').value) || 0;
  const life = parseFloat(document.getElementById('pita-life').value) || 0;

  const payload = {
    grossAnnualIncome: gross,
    pensionContribution: pensionInput !== '' ? parseFloat(pensionInput) : undefined,
    nhfContribution: nhfInput !== '' ? parseFloat(nhfInput) : undefined,
    nhisContribution: nhis,
    lifeAssurancePremium: life
  };

  try {
    const res = await fetch('/api/pita/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();

    document.getElementById('pita-effective-rate').textContent = `${data.effectiveTaxRatePercent}% Effective Rate`;
    document.getElementById('val-monthly-gross').textContent = formatNaira(data.grossIncomeNaira / 12);
    document.getElementById('val-monthly-tax').textContent = formatNaira(data.finalMonthlyTaxNaira);
    document.getElementById('val-monthly-takehome').textContent = formatNaira(data.netMonthlyTakeHomeNaira);

    document.getElementById('step-cra').textContent = formatNaira(data.totalCRANaira);
    document.getElementById('step-total-reliefs').textContent = formatNaira(data.totalNonTaxableReliefsNaira);
    document.getElementById('step-taxable-income').textContent = formatNaira(data.taxableIncomeNaira);
    document.getElementById('step-annual-tax').textContent = formatNaira(data.finalAnnualTaxNaira);

    // Brackets Table
    const tbody = document.getElementById('pita-brackets-body');
    tbody.innerHTML = data.bracketBreakdown.map(b => `
      <tr>
        <td><strong>${b.bandName}</strong></td>
        <td>${formatNaira(b.taxableAmountKobo / 100)}</td>
        <td><span class="badge badge-indigo">${b.ratePercent}%</span></td>
        <td class="text-right text-amber"><strong>${formatNaira(b.taxPayableKobo / 100)}</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('PITA Calc error:', err);
  }
}

// 2. CITA Calculation
async function calculateCITA() {
  const turnover = parseFloat(document.getElementById('cita-turnover').value) || 0;
  const profit = parseFloat(document.getElementById('cita-profit').value) || 0;

  try {
    const res = await fetch('/api/cita/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grossTurnover: turnover, assessableProfit: profit })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();

    const tierBadge = document.getElementById('cita-tier-badge');
    if (data.companySizeCategory === 'SMALL') {
      tierBadge.className = 'badge badge-emerald';
      tierBadge.textContent = 'Small Business: 0% CIT Exemption (Turnover < ₦25M)';
    } else if (data.companySizeCategory === 'MEDIUM') {
      tierBadge.className = 'badge badge-cyan';
      tierBadge.textContent = 'Medium Business: 20% CIT Tier (₦25M–₦100M)';
    } else {
      tierBadge.className = 'badge badge-amber';
      tierBadge.textContent = 'Large Corporation: 30% Standard CIT (> ₦100M)';
    }

    document.getElementById('cita-rate-val').textContent = `${data.citRatePercent}%`;
    document.getElementById('cita-tax-val').textContent = formatNaira(data.citTaxPayableNaira);
    document.getElementById('cita-tet-val').textContent = formatNaira(data.tetPayableNaira);
    document.getElementById('cita-total-val').textContent = formatNaira(data.totalCorporateTaxNaira);

    const notesList = document.getElementById('cita-notes-list');
    notesList.innerHTML = `
      <h5>Statutory References & Basis:</h5>
      ${data.statutoryNotes.map(n => `<div class="step-row"><span>${escapeHtml(n)}</span></div>`).join('')}
    `;
  } catch (err) {
    console.error('CITA Calc error:', err);
  }
}

// 3. VAT Calculation
async function calculateVAT() {
  const amount = parseFloat(document.getElementById('vat-amount').value) || 0;
  const category = document.getElementById('vat-category').value;

  try {
    const res = await fetch('/api/vat/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionAmount: amount, itemCategory: category })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();

    const statusBadge = document.getElementById('vat-status-badge');
    if (data.isExempt) {
      statusBadge.className = 'badge badge-emerald';
      statusBadge.textContent = 'Statutory VAT Exempt / Zero-Rated';
    } else {
      statusBadge.className = 'badge badge-amber';
      statusBadge.textContent = 'Standard 7.5% Taxable';
    }

    document.getElementById('vat-amount-val').textContent = formatNaira(data.vatAmountNaira);
    document.getElementById('vat-total-val').textContent = formatNaira(data.totalWithVATNaira);
    document.getElementById('vat-exemption-note').textContent = data.exemptionReason || 'Standard VAT rate applies under VAT Act (as amended).';
  } catch (err) {
    console.error('VAT Calc error:', err);
  }
}

// 4. WHT Calculation
async function calculateWHT() {
  const amount = parseFloat(document.getElementById('wht-amount').value) || 0;
  const beneficiary = document.getElementById('wht-beneficiary').value;
  const service = document.getElementById('wht-service').value;

  try {
    const res = await fetch('/api/wht/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionAmount: amount, beneficiaryType: beneficiary, serviceType: service })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();

    document.getElementById('wht-rate-val').textContent = `${data.whtRatePercent}%`;
    document.getElementById('wht-deduction-val').textContent = formatNaira(data.whtDeductionNaira);
    document.getElementById('wht-net-val').textContent = formatNaira(data.netPayableToVendorNaira);
    document.getElementById('wht-agency-val').textContent = data.statutoryRemittanceTarget === 'STATE_SIRS' 
      ? 'State Internal Revenue Service (SIRS / LIRS)'
      : 'Federal Inland Revenue Service (FIRS)';
  } catch (err) {
    console.error('WHT Calc error:', err);
  }
}

// 5. Calendar Deadlines
async function loadCalendarDeadlines() {
  try {
    const res = await fetch('/api/calendar/deadlines');
    const deadlines = await res.json();
    const tbody = document.getElementById('calendar-table-body');

    tbody.innerHTML = deadlines.map(d => `
      <tr>
        <td><strong>${escapeHtml(d.obligationName)}</strong><br><span class="text-dim text-sm">${d.statutorySource}</span></td>
        <td><span class="badge ${d.jurisdiction === 'STATE_SIRS' ? 'badge-indigo' : 'badge-emerald'}">${d.jurisdiction}</span></td>
        <td>${d.frequency}</td>
        <td><span class="mono">${d.nextFilingDueDate}</span><br><span class="text-dim text-sm">${d.statutoryDeadlineDescription}</span></td>
        <td><span class="badge badge-amber">${d.daysRemaining} days</span></td>
        <td class="text-sm text-muted">${escapeHtml(d.penaltiesForDefault)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load calendar deadlines:', err);
  }
}

// 6. Rules Library
async function loadRulesLibrary() {
  try {
    const res = await fetch('/api/rules/all');
    const rules = await res.json();
    const container = document.getElementById('rules-library-container');

    container.innerHTML = rules.map(r => `
      <div class="rule-card">
        <div class="rule-card-header">
          <span class="badge badge-cyan">${r.taxType}</span>
          <span class="mono text-dim text-sm">v${r.version}</span>
        </div>
        <div class="rule-title">${r.taxType} Statutory Framework</div>
        <div class="rule-source">${escapeHtml(r.statutorySource)}</div>
        <div class="rule-meta">
          Effective: <span class="mono">${r.effectiveFrom}</span> to <span class="mono">${r.effectiveTo || 'Present'}</span><br>
          Verified: <span class="mono">${r.verificationDate}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load rules library:', err);
  }
}

function formatNaira(amount) {
  if (isNaN(amount)) return '₦0';
  return '₦' + Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
