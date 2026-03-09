/**
 * update_visit_note MCP Tool
 *
 * Incrementally updates an in-progress visit note with new data.
 */

import { updateVisitNote } from '../services/patient-service.js';
import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { formatErrorForMcp } from '../utils/errors.js';
import type { CreateVisitNoteParams, VitalSigns } from '../types/index.js';

export const updateVisitNoteTool = {
  name: 'update_visit_note',
  description: `Update an in-progress visit note with additional data. Fields are merged — vitals are merged by key, interventions and education are appended, SOAP fields are replaced.

Use this tool to add information incrementally during a visit. The visit must be in "in_progress" status (use start_visit first).

Examples:
- Add vitals: "BP 138/82, HR 72, O2 96%"
- Add SOAP: "Subjective: patient reports feeling well..."
- Add interventions: "Medication reconciliation, wound assessment"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      visitId: {
        type: 'string',
        description: 'Visit note ID (e.g., VN-30001)',
      },
      vitalSigns: {
        type: 'object',
        description: 'Vital signs to merge into the visit note',
        properties: {
          bloodPressureSystolic: { type: 'number' },
          bloodPressureDiastolic: { type: 'number' },
          heartRate: { type: 'number' },
          respiratoryRate: { type: 'number' },
          temperature: { type: 'number' },
          temperatureUnit: { type: 'string', enum: ['F', 'C'] },
          oxygenSaturation: { type: 'number' },
          weight: { type: 'number' },
          weightUnit: { type: 'string', enum: ['lbs', 'kg'] },
          painLevel: { type: 'number', description: '0-10 scale' },
        },
      },
      subjective: { type: 'string', description: 'Patient reported symptoms/concerns' },
      objective: { type: 'string', description: 'Nurse observations' },
      assessment: { type: 'string', description: 'Clinical assessment' },
      plan: { type: 'string', description: 'Care plan/next steps' },
      interventions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Interventions performed (appended to existing)',
      },
      patientResponse: { type: 'string', description: 'How patient responded to care' },
      education: {
        type: 'array',
        items: { type: 'string' },
        description: 'Patient education provided (appended to existing)',
      },
      notes: { type: 'string', description: 'Additional notes' },
      nextVisitDate: { type: 'string', description: 'Next visit date (YYYY-MM-DD)' },
    },
    required: ['visitId'],
  },
};

export async function executeUpdateVisitNote(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const config = getConfig();

  try {
    const updates: Partial<CreateVisitNoteParams> = {};
    if (args.vitalSigns) updates.vitalSigns = args.vitalSigns as VitalSigns;
    if (args.subjective !== undefined) updates.subjective = String(args.subjective);
    if (args.objective !== undefined) updates.objective = String(args.objective);
    if (args.assessment !== undefined) updates.assessment = String(args.assessment);
    if (args.plan !== undefined) updates.plan = String(args.plan);
    if (args.interventions) updates.interventions = args.interventions as string[];
    if (args.patientResponse !== undefined) updates.patientResponse = String(args.patientResponse);
    if (args.education) updates.education = args.education as string[];
    if (args.notes !== undefined) updates.notes = String(args.notes);
    if (args.nextVisitDate !== undefined) updates.nextVisitDate = String(args.nextVisitDate);

    const result = await updateVisitNote(String(args.visitId || ''), updates);

    let text = '';
    if (config.mockMode) {
      text += '⚠️ MOCK MODE: Using test data\n\n';
    }

    text += `✅ ${result.message}\n\n`;

    const v = result.visit;
    text += '**Current visit note status:**\n';
    text += `• Vitals: ${v.vitalSigns ? '✅' : '❌'}\n`;
    text += `• Subjective: ${v.subjective ? '✅' : '❌'}\n`;
    text += `• Objective: ${v.objective ? '✅' : '❌'}\n`;
    text += `• Assessment: ${v.assessment ? '✅' : '❌'}\n`;
    text += `• Plan: ${v.plan ? '✅' : '❌'}\n`;
    text += `• Interventions: ${v.interventions?.length || 0}\n`;
    text += `• Education: ${v.education?.length || 0}\n`;

    const ready = v.subjective && v.objective && v.assessment && v.plan;
    text += `\n${ready ? '✅ Ready to complete — use `complete_visit`.' : '⚠️ SOAP not complete — add missing fields before completing.'}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    logger.error('update_visit_note failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { content: [formatErrorForMcp(error)], isError: true };
  }
}
