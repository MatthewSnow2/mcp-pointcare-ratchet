/**
 * complete_visit MCP Tool
 *
 * Validates and finalizes an in-progress visit note.
 */

import { completeVisit } from '../services/patient-service.js';
import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const completeVisitTool = {
  name: 'complete_visit',
  description: `Complete and sign an in-progress visit note. Validates that all required SOAP fields (subjective, objective, assessment, plan) are present before finalizing.

Records the time-out, calculates duration, and signs the note. Once completed, the visit cannot be edited.

Examples:
- "Complete visit VN-30001"
- "Sign off on Jane Marple's visit"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      visitId: {
        type: 'string',
        description: 'Visit note ID to complete (e.g., VN-30001)',
      },
    },
    required: ['visitId'],
  },
};

export async function executeCompleteVisit(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const config = getConfig();

  try {
    const result = await completeVisit(String(args.visitId || ''));

    let text = '';
    if (config.mockMode) {
      text += '⚠️ MOCK MODE: Using test data\n\n';
    }

    text += `✅ ${result.message}\n\n`;
    text += `**Visit Summary:**\n`;
    text += `• Patient: ${result.visit.patientId}\n`;
    text += `• Date: ${result.visit.visitDate}\n`;
    text += `• Time: ${result.visit.timeIn} — ${result.visit.timeOut}\n`;
    text += `• Duration: ${result.visit.duration} min\n`;
    text += `• Signed by: ${result.visit.signedBy}\n`;
    text += `• Signed at: ${result.visit.signedAt}\n`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    logger.error('complete_visit failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { content: [formatErrorForMcp(error)], isError: true };
  }
}
