# ChartingRelief — AI Clinical Documentation for Home Health

**Charting relief for nurses, powered by Claude.** ChartingRelief eliminates 80-85% of post-visit documentation time for home health nurses by transforming natural-language visit dictation into structured EMR records.

> Built by [MeMyselfPlusAI](https://memyselfplusai.com) — an RN co-founder with AccentCare field experience + an engineer building at the intersection of AI and healthcare.

## The Problem

Home health nurses see 5-7 patients per day, then spend 1-2 hours every evening manually entering vitals, SOAP notes, care plans, and education checklists into EMR systems. That documentation burden drives 50%+ annual nurse turnover and forces agencies to reject 60-70% of patient referrals due to staffing shortages.

## How It Works

```
Nurse describes visit in natural language
        │
        ▼
Claude + Vivian (AI clinical assistant)
  uses Ratchet MCP tools to structure data
        │
        ▼
EMR System (via API) + Live Dashboard
```

**Vivian** is the AI clinical documentation assistant — named after [Vivian Bullwinkel](https://en.wikipedia.org/wiki/Vivian_Bullwinkel), the Australian military nurse who survived the Bangka Island massacre in WWII and returned to nursing. Vivian guides nurses through visit documentation using qualifying questions, then structures their natural-language responses into validated clinical data.

**Ratchet** is the MCP server that gives Claude access to 11 clinical documentation tools:

### Core Tools (Tier 1)

| Tool | What It Does |
|------|-------------|
| `search_patient` | Find patients by name, ID, or phone number |
| `create_visit_note` | Document a full visit — vitals, SOAP notes, interventions, education |
| `get_patient_history` | Retrieve previous visits for clinical context |

### Workflow Tools (Tier 2)

| Tool | What It Does |
|------|-------------|
| `get_care_team` | Look up care team for a patient |
| `get_schedule` | Query schedule by nurse, date range, or patient |
| `start_visit` | Transition visit from scheduled to in-progress |
| `update_visit_note` | Incrementally update an in-progress visit note |
| `complete_visit` | Validate and finalize a visit |
| `cancel_visit` | Cancel a visit with required reason |
| `schedule_next_visit` | Create follow-up visits from completed visit context |
| `manage_care_plan` | Get, add, or update care plan goals |

### Planned Tools (Tier 3-4)

| Tool | Status | What It Does |
|------|--------|-------------|
| `record_clinical_data` | Designed | Wound, pain, fall risk, functional, and neurological assessments |
| `reconcile_medications` | Designed | Full medication reconciliation with status tracking |
| `manage_oasis` | Designed | OASIS-E1 template population and validation for CMS compliance |

## Screenshots

| Dashboard | Patient Detail |
|-----------|---------------|
| ![Dashboard](docs/dashboard-schedule.png) | ![Patient Detail](docs/patient-detail.png) |

*Screenshots show the companion [EMR Dashboard](https://github.com/m2ai-mcp-servers/ratchet-demo-emr) displaying data populated by Ratchet via Claude.*

## Quick Start

### Claude Desktop

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ratchet": {
      "command": "npx",
      "args": ["-y", "mcp-ratchet-clinical-charting"]
    }
  }
}
```

Restart Claude Desktop. Try: *"Search for patient Jane Marple"*

### From Source

```bash
git clone https://github.com/m2ai-mcp-servers/mcp-ratchet-clinical-charting.git
cd mcp-ratchet-clinical-charting
npm install
npm run build
npm test     # 76 tests passing
```

## PHI-Safe Engineering

Built for healthcare from day one — not retrofitted:

- **Log sanitization** — Patient IDs, names, diagnoses, medications, and notes are automatically redacted from all log output
- **Field-level redaction** — Sensitive fields are replaced with `[REDACTED]` before any data reaches stderr
- **Audit trail** — Operations logged with success/failure and duration, without exposing clinical data
- **Clinical validation** — Vital sign ranges validated (e.g., systolic BP 50-300, O2 sat 50-100%, pain 0-10)

See [SECURITY.md](SECURITY.md) for the full security policy and HIPAA compliance roadmap.

## Demo Mode

Runs in **mock mode** by default — no API keys needed. Mock mode uses synthetic patient data from Agatha Christie characters (clearly fictional):

| ID | Name | Status | Primary Diagnosis |
|----|------|--------|-------------------|
| PT-10001 | Jane Marple | Active | Type 2 Diabetes, Hypertension, CHF |
| PT-10002 | Hercule Poirot | Active | Heart Failure, AFib, CKD Stage 3 |
| PT-10003 | Ariadne Oliver | Active | Parkinson's Disease |
| PT-10004 | Arthur Hastings | Active | Post-stroke rehab |
| PT-10005 | Felicity Lemon | Discharged | Hip replacement recovery |

### Example Conversation

```
You: "Search for patient Jane Marple"
Claude: Found 1 patient — Jane Marple (PT-10001), Active, Type 2 Diabetes

You: "Start a visit for PT-10001"
Claude: ✅ Visit SV-40001 started — Jane Marple, skilled nursing, in progress

You: "Update the visit. BP 138/82, HR 72, temp 98.4, O2 96%. Weight 165.
      Subjective: patient feeling well, blood sugars stable.
      Assessment: CHF stable, diabetes well controlled, BP slightly elevated.
      Plan: continue current meds, monitor BP, follow up in 3 days."
Claude: ✅ Visit note updated — vitals, SOAP, and plan recorded

You: "Complete the visit"
Claude: ✅ Visit completed — 45 min skilled nursing visit finalized

You: "Schedule a follow-up in 3 days"
Claude: ✅ Follow-up scheduled — Dec 23 at 09:00, skilled nursing
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `POINTCARE_API_URL` | No* | EMR API base URL |
| `POINTCARE_API_KEY` | No* | EMR API key |
| `SUPABASE_URL` | No | Supabase URL for dashboard sync |
| `SUPABASE_SERVICE_KEY` | No | Supabase key for dashboard sync |
| `RATCHET_MOCK_MODE` | No | Force mock mode (`true`/`false`) |
| `LOG_LEVEL` | No | `debug` / `info` / `warn` / `error` |

*Required for production EMR integration. Mock mode activates automatically when not set.

## Architecture

```
src/
├── index.ts              # MCP server entry (stdio transport)
├── config.ts             # Environment + mode configuration
├── tools/                # MCP tool definitions + handlers
│   ├── search-patient.ts
│   ├── create-visit-note.ts
│   ├── get-patient-history.ts
│   ├── get-care-team.ts
│   ├── get-schedule.ts
│   ├── start-visit.ts
│   ├── update-visit-note.ts
│   ├── complete-visit.ts
│   ├── cancel-visit.ts
│   ├── schedule-next-visit.ts
│   └── manage-care-plan.ts
├── services/             # Business logic + data layer
│   ├── patient-service.ts
│   ├── mock-data.ts
│   ├── visit-state.ts    # Visit lifecycle state machine
│   └── supabase-service.ts
├── types/                # TypeScript interfaces (Patient, Visit, VitalSigns)
└── utils/
    ├── logger.ts         # PHI-safe logger with field redaction
    └── errors.ts         # Typed error classes
```

## Development

```bash
npm run dev          # Watch mode (tsx)
npm test             # Jest (76 tests)
npm test -- --coverage
npm run build        # TypeScript → dist/
```

## Origin

ChartingRelief started as a multi-service voice workflow — Twilio SMS triggered a timer, VAPI voice agent called the nurse for qualifying questions, n8n processed the responses, and email delivered the recap. Four services to do what MCP now enables natively within the Claude ecosystem. The rebuild eliminated all middleware.

## Related Projects

- **[ChartingRelief EMR Dashboard](https://github.com/m2ai-mcp-servers/ratchet-demo-emr)** — React dashboard displaying visit data populated by this MCP server
- **[Live Demo](https://pointcare-emr-demo.netlify.app)** — Deployed dashboard with synthetic patient data

## License

MIT
