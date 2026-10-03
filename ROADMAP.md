# Nigerian Tax Platform — Development Roadmap

**Project**: `nigerian-tax`  
**Current Status**: `PRODUCTION_READY`  
**Current Milestone**: `M5: Verification & Statutory Audit Gate (Complete)`  
**Last Updated**: 2026-10-03  

---

## 1. Development Milestones

### Milestone 1: Statutory Research & Rule Engine Model (Completed)
- [x] Research and transcribe authoritative statutory acts (PITA, CITA, VATA, Finance Acts 2019–2023).
- [x] Build versioned JSON rule definitions with effective dating and gazette references.
- [x] Implement `RulesRegistry` supporting historical and current tax years.

### Milestone 2: PITA & PAYE Calculation Engine (Completed)
- [x] Implement Consolidated Relief Allowance (CRA), Pension (8%), NHF (2.5%), and NHIS deduction calculations.
- [x] Implement graduated tax band calculator (7% to 24%) with minimum tax floor validation.
- [x] 100% test coverage against official statutory formulas in integer kobo.

### Milestone 3: SME Companies Income Tax & VAT Engine (Completed)
- [x] Implement Small Business CITA exemption rules (< ₦25M turnover = 0% CIT, 0% TET) and Medium/Large tiers.
- [x] Implement VAT calculation (7.5%) with exempt and zero-rated schedule checks.
- [x] Build Withholding Tax (WHT) rates calculator by beneficiary and transaction type.

### Milestone 4: Compliance Calendar, User Portal & Educational Hub (Completed)
- [x] Build statutory filing reminder calendar with countdown and penalty calculators.
- [x] Build interactive glassmorphic web portal with live payslip breakdown and SME tax estimator.
- [x] Add educational explainers and verifiable statutory rule library.

### Milestone 5: Verification & Statutory Audit Gate (Completed)
- [x] 16/16 unit and integration tests passing across all suites.
- [x] Live API verification on `http://localhost:6500`.
- [x] Verified zero floating-point arithmetic throughout the codebase.
- [x] Synchronized all persistent engineering documentation.
