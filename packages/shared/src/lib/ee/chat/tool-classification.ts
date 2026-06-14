const READ_ACTION_PATTERNS = ['list', 'get', 'search', 'find', 'fetch', 'read', 'count', 'check', 'verify', 'lookup']
const WRITE_ACTION_PATTERNS = ['delete', 'remove', 'send', 'post', 'publish', 'create', 'update', 'write', 'insert', 'reply', 'forward']

// Pieces without a structured success flag signal failure with a leading status glyph.
const FAILURE_TEXT_PREFIXES = ['❌', '⏳']

function hasFailureTextPrefix(text: string): boolean {
    return FAILURE_TEXT_PREFIXES.some((prefix) => text.startsWith(prefix))
}

function actionNameMatchesPatterns({ actionName, patterns }: { actionName: string, patterns: string[] }): boolean {
    const words = actionName.toLowerCase().split(/[_\-.]/)
    return patterns.some((pattern) => words.includes(pattern))
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
    requiresActionPreview,
    isReadActionName,
    readOnlyRejection,
    hasFailureTextPrefix,
}
