/**
 * get_care_team MCP Tool
 *
 * Retrieves the care team assigned to a patient.
 */

import { getCareTeam } from '../services/patient-service.js';
import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const getCareTeamTool = {
  name: 'get_care_team',
  description: `Get the care team assigned to a patient, including primary nurse, physician, and case manager.

Use this tool to look up who is responsible for a patient's care before starting a visit or making referrals.

Examples:
- "Who is on Jane Marple's care team?"
- "Get care team for PT-10001"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      patientId: {
        type: 'string',
        description: 'Patient ID (e.g., PT-10001)',
      },
    },
    required: ['patientId'],
  },
};

export async function executeGetCareTeam(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const config = getConfig();

  try {
    const response = await getCareTeam(String(args.patientId || ''));

    let text = '';
    if (config.mockMode) {
      text += '⚠️ MOCK MODE: Using test data\n\n';
    }

    text += `**Care Team for ${response.patientName}** (${response.patientId})\n`;
    text += `Agency: ${response.agency}\n\n`;

    for (const member of response.members) {
      text += `• **${member.role}:** ${member.name}`;
      if (member.phone) text += ` (${member.phone})`;
      text += '\n';
    }

    if (response.members.length === 0) {
      text += '_No care team members assigned._\n';
    }

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    logger.error('get_care_team failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { content: [formatErrorForMcp(error)], isError: true };
  }
}
