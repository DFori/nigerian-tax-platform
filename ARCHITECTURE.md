# Nigerian Tax Platform — Architecture & Rule Engine Design

**Project**: `nigerian-tax`  
**Status**: `PROPOSED ARCHITECTURAL BASELINE`  
**Last Updated**: 2026-10-03  

---

## 1. Versioned Tax Rule Engine Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ User Input / Calculation Request                            │
│ (Gross Income, Deductions, Business Turnover, Tax Year)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ Rule Registry & Version Resolver                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Query: (tax_type='PITA', tax_year=2024, jurisdiction='NG')│ │
│ │ Resolves -> Rule Definition Set v2.3.0                   │ │
│ │ (Valid from 2020-01-01 to Present; Source: Finance Act)  │ │
│ └────────────────────────────┬────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ Pure Deterministic Calculation Engine                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Step 1: Calculate Statutory Deductions (Pension, NHF)   │ │
│ │ Step 2: Compute Consolidated Relief Allowance (CRA)     │ │
│ │ Step 3: Compute Chargeable Income                       │ │
│ │ Step 4: Apply Graduated Bracket Rates (7% - 24%)        │ │
│ │ Step 5: Check Minimum Tax Floor (1% Gross)              │ │
│ └────────────────────────────┬────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ Calculation Output & Audit Breakdown                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ - Total Tax Payable (in Kobo / Integer Naira)           │ │
│ │ - Step-by-Step Mathematical Traceability Log            │ │
│ │ - Authoritative Citation & Verification Badge           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Rule Definition Schema

```json
{
  "rule_id": "pita_cra_2020",
  "tax_type": "PITA",
  "jurisdiction": "NIGERIA_FEDERAL",
  "effective_from": "2020-01-01",
  "effective_to": null,
  "statutory_source": "Finance Act 2020 Section 33",
  "verification_date": "2026-10-03",
  "parameters": {
    "cra_fixed_base": 20000000, 
    "cra_gross_percent_alt": 0.01,
    "cra_additional_percent": 0.20,
    "tax_brackets": [
      {"limit": 30000000, "rate": 0.07},
      {"limit": 30000000, "rate": 0.11},
      {"limit": 50000000, "rate": 0.15},
      {"limit": 50000000, "rate": 0.19},
      {"limit": 160000000, "rate": 0.21},
      {"limit": null, "rate": 0.24}
    ]
  }
}
```
