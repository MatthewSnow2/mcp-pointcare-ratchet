/**
 * cancel_visit MCP Tool
 *
 * Cancels a scheduled or in-progress visit with a required reason.
 */

import { cancelVisit } from '../services/patient-service.js';
import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const cancelVisitTool = {
  name: 'cancel_visit',
  description: `Cancel a scheduled or in-progress visit. A cancellation reason is required for documentation and compliance.

Can cancel both scheduled visits (SV-xxxxx) and in-progress visit notes (VN-xxxxx). Completed visits cannot be cancelled.

Examples:
- "Cancel visit SV-40001 — patient hospitalized"
- "Cancel today's visit with Jane Marple, she's feeling too ill"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      visitId: {
        type: 'string',
        description: 'Visit ID to cancel (SV-xxxxx or VN-xxxxx)',
      },
      reason: {
        type: 'string',
        description: 'Required reason for cancellation',
      },
    },
    required: ['visitId', 'reason'],
  },
};

export async function executeCancelVisit(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const config = getConfig();

  try {
    const result = await cancelVisit(
      String(args.visitId || ''),
      String(args.reason || '')
    );

    let text = '';
    if (config.mockMode) {
      text += '⚠️ MOCK MODE: Using test data\n\n';
    }

    text += `🚫 ${result.message}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    logger.error('cancel_visit failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { content: [formatErrorForMcp(error)], isError: true };
  }
}
