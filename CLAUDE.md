# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**ChartingHero** is an MCP (Model Context Protocol) server for PointCare EMR integration. It enables Claude to document patient visits directly into the Electronic Medical Records system, reducing administrative burden for home health nurses.

## Origin Story

ChartingHero evolved from the **M2AI NurseCall** n8n workflow (ID: 3i0JkX1GdDXnTQbx), which was built to help home health nurses with visit documentation. The original workflow:
- Receives text via Twilio from nurses in the field
- Uses phone number as unique identifier
- Triggers VAPI call to collect visit notes
- Emails summary back to nurse

ChartingHero extends this by providing direct EMR integration via MCP tools.

## Technical Stack

- **SDK**: TypeScript (@modelcontextprotocol/sdk)
- **Runtime**: Node.js 18+
- **Target API**: PointCare EMR
- **Transport**: stdio (for Claude Desktop integration)

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Run with tsx (development)
npm run test         # Run Jest tests
npm run lint         # Run ESLint
```

## Project Structure

```
chartinghero/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── config.ts             # Environment + mode configuration
│   ├── tools/                # MCP tool definitions + handlers
│   │   ├── search-patient.ts
│   │   ├── create-visit-note.ts
│   │   ├── get-patient-history.ts
│   │   ├── get-care-team.ts
│   │   ├── get-schedule.ts
│   │   ├── start-visit.ts
│   │   ├── update-visit-note.ts
│   │   ├── complete-visit.ts
│   │   ├── cancel-visit.ts
│   │   ├── schedule-next-visit.ts
│   │   └── manage-care-plan.ts
│   ├── services/
│   │   ├── patient-service.ts
│   │   ├── mock-data.ts
│   │   ├── visit-state.ts
│   │   └── supabase-service.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts
│       └── errors.ts
├── tests/
│   └── *.test.ts             # Jest test suite (76 tests)
├── prds/
│   └── RATCHET-PRD.yaml      # MCP specification
├── docs/
│   └── API_REQUIREMENTS.md
├── package.json
├── tsconfig.json
└── .env.example
```

## MCP Tools

14 tools covering 22 clinical operations (11 implemented, 3 designed). Full specs in `prds/RATCHET-PRD.yaml`.

| Tool | Tier | Status | Description |
|------|------|--------|-------------|
| `search_patient` | Core | ✅ Mock | Find patient by name/ID/phone |
| `create_visit_note` | Core | ✅ Mock | Document a full patient visit |
| `get_patient_history` | Core | ✅ Mock | Retrieve patient visit history |
| `get_care_team` | Workflow | ✅ Mock | Patient care team lookup |
| `get_schedule` | Workflow | ✅ Mock | Query nurse/patient schedules |
| `start_visit` | Workflow | ✅ Mock | Transition visit to in_progress |
| `update_visit_note` | Workflow | ✅ Mock | Incremental visit note updates |
| `complete_visit` | Workflow | ✅ Mock | Validate and finalize visit |
| `cancel_visit` | Workflow | ✅ Mock | Cancel visit with reason |
| `schedule_next_visit` | Workflow | ✅ Mock | Create follow-up visit |
| `manage_care_plan` | Workflow | ✅ Mock | Get/add/update care plan goals |
| `record_clinical_data` | Clinical | Designed | Wound, pain, fall risk, functional, neuro assessments |
| `reconcile_medications` | Clinical | Designed | Medication reconciliation |
| `manage_oasis` | Regulatory | Designed | OASIS template/populate/validate |

**Status**: 11 tools working in mock mode (3 core + 8 workflow). 3 remaining tools (clinical + regulatory) require real EMR data. See `BLUEPRINT.md` for roadmap.

## Environment Variables

```bash
POINTCARE_API_URL=        # PointCare API base URL
POINTCARE_API_KEY=        # API key or token
POINTCARE_CLIENT_ID=      # OAuth client ID (if applicable)
POINTCARE_CLIENT_SECRET=  # OAuth client secret (if applicable)
```

## Current Status

**Phase**: Marketplace Submission — Tool Suite Expansion
**Branch**: `polish/marketplace-readiness`
**Tests**: 76 passing (Jest)
**Next milestone**: Tier 3 clinical tools (record_clinical_data, reconcile_medications)

## Related Projects

- **Grimlock**: Autonomous MCP Server Factory that built ChartingHero
- **M2AI NurseCall**: n8n workflow that will integrate with ChartingHero

## Scope Boundaries

**In scope:**
- MCP server implementation
- PointCare API integration
- Unit and integration tests
- Setup documentation

**Out of scope:**
- n8n workflow modifications (handled separately)
- HIPAA compliance infrastructure (company responsibility)
- Production deployment (Week 2 human task)
