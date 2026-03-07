# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Ratchet** is an MCP (Model Context Protocol) server for PointCare EMR integration. It enables Claude to document patient visits directly into the Electronic Medical Records system, reducing administrative burden for home health nurses.

## Origin Story

Ratchet evolved from the **M2AI NurseCall** n8n workflow (ID: 3i0JkX1GdDXnTQbx), which was built to help home health nurses with visit documentation. The original workflow:
- Receives text via Twilio from nurses in the field
- Uses phone number as unique identifier
- Triggers VAPI call to collect visit notes
- Emails summary back to nurse

Ratchet extends this by providing direct EMR integration via MCP tools.

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
ratchet/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── tools/             # Tool implementations
│   │   ├── search-patient.ts
│   │   ├── create-visit-note.ts
│   │   └── get-patient-history.ts
│   ├── resources/         # Resource handlers (if any)
│   └── prompts/           # Prompt templates (if any)
├── tests/
│   └── *.test.ts          # Jest test suite
├── prds/
│   └── RATCHET-PRD.yaml   # MCP specification
├── docs/
│   └── API_REQUIREMENTS.md
├── package.json
├── tsconfig.json
└── .env.example           # Required environment variables
```

## MCP Tools (Planned)

| Tool | Status | Description |
|------|--------|-------------|
| `search_patient` | Working (Mock) | Find patient by name/ID/phone |
| `create_visit_note` | Working (Mock) | Document a patient visit |
| `get_patient_history` | Working (Mock) | Retrieve patient visit history |

**Status**: Core tools working in mock mode. Production EMR API integration pending vendor API access.

## Environment Variables

```bash
POINTCARE_API_URL=        # PointCare API base URL
POINTCARE_API_KEY=        # API key or token
POINTCARE_CLIENT_ID=      # OAuth client ID (if applicable)
POINTCARE_CLIENT_SECRET=  # OAuth client secret (if applicable)
```

## Current Status

**Phase**: Mock Mode Complete — Ready for Claude Desktop Testing
**Next milestone**: Production EMR API integration (pending vendor API access)

## Related Projects

- **Grimlock**: Autonomous MCP Server Factory that will build Ratchet
- **M2AI NurseCall**: n8n workflow that will integrate with Ratchet

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
