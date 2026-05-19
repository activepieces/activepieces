const MUTATION_TOOL_NAMES = new Set([
    'ap_add_step',
    'ap_update_trigger',
    'ap_update_step',
])

const VALIDATION_TOOL_NAMES: string[] = [
    'ap_validate_step_config',
    'ap_get_piece_props',
    'ap_resolve_property_options',
    'ap_update_step',
    'ap_update_trigger',
]

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

function requiresApproval(name: string): boolean {
    return APPROVAL_REQUIRED_TOOL_NAMES.has(name) || !name.startsWith('ap_')
}

function isMutationTool(name: string): boolean {
    return MUTATION_TOOL_NAMES.has(name)
}

export const chatToolCategories = {
    requiresApproval,
    isMutationTool,
    VALIDATION_TOOL_NAMES,
}
