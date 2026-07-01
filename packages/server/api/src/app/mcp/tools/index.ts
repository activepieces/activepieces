import { isNil, Permission } from '@activepieces/core-utils'
import { McpServerType, McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { apAddBranchTool } from './ap-add-branch'
import { apAddStepTool } from './ap-add-step'
import { apBuildFlowTool } from './ap-build-flow'
import { apChangeFlowStatusTool } from './ap-change-flow-status'
import { apClearTableTool } from './ap-clear-table'
import { apColorRecordsTool } from './ap-color-records'
import { apCreateFlowTool } from './ap-create-flow'
import { apCreateTableTool } from './ap-create-table'
import { apDeleteBranchTool } from './ap-delete-branch'
import { apDeleteFlowTool } from './ap-delete-flow'
import { apDeleteRecordsTool } from './ap-delete-records'
import { apDeleteStepTool } from './ap-delete-step'
import { apDeleteTableTool } from './ap-delete-table'
import { apDuplicateFlowTool } from './ap-duplicate-flow'
import { apFindRecordsTool } from './ap-find-records'
import { apFlowStructureTool } from './ap-flow-structure'
import { apGetPiecePropsTool } from './ap-get-piece-props'
import { apGetRunTool } from './ap-get-run'
import { apInsertRecordsTool } from './ap-insert-records'
import { apListAiModelsTool } from './ap-list-ai-models'
import { apListConnectionsTool } from './ap-list-connections'
import { apListFlowsTool } from './ap-list-flows'
import { apListRunsTool } from './ap-list-runs'
import { apListTablesTool } from './ap-list-tables'
import { apLockAndPublishTool } from './ap-lock-and-publish'
import { apManageFieldsTool } from './ap-manage-fields'
import { apManageNotesTool } from './ap-manage-notes'
import { apReadStepCodeTool } from './ap-read-step-code'
import { apRenameFlowTool } from './ap-rename-flow'
import { apResearchPiecesTool } from './ap-research-pieces'
import { apResolvePropertyChainTool } from './ap-resolve-property-chain'
import { apResolvePropertyOptionsTool } from './ap-resolve-property-options'
import { apRestoreRecordsTool } from './ap-restore-records'
import { apRetryRunTool } from './ap-retry-run'
import { apRunActionTool } from './ap-run-action'
import { apSetupGuideTool } from './ap-setup-guide'
import { apTestFlowTool } from './ap-test-flow'
import { apTestStepTool } from './ap-test-step'
import { apUpdateBranchTool } from './ap-update-branch'
import { apUpdateRecordTool } from './ap-update-record'
import { apUpdateRecordsTool } from './ap-update-records'
import { apUpdateStepTool } from './ap-update-step'
import { apUpdateTriggerTool } from './ap-update-trigger'
import { apValidateFlowTool } from './ap-validate-flow'
import { apValidateStepConfigTool } from './ap-validate-step-config'

export const LOCKED_TOOL_NAMES: string[] = [
    'ap_list_flows',
    'ap_flow_structure',
    'ap_read_step_code',
    'ap_validate_flow',
    'ap_research_pieces',
    'ap_get_piece_props',
    'ap_resolve_property_options',
    'ap_resolve_property_chain',
    'ap_validate_step_config',
    'ap_list_connections',
    'ap_list_ai_models',
    'ap_list_tables',
    'ap_find_records',
    'ap_list_runs',
    'ap_get_run',
    'ap_setup_guide',
]

export const PLATFORM_LEVEL_TOOL_NAMES: string[] = [
    'ap_research_pieces',
    'ap_list_ai_models',
    'ap_get_piece_props',
]

// NOTE: Keep this list in sync with TOOL_CATEGORIES in
// packages/web/src/app/components/project-settings/mcp-server/utils/mcp-tools-metadata.ts
// Any tool added here must also be added there so it appears in the UI settings panel.
export const ALL_CONTROLLABLE_TOOL_NAMES: string[] = [
    'ap_build_flow',
    'ap_create_flow',
    'ap_duplicate_flow',
    'ap_rename_flow',
    'ap_update_trigger',
    'ap_add_step',
    'ap_update_step',
    'ap_delete_step',
    'ap_add_branch',
    'ap_update_branch',
    'ap_delete_branch',
    'ap_lock_and_publish',
    'ap_change_flow_status',
    'ap_delete_flow',
    'ap_manage_notes',
    'ap_create_table',
    'ap_delete_table',
    'ap_manage_fields',
    'ap_insert_records',
    'ap_update_record',
    'ap_update_records',
    'ap_delete_records',
    'ap_restore_records',
    'ap_clear_table',
    'ap_test_flow',
    'ap_test_step',
    'ap_retry_run',
    'ap_run_action',
]

export const activepiecesTools = (mcp: ProjectScopedMcpServer, userId: string | undefined, log: FastifyBaseLogger): McpToolDefinition[] => [
    apBuildFlowTool({ mcp, userId }, log),
    apCreateFlowTool({ mcp, userId }, log),
    apDuplicateFlowTool({ mcp, userId }, log),
    apRenameFlowTool(mcp, log),
    apListFlowsTool(mcp, log),
    apFlowStructureTool(mcp, log),
    apReadStepCodeTool(mcp, log),
    apValidateFlowTool(mcp, log),
    apResearchPiecesTool(mcp, log),
    apGetPiecePropsTool(mcp, log),
    apResolvePropertyOptionsTool(mcp, log),
    apResolvePropertyChainTool(mcp, log),
    apValidateStepConfigTool(mcp, log),
    apListConnectionsTool(mcp, log),
    apUpdateTriggerTool(mcp, log),
    apAddStepTool(mcp, log),
    apUpdateStepTool(mcp, log),
    apDeleteStepTool(mcp, log),
    apAddBranchTool(mcp, log),
    apUpdateBranchTool(mcp, log),
    apDeleteBranchTool(mcp, log),
    apLockAndPublishTool(mcp, log),
    apChangeFlowStatusTool(mcp, log),
    apDeleteFlowTool(mcp, log),
    apManageNotesTool(mcp, log),
    apListAiModelsTool(mcp, log),
    apListTablesTool(mcp, log),
    apFindRecordsTool(mcp, log),
    apCreateTableTool(mcp, log),
    apDeleteTableTool(mcp, log),
    apManageFieldsTool(mcp, log),
    apInsertRecordsTool(mcp, log),
    apUpdateRecordTool(mcp, log),
    apUpdateRecordsTool(mcp, log),
    apColorRecordsTool(mcp, log),
    apDeleteRecordsTool(mcp, log),
    apRestoreRecordsTool(mcp, log),
    apClearTableTool(mcp, log),
    apListRunsTool(mcp, log),
    apGetRunTool(mcp, log),
    apTestFlowTool(mcp, log),
    apTestStepTool(mcp, log),
    apRetryRunTool(mcp, log),
    apRunActionTool(mcp, log),
    apSetupGuideTool(mcp, log),
]

// Single source of truth for "the agent is editing an open resource" — the worker
// announces the Stage AI lock (which gates realtime deltas) for exactly these tools.
// Derived from each tool's own permission + id arg so a new mutating tool is covered
// automatically; a hand-maintained name list silently drifts (it has, repeatedly).
export function getMutatingResourceTools({ userId, log }: { userId: string | undefined, log: FastifyBaseLogger }): Record<string, ResourceIdArg> {
    return deriveMutatingResourceTools(activepiecesTools(METADATA_PROBE_MCP, userId, log))
}

export function deriveMutatingResourceTools(tools: McpToolDefinition[]): Record<string, ResourceIdArg> {
    return tools.reduce<Record<string, ResourceIdArg>>((acc, tool) => {
        if (isNil(tool.permission) || !MUTATING_RESOURCE_PERMISSIONS.has(tool.permission)) {
            return acc
        }
        const idArg = RESOURCE_ID_ARGS.find((arg) => arg in tool.inputSchema)
        return isNil(idArg) ? acc : { ...acc, [tool.title]: idArg }
    }, {})
}

// flowId first so a tool carrying both resolves to the flow (matches the worker's readResourceId).
const RESOURCE_ID_ARGS = ['flowId', 'tableId'] as const

const MUTATING_RESOURCE_PERMISSIONS = new Set<Permission>([
    Permission.WRITE_TABLE,
    Permission.WRITE_FLOW,
    Permission.UPDATE_FLOW_STATUS,
])

// activepiecesTools only reads `mcp` inside each tool's execute() — title/permission/inputSchema
// (all this derivation needs) are mcp-independent, so a placeholder context is sufficient.
const METADATA_PROBE_MCP: ProjectScopedMcpServer = {
    id: '', created: '', updated: '',
    platformId: null, projectId: '', type: McpServerType.PROJECT,
    token: '', disabledTools: null,
}

type ResourceIdArg = (typeof RESOURCE_ID_ARGS)[number]
