import { AgentToolType } from '@activepieces/core-piece-types'
import { AgentConfig } from '@activepieces/shared'
import { mcpUtils } from '../../mcp/tools/mcp-utils'

const CONNECTION_TEMPLATE = /^\{\{connections\['([^']+)'\]\}\}$/

function unwrapAuth(auth: unknown): string | null {
    if (typeof auth !== 'string' || auth.length === 0) {
        return null
    }
    return auth.match(CONNECTION_TEMPLATE)?.[1] ?? auth
}

function pinConnection({ tools, pieceName, externalId }: {
    tools: AgentConfig['tools']
    pieceName: string
    externalId: string
}): AgentConfig['tools'] | null {
    const normalized = mcpUtils.normalizePieceName(pieceName) ?? pieceName
    let changed = false
    const pinned = tools.map((tool) => {
        if (tool.type !== AgentToolType.PIECE) {
            return tool
        }
        if (mcpUtils.normalizePieceName(tool.pieceMetadata.pieceName) !== normalized) {
            return tool
        }
        if (unwrapAuth(tool.pieceMetadata.predefinedInput?.auth) === externalId) {
            return tool
        }
        changed = true
        return {
            ...tool,
            pieceMetadata: {
                ...tool.pieceMetadata,
                predefinedInput: {
                    ...(tool.pieceMetadata.predefinedInput ?? { fields: {} }),
                    auth: externalId,
                },
            },
        }
    })
    return changed ? pinned : null
}

export const agentToolPinning = { pinConnection }
