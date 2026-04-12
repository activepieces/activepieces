import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { apAddBranchTool } from './ap-add-branch'
import { apAddStepTool } from './ap-add-step'
import { apChangeFlowStatusTool } from './ap-change-flow-status'
import { apCreateFlowTool } from './ap-create-flow'
import { apCreateTableTool } from './ap-create-table'
import { apDeleteBranchTool } from './ap-delete-branch'
import { apDeleteRecordsTool } from './ap-delete-records'
import { apDeleteStepTool } from './ap-delete-step'
import { apDeleteTableTool } from './ap-delete-table'
import { apFindRecordsTool } from './ap-find-records'
import { apFlowStructureTool } from './ap-flow-structure'
import { apGetPiecePropsTool } from './ap-get-piece-props'
import { apGetRunTool } from './ap-get-run'
import { apInsertRecordsTool } from './ap-insert-records'
import { apListAiModelsTool } from './ap-list-ai-models'
import { apListConnectionsTool } from './ap-list-connections'
import { apListFlowsTool } from './ap-list-flows'
import { apListPiecesTool } from './ap-list-pieces'
import { apListRunsTool } from './ap-list-runs'
import { apListTablesTool } from './ap-list-tables'
import { apLockAndPublishTool } from './ap-lock-and-publish'
import { apManageFieldsTool } from './ap-manage-fields'
import { apManageNotesTool } from './ap-manage-notes'
import { apRenameFlowTool } from './ap-rename-flow'
import { apRetryRunTool } from './ap-retry-run'
import { apSetupGuideTool } from './ap-setup-guide'
import { apTestFlowTool } from './ap-test-flow'
import { apTestStepTool } from './ap-test-step'
import { apUpdateRecordTool } from './ap-update-record'
import { apUpdateStepTool } from './ap-update-step'
import { apUpdateTriggerTool } from './ap-update-trigger'
import { apValidateStepConfigTool } from './ap-validate-step-config'

export const LOCKED_TOOL_NAMES: string[] = [
    'ap_list_flows',
    'ap_flow_structure',
    'ap_list_pieces',
    'ap_get_piece_props',
    'ap_validate_step_config',
    'ap_list_connections',
    'ap_list_ai_models',
    'ap_list_tables',
    'ap_find_records',
    'ap_list_runs',
    'ap_get_run',
    'ap_setup_guide',
]

// NOTE: Keep this list in sync with TOOL_CATEGORIES in
// packages/web/src/app/components/project-settings/mcp-server/utils/mcp-tools-metadata.ts
// Any tool added here must also be added there so it appears in the UI settings panel.
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
    'ap_create_table',
    'ap_delete_table',
    'ap_manage_fields',
    'ap_insert_records',
    'ap_update_record',
    'ap_delete_records',
    'ap_test_flow',
    'ap_test_step',
    'ap_retry_run',
]

export const activepiecesTools = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition[] => [
    apCreateFlowTool(mcp, log),
    apRenameFlowTool(mcp, log),
    apListFlowsTool(mcp, log),
    apFlowStructureTool(mcp, log),
    apListPiecesTool(mcp, log),
    apGetPiecePropsTool(mcp, log),
    apValidateStepConfigTool(mcp, log),
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
    apListAiModelsTool(mcp, log),
    apListTablesTool(mcp, log),
    apFindRecordsTool(mcp, log),
    apCreateTableTool(mcp, log),
    apDeleteTableTool(mcp, log),
    apManageFieldsTool(mcp, log),
    apInsertRecordsTool(mcp, log),
    apUpdateRecordTool(mcp, log),
    apDeleteRecordsTool(mcp, log),
    apListRunsTool(mcp, log),
    apGetRunTool(mcp, log),
    apTestFlowTool(mcp, log),
    apTestStepTool(mcp, log),
    apRetryRunTool(mcp, log),
    apSetupGuideTool(mcp, log),
]
