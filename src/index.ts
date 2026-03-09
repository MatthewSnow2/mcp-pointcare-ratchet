#!/usr/bin/env node

/**
 * Ratchet MCP Server
 *
 * MCP server for PointCare EMR integration.
 * Enables Claude to document patient visits directly into EMR.
 *
 * In mock mode (default when API not configured), uses realistic test data.
 * When PointCare API is available, set POINTCARE_API_URL and POINTCARE_API_KEY.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getConfig, validateConfig } from './config.js';
import { logger } from './utils/logger.js';
import {
  searchPatientTool,
  executeSearchPatient,
  createVisitNoteTool,
  executeCreateVisitNote,
  getPatientHistoryTool,
  executeGetPatientHistory,
  getCareTeamTool,
  executeGetCareTeam,
  getScheduleTool,
  executeGetSchedule,
  startVisitTool,
  executeStartVisit,
  updateVisitNoteTool,
  executeUpdateVisitNote,
  completeVisitTool,
  executeCompleteVisit,
  cancelVisitTool,
  executeCancelVisit,
  scheduleNextVisitTool,
  executeScheduleNextVisit,
  manageCarePlanTool,
  executeManageCarePlan,
} from './tools/index.js';

// Load configuration
const config = getConfig();

// Validate configuration
const configErrors = validateConfig(config);
if (configErrors.length > 0 && !config.mockMode) {
  logger.error('Configuration errors', { errors: configErrors });
  process.exit(1);
}

// Create MCP server instance
const server = new Server(
  {
    name: 'ratchet-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  searchPatientTool,
  createVisitNoteTool,
  getPatientHistoryTool,
  getCareTeamTool,
  getScheduleTool,
  startVisitTool,
  updateVisitNoteTool,
  completeVisitTool,
  cancelVisitTool,
  scheduleNextVisitTool,
  manageCarePlanTool,
];

// Tool executor map
const toolExecutors: Record<string, (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}>> = {
  search_patient: executeSearchPatient,
  create_visit_note: executeCreateVisitNote,
  get_patient_history: executeGetPatientHistory,
  get_care_team: executeGetCareTeam,
  get_schedule: executeGetSchedule,
  start_visit: executeStartVisit,
  update_visit_note: executeUpdateVisitNote,
  complete_visit: executeCompleteVisit,
  cancel_visit: executeCancelVisit,
  schedule_next_visit: executeScheduleNextVisit,
  manage_care_plan: executeManageCarePlan,
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Listing tools');
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info('Tool called', { tool: name });

  const executor = toolExecutors[name];

  if (!executor) {
    logger.warn('Unknown tool requested', { tool: name });
    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${name}. Available tools: ${TOOLS.map(t => t.name).join(', ')}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await executor(args || {});
    return result;
  } catch (error) {
    logger.error('Tool execution failed', {
      tool: name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      content: [
        {
          type: 'text',
          text: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  logger.info('Starting Ratchet MCP server', {
    version: '0.1.0',
    mockMode: config.mockMode,
    supabaseEnabled: config.supabaseEnabled,
  });

  if (config.mockMode) {
    logger.warn('Running in MOCK MODE - no real API calls will be made');
  }

  if (config.supabaseEnabled) {
    logger.info('Supabase integration ENABLED - visits will sync to dashboard');
  } else {
    logger.warn('Supabase integration DISABLED - check SUPABASE_URL and SUPABASE_ANON_KEY env vars');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Ratchet MCP server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error', { error: error instanceof Error ? error.message : 'Unknown error' });
  process.exit(1);
});
