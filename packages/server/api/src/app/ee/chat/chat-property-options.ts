import {
    isNil,
    ResolveSetupFormOptionsRequest,
    ResolveSetupFormOptionsResponse,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { mcpUtils } from '../../mcp/tools/mcp-utils'

export async function resolveSetupFormOptions({ request, platformId, log }: {
    request: ResolveSetupFormOptionsRequest
    platformId: string
    log: FastifyBaseLogger
}): Promise<ResolveSetupFormOptionsResponse> {
    const { pieceName, actionOrTriggerName, type, propertyName, connectionExternalId, projectId, input, searchValue } = request

    const lookup = await mcpUtils.lookupPieceComponent({
        pieceName,
        componentName: actionOrTriggerName,
        componentType: type,
        projectId,
        platformId,
        log,
    })
    if (lookup.error) {
        return { options: [] }
    }
    if (isNil(lookup.component.props[propertyName])) {
        return { options: [] }
    }

    const result = await mcpUtils.executePropertyResolution({
        pieceName: lookup.pieceName,
        pieceVersion: lookup.piece.version,
        actionOrTriggerName,
        propertyName,
        auth: connectionExternalId,
        input,
        searchValue,
        projectId,
        platformId,
        log,
    })

    return { options: result.status === 'options' ? result.options : [] }
}
