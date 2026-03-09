/**
 * schedule_next_visit MCP Tool
 *
 * Creates a follow-up visit on the schedule.
 */

import { scheduleNextVisit } from '../services/patient-service.js';
import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { formatErrorForMcp } from '../utils/errors.js';
import type { ScheduleNextVisitParams, VisitType } from '../types/index.js';

export const scheduleNextVisitTool = {
  name: 'schedule_next_visit',
  description: `Schedule a follow-up visit for a patient. Creates a new entry on the visit schedule.

Typically used after completing a visit to schedule the next one. The patient's address is pulled automatically from their record.

Examples:
- "Schedule Jane Marple for next Monday at 9am"
- "Schedule a follow-up PT visit for PT-10004 on 2024-12-26 at 14:00"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      patientId: {
        type: 'string',
        description: 'Patient ID (e.g., PT-10001)',
      },
      visitType: {
        type: 'string',
        enum: ['skilled_nursing', 'physical_therapy', 'occupational_therapy', 'speech_therapy', 'home_health_aide', 'social_work', 'initial_assessment', 'recertification', 'discharge', 'other'],
        description: 'Type of visit to schedule',
      },
      scheduledDate: {
        type: 'string',
        description: 'Date for the visit (YYYY-MM-DD)',
      },
      scheduledTime: {
        type: 'string',
        description: 'Time for the visit (HH:MM)',
      },
      estimatedDuration: {
        type: 'number',
        description: 'Estimated visit duration in minutes (default: 45)',
      },
      notes: {
        type: 'string',
        description: 'Notes for the scheduled visit',
      },
    },
    required: ['patientId', 'visitType', 'scheduledDate', 'scheduledTime'],
  },
};

export async function executeScheduleNextVisit(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const config = getConfig();

  try {
    const params: ScheduleNextVisitParams = {
      patientId: String(args.patientId || ''),
      visitType: (args.visitType as VisitType) || 'skilled_nursing',
      scheduledDate: String(args.scheduledDate || ''),
      scheduledTime: String(args.scheduledTime || ''),
      estimatedDuration: args.estimatedDuration ? Number(args.estimatedDuration) : undefined,
      notes: args.notes ? String(args.notes) : undefined,
    };

    const result = await scheduleNextVisit(params);

    let text = '';
    if (config.mockMode) {
      text += '⚠️ MOCK MODE: Using test data\n\n';
    }

    text += `✅ ${result.message}\n\n`;
    text += `**Scheduled Visit:** ${result.visit.id}\n`;
    text += `• Patient: ${result.visit.patientName}\n`;
    text += `• Date: ${result.visit.scheduledDate}\n`;
    text += `• Time: ${result.visit.scheduledTime}\n`;
    text += `• Type: ${result.visit.visitType.replace(/_/g, ' ')}\n`;
    text += `• Duration: ~${result.visit.estimatedDuration} min\n`;
    text += `• Address: ${result.visit.address}\n`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    logger.error('schedule_next_visit failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { content: [formatErrorForMcp(error)], isError: true };
  }
}
