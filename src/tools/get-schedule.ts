/**
 * get_schedule MCP Tool
 *
 * Queries the visit schedule by nurse, patient, or date range.
 */

import { getSchedule } from '../services/patient-service.js';
import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { formatErrorForMcp } from '../utils/errors.js';
import type { GetScheduleParams } from '../types/index.js';

export const getScheduleTool = {
  name: 'get_schedule',
  description: `Query the visit schedule filtered by nurse, patient, or date range.

Returns scheduled visits with patient name, time, address, and visit type. Use this to plan your day or check upcoming visits for a patient.

Examples:
- "What's my schedule for today?" (nurseId + date)
- "When is PT-10001's next visit?" (patientId)
- "Show me this week's schedule" (startDate + endDate)`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      nurseId: {
        type: 'string',
        description: 'Nurse ID to filter by (e.g., RN-001)',
      },
      patientId: {
        type: 'string',
        description: 'Patient ID to filter by (e.g., PT-10001)',
      },
      date: {
        type: 'string',
        description: 'Specific date (YYYY-MM-DD). Defaults to showing all scheduled visits if not specified.',
      },
      startDate: {
        type: 'string',
        description: 'Start of date range (YYYY-MM-DD)',
      },
      endDate: {
        type: 'string',
        description: 'End of date range (YYYY-MM-DD)',
      },
    },
  },
};

export async function executeGetSchedule(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const config = getConfig();

  try {
    const params: GetScheduleParams = {
      nurseId: args.nurseId as string | undefined,
      patientId: args.patientId as string | undefined,
      date: args.date as string | undefined,
      startDate: args.startDate as string | undefined,
      endDate: args.endDate as string | undefined,
    };

    const response = await getSchedule(params);

    let text = '';
    if (config.mockMode) {
      text += '⚠️ MOCK MODE: Using test data\n\n';
    }

    if (response.visits.length === 0) {
      text += 'No scheduled visits found for the specified criteria.';
    } else {
      text += `**Schedule** (${response.total} visit${response.total !== 1 ? 's' : ''})\n\n`;

      let currentDate = '';
      for (const visit of response.visits) {
        if (visit.scheduledDate !== currentDate) {
          currentDate = visit.scheduledDate;
          text += `### ${currentDate}\n\n`;
        }
        text += `**${visit.scheduledTime}** — ${visit.patientName} (${visit.patientId})\n`;
        text += `  • Type: ${visit.visitType.replace(/_/g, ' ')}\n`;
        text += `  • Duration: ~${visit.estimatedDuration} min\n`;
        text += `  • Address: ${visit.address}\n`;
        text += `  • Status: ${visit.status}\n`;
        if (visit.notes) text += `  • Notes: ${visit.notes}\n`;
        text += '\n';
      }
    }

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    logger.error('get_schedule failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { content: [formatErrorForMcp(error)], isError: true };
  }
}
