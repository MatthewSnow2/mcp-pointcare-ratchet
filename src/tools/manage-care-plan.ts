/**
 * manage_care_plan MCP Tool
 *
 * Get, add goals, or update goals on a patient's care plan.
 */

import { manageCarePlan } from '../services/patient-service.js';
import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { formatErrorForMcp } from '../utils/errors.js';
import type { ManageCarePlanParams, CarePlanAction, CarePlanGoal } from '../types/index.js';

export const manageCarePlanTool = {
  name: 'manage_care_plan',
  description: `Manage a patient's care plan: view goals, add new goals, or update existing goal status.

Actions:
- "get" — Retrieve the current care plan and all goals
- "add_goal" — Add a new goal (requires goalDescription)
- "update_goal" — Update a goal's status or progress (requires goalId)

Examples:
- "Show me Jane Marple's care plan goals"
- "Add a goal for PT-10001: maintain blood pressure below 130/80"
- "Mark goal G-50002 as met"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      patientId: {
        type: 'string',
        description: 'Patient ID (e.g., PT-10001)',
      },
      action: {
        type: 'string',
        enum: ['get', 'add_goal', 'update_goal'],
        description: 'Action to perform on the care plan',
      },
      goalDescription: {
        type: 'string',
        description: 'Description for a new goal (required for add_goal)',
      },
      targetDate: {
        type: 'string',
        description: 'Target date for a new goal (YYYY-MM-DD)',
      },
      goalId: {
        type: 'string',
        description: 'Goal ID to update (required for update_goal)',
      },
      status: {
        type: 'string',
        enum: ['active', 'met', 'not_met', 'revised', 'discontinued'],
        description: 'New status for the goal (for update_goal)',
      },
      progress: {
        type: 'string',
        description: 'Progress note for the goal (for update_goal)',
      },
    },
    required: ['patientId', 'action'],
  },
};

function formatGoal(goal: CarePlanGoal): string {
  const statusIcon: Record<string, string> = {
    active: '🔵',
    met: '✅',
    not_met: '❌',
    revised: '🔄',
    discontinued: '⏹️',
  };
  let text = `${statusIcon[goal.status] || '•'} **${goal.id}** — ${goal.description}\n`;
  text += `  Status: ${goal.status}`;
  if (goal.targetDate) text += ` | Target: ${goal.targetDate}`;
  text += '\n';
  if (goal.progress) text += `  Progress: ${goal.progress}\n`;
  return text;
}

export async function executeManageCarePlan(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const config = getConfig();

  try {
    const params: ManageCarePlanParams = {
      patientId: String(args.patientId || ''),
      action: (args.action as CarePlanAction) || 'get',
      goalDescription: args.goalDescription ? String(args.goalDescription) : undefined,
      targetDate: args.targetDate ? String(args.targetDate) : undefined,
      goalId: args.goalId ? String(args.goalId) : undefined,
      status: args.status as CarePlanGoal['status'] | undefined,
      progress: args.progress ? String(args.progress) : undefined,
    };

    const result = await manageCarePlan(params);

    let text = '';
    if (config.mockMode) {
      text += '⚠️ MOCK MODE: Using test data\n\n';
    }

    text += `${result.message}\n\n`;

    if (result.carePlan) {
      text += `**Goals:**\n\n`;
      for (const goal of result.carePlan.goals) {
        text += formatGoal(goal);
        text += '\n';
      }
      text += `Last reviewed: ${result.carePlan.lastReviewDate}`;
      if (result.carePlan.nextReviewDate) {
        text += ` | Next review: ${result.carePlan.nextReviewDate}`;
      }
      text += '\n';
    } else if (result.goal) {
      text += formatGoal(result.goal);
    }

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    logger.error('manage_care_plan failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { content: [formatErrorForMcp(error)], isError: true };
  }
}
