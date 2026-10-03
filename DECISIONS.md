# Nigerian Tax Platform — Architectural Decision Records (ADRs)

---

## ADR-TAX-001: Separation of Statutory Rules from Application Logic

- **Status**: `APPROVED`
- **Date**: 2026-10-03
- **Context**: Tax rates, thresholds (such as the ₦25M small business exemption), and relief percentages change frequently when Finance Acts are passed by the National Assembly. Hardcoding rules inside endpoints creates massive maintenance debt and outdated compliance advice.
- **Decision**: Represent all tax rules as externalized, version-controlled JSON data records with explicit effective date intervals (`effective_from`, `effective_to`), jurisdiction keys, and statutory source references.
- **Consequences**:
  - *Positive*: Updating tax rules for a new fiscal year requires updating rule files without modifying core calculation engine code.
  - *Negative*: Calculation engines must dynamically load and resolve the appropriate rule version matching the specified tax year.

---

## ADR-TAX-002: Explicit Disclaimer and Source Citation Requirement

- **Status**: `APPROVED`
- **Date**: 2026-10-03
- **Context**: Presenting automated calculations as authoritative tax advice without statutory citations creates serious legal liability for users and the platform.
- **Decision**: Every calculation response and UI breakdown must display the official Act citation, verification date, and a prominent disclaimer stating that the platform provides calculations for informational purposes and does not replace official tax clearance certificates.
- **Consequences**: Complete transparency and compliance safety.
