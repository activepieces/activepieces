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

const READ_ACTION_PATTERNS = ['list', 'get', 'search', 'find', 'fetch', 'read', 'count', 'check', 'verify', 'lookup']
const WRITE_ACTION_PATTERNS = ['delete', 'remove', 'send', 'post', 'publish', 'create', 'update', 'write', 'insert', 'reply', 'forward']

function actionNameMatchesPatterns({ actionName, patterns }: { actionName: string, patterns: string[] }): boolean {
    const words = actionName.toLowerCase().split(/[_\-.]/)
    return patterns.some((pattern) => words.includes(pattern))
}

function requiresApproval(toolName: string): boolean {
    return APPROVAL_REQUIRED_TOOL_NAMES.has(toolName) || !toolName.startsWith('ap_')
}

function requiresActionPreview({ actionName, needsConfirmation }: {
    actionName: string
    needsConfirmation?: boolean
}): boolean {
    const isRead = actionNameMatchesPatterns({ actionName, patterns: READ_ACTION_PATTERNS })
    const isWrite = actionNameMatchesPatterns({ actionName, patterns: WRITE_ACTION_PATTERNS })

    if (isWrite) return true
    if (isRead) return false
    return needsConfirmation ?? true
}

function isReadActionName(actionName: string): boolean {
    return actionNameMatchesPatterns({ actionName, patterns: READ_ACTION_PATTERNS })
        && !actionNameMatchesPatterns({ actionName, patterns: WRITE_ACTION_PATTERNS })
}

function readOnlyRejection(actionName: string): { success: false, error: string } {
    return {
        success: false,
        error: `ap_explore_data only runs read-only actions (list/get/search/find/fetch/read/count/check). "${actionName}" looks like a write — use ap_execute_action for changes.`,
    }
}

export const chatToolClassification = {
    requiresApproval,
    requiresActionPreview,
    isReadActionName,
    readOnlyRejection,
}
