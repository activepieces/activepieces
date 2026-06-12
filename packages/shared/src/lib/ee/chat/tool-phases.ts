/**
 * Two-phase tool visibility: in DISCOVERY the agent sees only read/understand
 * tools; the flow-construction/editing/publishing/table-write tools stay hidden
 * until it starts building. Denylist (not allowlist) on purpose — an unclassified
 * new tool degrades to "noisier discovery", never to "a needed tool vanished".
 */

const BUILD_ONLY_TOOL_NAMES = new Set<string>([
    'ap_build_flow',
    'ap_create_flow',
    'ap_add_step',
    'ap_update_step',
    'ap_delete_step',
    'ap_update_trigger',
    'ap_add_branch',
    'ap_update_branch',
    'ap_delete_branch',
    'ap_test_flow',
    'ap_test_step',
    'ap_validate_flow',
    'ap_validate_step_config',
    'ap_execute_action',
    'ap_discover_action_auth',
    'ap_lock_and_publish',
    'ap_change_flow_status',
    'ap_delete_flow',
    'ap_rename_flow',
    'ap_duplicate_flow',
    'ap_manage_notes',
    'ap_retry_run',
    'ap_create_table',
    'ap_insert_records',
    'ap_update_record',
    'ap_delete_records',
    'ap_manage_fields',
    'ap_delete_table',
    'ap_run_action',
])

/**
 * Tools the chat surface never exposes (the chat has a richer or safer
 * equivalent). Filtered out worker-side; the shared MCP registry is untouched
 * so non-chat MCP consumers still see them.
 */
const CHAT_HIDDEN_TOOL_NAMES = new Set<string>([
    'ap_create_flow',
    'ap_run_action',
    'ap_create_table',
    'ap_insert_records',
    'ap_update_record',
    'ap_delete_records',
    'ap_manage_fields',
    'ap_delete_table',
    'ap_set_project_context',
    'ap_setup_guide',
])

function activeToolsForPhase({ phase, allToolNames }: {
    phase: ChatPhase
    allToolNames: string[]
}): string[] {
    if (phase === 'build') {
        return allToolNames
    }
    return allToolNames.filter((name) => !BUILD_ONLY_TOOL_NAMES.has(name))
}

function isBuildOnlyTool(toolName: string): boolean {
    return BUILD_ONLY_TOOL_NAMES.has(toolName)
}

function isChatHiddenTool(toolName: string): boolean {
    return CHAT_HIDDEN_TOOL_NAMES.has(toolName)
}

export type ChatPhase = 'discovery' | 'build'

export const chatToolPhases = {
    activeToolsForPhase,
    isBuildOnlyTool,
    isChatHiddenTool,
}
