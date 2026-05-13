const READ_ONLY_TOOL_PREFIXES = [
    'ap_list_',
    'ap_get_',
    'ap_find_',
    'ap_flow_structure',
    'ap_read_step_code',
    'ap_resolve_property_options',
] as const

const SAFE_IN_RESEARCH_PHASE = new Set([
    'ap_set_session_title',
    'ap_select_project',
    'ap_list_across_projects',
    'ap_research',
])

const BUILD_TOOL_NAMES = new Set([
    'ap_create_flow',
    'ap_update_trigger',
    'ap_update_step',
    'ap_add_step',
    'ap_validate_step_config',
    'ap_validate_flow',
    'ap_test_step',
    'ap_test_flow',
    'ap_manage_notes',
    'ap_flow_structure',
    'ap_get_piece_props',
    'ap_resolve_property_options',
    'ap_list_connections',
])

const FIX_TOOL_NAMES = new Set([
    'ap_update_step',
    'ap_update_trigger',
    'ap_get_piece_props',
    'ap_validate_step_config',
    'ap_resolve_property_options',
])

const MUTATION_TOOL_NAMES = new Set([
    'ap_add_step',
    'ap_update_trigger',
    'ap_update_step',
])

// Non-ap_ tools from MCP are gated by default to protect against unvetted third-party tools
const APPROVAL_REQUIRED_TOOL_NAMES = new Set([
    'ap_delete_flow',
    'ap_delete_table',
    'ap_delete_step',
    'ap_delete_branch',
    'ap_delete_records',
    'ap_run_action',
    'ap_test_step',
    'ap_test_flow',
    'ap_change_flow_status',
])

function isResearchPhaseTool(name: string): boolean {
    if (SAFE_IN_RESEARCH_PHASE.has(name)) return true
    return READ_ONLY_TOOL_PREFIXES.some((prefix) => name.startsWith(prefix))
}

function requiresApproval(name: string): boolean {
    return APPROVAL_REQUIRED_TOOL_NAMES.has(name) || !name.startsWith('ap_')
}

function isBuildTool(name: string): boolean {
    return BUILD_TOOL_NAMES.has(name)
}

function isMutationTool(name: string): boolean {
    return MUTATION_TOOL_NAMES.has(name)
}

// Object.fromEntries returns Record<string, unknown>; the generic preserves the caller's type
function filterTools<T extends Record<string, unknown>>({ allTools, predicate }: { allTools: T, predicate: (name: string) => boolean }): T {
    return Object.fromEntries(
        Object.entries(allTools).filter(([name]) => predicate(name)),
    ) as T
}

const FIX_TOOL_LIST = [...FIX_TOOL_NAMES]

export const chatToolCategories = {
    isResearchPhaseTool,
    requiresApproval,
    isBuildTool,
    isMutationTool,
    filterTools,
    FIX_TOOL_LIST,
}
