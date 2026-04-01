# ChartingHero MCP - Blueprint

Phase tracking document for ChartingHero MCP server development.

## Current Status

**Phase:** ChartingHero Rebrand Complete / Marketplace Ready
**Branch:** `polish/marketplace-readiness`
**Last Updated:** 2026-04-01

**What's built:** 11 MCP tools (3 core + 8 workflow), visit state machine, PHI-safe logging, clinical validation, Supabase dashboard sync, ChartingHero product identity with Vivian persona, 76 tests passing.

**What's next:** Tier 3 clinical assessment tools (record_clinical_data, reconcile_medications). Requires real EMR data for Tier 4 (OASIS).

---

## Tool Roadmap

14 MCP tools covering 22 clinical operations across 4 tiers. Full specifications in `prds/RATCHET-PRD.yaml`.

### Tier 1: Core (3 tools) — IMPLEMENTED

| Tool | Operations | Tests |
|------|-----------|-------|
| `search_patient` | Search by name, ID, phone, status | 10 |
| `create_visit_note` | Full visit documentation with vitals, SOAP, interventions | 10 |
| `get_patient_history` | Visit history with date filtering and summary mode | 14 |

### Tier 2: Workflow (8 tools) — IMPLEMENTED

| Tool | Operations | Dependency |
|------|-----------|------------|
| `get_care_team` | Retrieve care team for a patient | None |
| `get_schedule` | Query schedule by nurse, date range, patient | None |
| `start_visit` | Transition visit: scheduled → in_progress | Schedule data |
| `update_visit_note` | Incremental field merge on in-progress visits | start_visit |
| `complete_visit` | Validate and finalize visit | start_visit |
| `cancel_visit` | Cancel with required reason | start_visit |
| `schedule_next_visit` | Create follow-up from completed visit context | get_schedule |
| `manage_care_plan` | get / add_goal / update_goal (action param) | None |

**Implementation order:** get_care_team → get_schedule → start_visit → update_visit_note → complete_visit → cancel_visit → schedule_next_visit → manage_care_plan

### Tier 3: Clinical (2 tools) — NEXT PHASE

| Tool | Operations | Notes |
|------|-----------|-------|
| `record_clinical_data` | wound / pain / fall_risk / functional_status / neurological | Assessment-type-specific schemas |
| `reconcile_medications` | Full medication reconciliation with status tracking | Requires medication list types |

### Tier 4: Regulatory (1 tool) — FUTURE (requires EMR)

| Tool | Operations | Notes |
|------|-----------|-------|
| `manage_oasis` | get_template / populate / validate | CMS OASIS-E1 items, needs real EMR data |

---

## Completed Phases

### Phase 1: Mock Mode Implementation ✅ (Dec 2024)

- [x] MCP server infrastructure (TypeScript, stdio transport)
- [x] TypeScript types for EMR data (Patient, Visit, VitalSigns)
- [x] Mock data layer (5 synthetic patients — Agatha Christie characters)
- [x] 3 core tools: search_patient, create_visit_note, get_patient_history
- [x] PHI-safe logger with field-level redaction
- [x] Unit tests (34 passing)

### Phase 2: Marketplace Polish ✅ (Mar 2026)

- [x] Clinical vital sign validation (BP, HR, temp, O2, pain, respiratory)
- [x] Date/time format validation
- [x] SECURITY.md with HIPAA compliance roadmap
- [x] React ErrorBoundary on dashboard
- [x] DEMO banner (synthetic data disclaimer)
- [x] Dashboard branding (ChartingHero icon + text)
- [x] Aligned mock data between MCP server and dashboard
- [x] PHI sanitization bug fixes (camelCase matching, message string redaction)
- [x] 14 PHI sanitization tests
- [x] README rewrite for marketplace audience
- [x] server.json with Supabase env vars
- [x] MIT LICENSE

### Phase 3: Tool Suite Expansion ✅ (Mar 2026)

- [x] PRD formalized: 14 tools, 22 operations, full parameter schemas
- [x] Visit state machine (scheduled → in_progress → completed/cancelled)
- [x] 8 Tier 2 mock tools implemented
- [x] Tests for visit lifecycle, scheduling, care planning (42 new tests, 76 total)
- [x] Updated tool registration in index.ts
- [x] Dashboard updated to display new data types

### Phase 4: ChartingHero Rebrand ✅ (Mar 2026)

- [x] Marketplace application rewrite (product name → ChartingHero, AI persona → Vivian)
- [x] MCP server README rewrite (ChartingHero product story, Vivian persona)
- [x] Dashboard data alignment (seed.sql, patients.json aligned to mock-data.ts)
- [x] RATCHET-INTEGRATION.md updated with correct patient names, env var placeholders
- [x] PRD metadata updated to reflect implementation status

---

## Architecture

```
src/
├── index.ts                  # MCP server entry (stdio transport)
├── config.ts                 # Environment + mode configuration
├── tools/                    # MCP tool definitions + handlers
│   ├── search-patient.ts     # Tier 1 ✅
│   ├── create-visit-note.ts  # Tier 1 ✅
│   ├── get-patient-history.ts # Tier 1 ✅
│   ├── get-care-team.ts      # Tier 2 ✅
│   ├── get-schedule.ts       # Tier 2 ✅
│   ├── start-visit.ts        # Tier 2 ✅
│   ├── update-visit-note.ts  # Tier 2 ✅
│   ├── complete-visit.ts     # Tier 2 ✅
│   ├── cancel-visit.ts       # Tier 2 ✅
│   ├── schedule-next-visit.ts # Tier 2 ✅
│   └── manage-care-plan.ts   # Tier 2 ✅
├── services/
│   ├── patient-service.ts    # Business logic
│   ├── mock-data.ts          # Synthetic patient/visit data
│   ├── visit-state.ts        # Visit state machine ✅
│   └── supabase-service.ts   # Dashboard sync
├── types/
│   └── index.ts              # TypeScript interfaces
└── utils/
    ├── logger.ts             # PHI-safe logger
    └── errors.ts             # Typed error classes
```

---

## Blockers

| Blocker | Required From | Status | Impact |
|---------|---------------|--------|--------|
| EMR API Documentation | PointCare/Axxess | Not requested | Blocks production API integration |
| Sandbox Credentials | EMR vendor | Not requested | Blocks integration testing |
| Supabase BAA | Supabase Enterprise | Not started | Blocks HIPAA compliance |

**Workaround:** Mock mode with synthetic data covers all development and demo scenarios.

---

## Key Files

| File | Purpose |
|------|---------|
| `prds/RATCHET-PRD.yaml` | Full 14-tool specification with schemas |
| `server.json` | MCP registry manifest |
| `SECURITY.md` | PHI handling policy + HIPAA roadmap |
| `CLAUDE.md` | Development instructions |
