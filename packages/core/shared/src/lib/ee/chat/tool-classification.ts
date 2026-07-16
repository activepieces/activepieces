const READ_ACTION_PATTERNS = ['list', 'get', 'search', 'find', 'fetch', 'read', 'count', 'check', 'verify', 'lookup']
const WRITE_ACTION_PATTERNS = ['delete', 'remove', 'send', 'post', 'publish', 'create', 'update', 'write', 'insert', 'reply', 'forward']
const READ_ONLY_HTTP_METHODS = ['GET', 'HEAD', 'OPTIONS']

// Pieces without a structured success flag signal failure with a leading status glyph.
const FAILURE_TEXT_PREFIXES = ['❌', '⏳']

function hasFailureTextPrefix(text: string): boolean {
    return FAILURE_TEXT_PREFIXES.some((prefix) => text.startsWith(prefix))
}

function actionNameMatchesPatterns({ actionName, patterns }: { actionName: string, patterns: string[] }): boolean {
    const words = actionName.toLowerCase().split(/[_\-.]/)
    return patterns.some((pattern) => words.includes(pattern))
}

function requiresActionPreview({ actionName, input, needsConfirmation, tainted }: {
    actionName: string
    input?: Record<string, unknown>
    needsConfirmation?: boolean
    tainted?: boolean
}): boolean {
    // Raw HTTP: skip the gate only for a provably read-only method (GET/HEAD/OPTIONS). A mutating
    // method (POST/PUT/PATCH/DELETE) — or an unknown/unspecified one — must be confirmed, so chat
    // can't silently change external systems via custom_api_call.
    if (actionName === 'custom_api_call') {
        const method = typeof input?.['method'] === 'string' ? input['method'].toUpperCase() : undefined
        return method === undefined || !READ_ONLY_HTTP_METHODS.includes(method)
    }

    const isRead = actionNameMatchesPatterns({ actionName, patterns: READ_ACTION_PATTERNS })
    const isWrite = actionNameMatchesPatterns({ actionName, patterns: WRITE_ACTION_PATTERNS })

    if (isWrite) return true
    // Untrusted content in the turn: gate anything not provably read-only, ignoring needsConfirmation
    // (an injection could have set it false).
    if (tainted) return !isReadOnlyActionCall({ actionName, input })
    if (isRead) return false
    return needsConfirmation ?? true
}

function isReadActionName(actionName: string): boolean {
    return actionNameMatchesPatterns({ actionName, patterns: READ_ACTION_PATTERNS })
        && !actionNameMatchesPatterns({ actionName, patterns: WRITE_ACTION_PATTERNS })
}

// custom_api_call carries no read/write verb in its name, so name-based classification
// wrongly blocks a read-only GET. Treat it as read-only when its HTTP method is safe.
function isReadOnlyActionCall({ actionName, input }: { actionName: string, input?: Record<string, unknown> }): boolean {
    if (isReadActionName(actionName)) {
        return true
    }
    if (actionName === 'custom_api_call') {
        const method = typeof input?.['method'] === 'string' ? input['method'].toUpperCase() : undefined
        return method === undefined || READ_ONLY_HTTP_METHODS.includes(method)
    }
    return false
}

function isWriteActionName(actionName: string): boolean {
    return actionNameMatchesPatterns({ actionName, patterns: WRITE_ACTION_PATTERNS })
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
    isReadOnlyActionCall,
    isWriteActionName,
    readOnlyRejection,
    hasFailureTextPrefix,
}
