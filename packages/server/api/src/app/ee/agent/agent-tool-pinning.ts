import { AgentToolType } from '@activepieces/core-piece-types'
import { connectionTemplate } from '@activepieces/core-utils'
import { AgentConfig } from '@activepieces/shared'
import { mcpUtils } from '../../mcp/tools/mcp-utils'

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
        if (connectionTemplate.unwrapExternalId(tool.pieceMetadata.predefinedInput?.auth) === externalId) {
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
