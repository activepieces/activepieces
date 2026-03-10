export { registerFlowTools, listFlows } from './trigger-tools'
export { createFlowTool } from './create-flow'
export { renameFlowTool } from './rename-flow'
export { listFlowsTool } from './list-flows'
export { flowStructureTool } from './flow-structure'
export { updateTriggerTool } from './update-trigger'
export { addStepTool } from './add-step'
export { updateStepTool } from './update-step'
export { deleteStepTool } from './delete-step'
export { addBranchTool } from './add-branch'
export { deleteBranchTool } from './delete-branch'
export { lockAndPublishTool } from './lock-and-publish'
export { changeFlowStatusTool } from './change-flow-status'
export { manageNotesTool } from './manage-notes'

export const LOCKED_TOOL_NAMES: string[] = [
    'ap_list_flows',
    'ap_flow_structure',
    'ap_list_pieces',
    'ap_list_connections',
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
]
