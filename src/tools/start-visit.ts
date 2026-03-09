/**
 * start_visit MCP Tool
 *
 * Transitions a scheduled visit to in_progress and creates a visit note.
 */

import { startVisit } from '../services/patient-service.js';
import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const startVisitTool = {
  name: 'start_visit',
  description: `Start a scheduled visit, transitioning it to in-progress and creating a visit note.

Pass a scheduled visit ID (SV-xxxxx) to begin the visit. This records the start time and creates an editable visit note that you can update incrementally with update_visit_note.

Examples:
- "Start visit SV-40001"
- "Begin Jane Marple's scheduled visit"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      visitId: {
        type: 'string',
        description: 'Scheduled visit ID (e.g., SV-40001) or existing visit note ID (e.g., VN-20001)',
      },
    },
    required: ['visitId'],
  },
};

export async function executeStartVisit(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const config = getConfig();

  try {
    const result = await startVisit(String(args.visitId || ''));

    let text = '';
    if (config.mockMode) {
      text += '⚠️ MOCK MODE: Using test data\n\n';
    }

    text += `✅ ${result.message}\n\n`;
    text += `**Visit Note:** ${result.visit.id}\n`;
    text += `**Patient:** ${result.visit.patientId}\n`;
    text += `**Status:** ${result.visit.status}\n`;
    text += `**Time In:** ${result.visit.timeIn}\n`;
    text += `\nUse \`update_visit_note\` to add vitals, SOAP notes, and interventions.\n`;
    text += `Use \`complete_visit\` when documentation is finished.`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    logger.error('start_visit failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { content: [formatErrorForMcp(error)], isError: true };
  }
}
