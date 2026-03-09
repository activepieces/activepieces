import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { apAddBranchTool } from './ap-add-branch'
import { apAddStepTool } from './ap-add-step'
import { apChangeFlowStatusTool } from './ap-change-flow-status'
import { apCreateFlowTool } from './ap-create-flow'
import { apDeleteBranchTool } from './ap-delete-branch'
import { apDeleteStepTool } from './ap-delete-step'
import { apFlowStructureTool } from './ap-flow-structure'
import { apListConnectionsTool } from './ap-list-connections'
import { apListFlowsTool } from './ap-list-flows'
import { apListPiecesTool } from './ap-list-pieces'
import { apLockAndPublishTool } from './ap-lock-and-publish'
import { apManageNotesTool } from './ap-manage-notes'
import { apRenameFlowTool } from './ap-rename-flow'
import { apUpdateStepTool } from './ap-update-step'
import { apUpdateTriggerTool } from './ap-update-trigger'

export const LOCKED_TOOL_NAMES: string[] = [
    'ap_list_flows',
    'ap_flow_structure',
    'ap_list_pieces',
    'ap_list_connections',
]

export const ALL_CONTROLLABLE_TOOL_NAMES: string[] = [
    'ap_create_flow',
    'ap_rename_flow',
    'ap_update_trigger',
    'ap_add_step',
    'ap_update_step',
    'ap_delete_step',
    'ap_add_branch',
    'ap_delete_branch',
    'ap_lock_and_publish',
    'ap_change_flow_status',
    'ap_manage_notes',
]

export const activepiecesTools = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition[] => [
    apCreateFlowTool(mcp, log),
    apRenameFlowTool(mcp, log),
    apListFlowsTool(mcp, log),
    apFlowStructureTool(mcp, log),
    apListPiecesTool(mcp, log),
    apListConnectionsTool(mcp, log),
    apUpdateTriggerTool(mcp, log),
    apAddStepTool(mcp, log),
    apUpdateStepTool(mcp, log),
    apDeleteStepTool(mcp, log),
    apAddBranchTool(mcp, log),
    apDeleteBranchTool(mcp, log),
    apLockAndPublishTool(mcp, log),
    apChangeFlowStatusTool(mcp, log),
    apManageNotesTool(mcp, log),
]
