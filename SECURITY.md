# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ChartingHero MCP, please report it responsibly:

- **Email**: security@memyselfplusai.com
- **Response time**: We aim to acknowledge reports within 48 hours

Please do **not** open a public GitHub issue for security vulnerabilities.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Security Considerations

### Protected Health Information (PHI)

ChartingHero is designed for healthcare environments. Our PHI-safe engineering includes:

- **Log sanitization**: All patient identifiers, names, diagnoses, and clinical data are automatically redacted from logs via field-level filtering
- **Sensitive field redaction**: Fields matching PHI patterns (name, DOB, SSN, diagnosis, medication, notes) are replaced with `[REDACTED]` before any log output
- **Audit trail**: Operations are logged with success/failure status and duration without exposing patient data
- **stderr logging**: All log output goes to stderr to avoid interference with the MCP stdio transport — no PHI can leak into tool responses via logging

### Authentication & Authorization

- **Current state (Mock Mode)**: No authentication required — synthetic data only
- **Production mode**: Will require `POINTCARE_API_KEY` for EMR API access. API keys should be provided via environment variables, never hardcoded

### Data Storage

- **Mock mode**: All data is in-memory only — nothing persists to disk
- **Supabase sync** (optional): When enabled, visit notes are synced to a Supabase PostgreSQL database for dashboard display. Connection requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables

### Dependencies

We monitor dependencies for known vulnerabilities. Run `npm audit` to check the current state.

## HIPAA Compliance Roadmap

ChartingHero is not yet HIPAA-compliant. Our roadmap includes:

1. **Row-Level Security (RLS)** on all Supabase tables
2. **Business Associate Agreement (BAA)** with Supabase (requires Enterprise plan)
3. **End-to-end encryption** for data in transit and at rest
4. **Audit logging** with tamper-proof storage
5. **Access controls** with role-based permissions

## Best Practices for Users

- Store API keys in environment variables, not in code or config files
- Use the `CHARTINGHERO_MOCK_MODE=true` flag when testing or demonstrating
- Do not use real patient data in mock mode or development environments
- Review the [MCP security documentation](https://modelcontextprotocol.io/docs/concepts/security) for transport-level security guidance
