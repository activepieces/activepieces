const PIECE_NAME_PREFIX = 'piece-'

/**
 * Normalizes a string for use as an agent tool name: safe characters only,
 * collapsed underscores, max 60 chars, lowercase, and appends '_mcp'.
 * Idempotent: if the result would already end with '_mcp', it is not appended again.
 */
function createToolName(name: string): string {
    const normalized = String(name)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 60)
        .toLowerCase()
    return normalized.endsWith('_mcp') ? normalized : normalized + '_mcp'
}

/**
 * Canonical name for a piece action tool. Use this whenever building or comparing
 * tool names for piece actions so all call sites stay in sync.
 * Strips the @scope/piece- prefix from pieceName (e.g. @activepieces/piece-slack → slack)
 * then delegates to createToolName.
 */
function createPieceToolName(pieceName: string, actionName: string): string {
    const shortPieceName = pieceName.includes(PIECE_NAME_PREFIX)
        ? pieceName.split(PIECE_NAME_PREFIX)[1] ?? pieceName
        : pieceName
    return createToolName(`${shortPieceName}-${actionName}`)
}

export const mcpToolNameUtils = {
    createToolName,
    createPieceToolName,
}
