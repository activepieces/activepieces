import { PredefinedInputsStructure } from '@activepieces/core-piece-types'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { McpToolResult } from '@activepieces/shared'
import { LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { executePieceActionRun } from '../../../mcp/tools/flow-run-utils'
import { mcpUtils } from '../../../mcp/tools/mcp-utils'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { pieceInputFiller, ResolveProperty } from './piece-input-filler'

async function runFromInstruction({ piece, instruction, predefinedInput, model, projectId, platformId, connectionExternalId, log }: RunFromInstructionParams): Promise<PieceToolRun> {
    const { properties, pieceVersion } = await resolveAction({ piece, platformId, log })
    const resolvedInput = await pieceInputFiller.fillInput({
        action: { name: piece.actionName, properties, ...(isNil(connectionExternalId) ? {} : { connectionExternalId }) },
        instruction,
        ...(isNil(predefinedInput) ? {} : { predefinedInput }),
        ports: {
            resolveProperty: propertyResolverFor({ piece, pieceVersion, projectId, platformId, log }),
            completeObject: pieceInputFiller.modelCompleter(model),
        },
    })

    assertUrlStaysOnThePieceHost({ actionName: piece.actionName, input: resolvedInput })

    const result = await executePieceActionRun({
        projectId,
        pieceName: piece.pieceName,
        actionName: piece.actionName,
        input: resolvedInput,
        log,
        ...(isNil(connectionExternalId) ? {} : { connectionExternalId }),
    })

    return { result, resolvedInput: { ...resolvedInput, ...(isNil(resolvedInput.auth) ? {} : { auth: REDACTED_AUTH }) } }
}

async function resolveAction({ piece, platformId, log }: { piece: PieceActionRef, platformId: string, log: FastifyBaseLogger }) {
    const metadata = await pieceMetadataService(log).getOrThrow({
        platformId,
        name: piece.pieceName,
        version: piece.pieceVersion,
    })
    const action = metadata.actions[piece.actionName]
    if (isNil(action)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityType: 'PieceAction', entityId: `${piece.pieceName}:${piece.actionName}` },
        })
    }
    return { properties: action.props, pieceVersion: metadata.version }
}

function propertyResolverFor({ piece, pieceVersion, projectId, platformId, log }: {
    piece: PieceActionRef
    pieceVersion: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): ResolveProperty {
    return ({ propertyName, actionOrTriggerName, input, auth }) => {
        return mcpUtils.executePropertyResolution({
            pieceName: piece.pieceName,
            pieceVersion,
            actionOrTriggerName,
            propertyName,
            input,
            projectId,
            platformId,
            log,
            ...(isNil(auth) ? {} : { auth }),
        })
    }
}

function assertUrlStaysOnThePieceHost({ actionName, input }: { actionName: string, input: Record<string, unknown> }): void {
    if (actionName !== CUSTOM_API_CALL) {
        return
    }
    const url = input.url
    const value = typeof url === 'string' ? url : (typeof url === 'object' && !isNil(url) && 'url' in url && typeof url.url === 'string' ? url.url : undefined)
    if (isNil(value) || !ABSOLUTE_URL.test(value)) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: `A custom API call from an agent step must be a path on the connection's own API, not the full address "${value}". Sending this project's credentials somewhere the connection does not belong is not something an unattended run may do.` },
    })
}

const CUSTOM_API_CALL = 'custom_api_call'
const ABSOLUTE_URL = /^https?:\/\//i
const REDACTED_AUTH = 'Redacted'

export const pieceToolRunner = {
    runFromInstruction,
}

export type PieceActionRef = {
    pieceName: string
    actionName: string
    pieceVersion?: string
}

export type RunFromInstructionParams = {
    piece: PieceActionRef
    instruction: string
    predefinedInput?: PredefinedInputsStructure
    model: LanguageModel
    projectId: string
    platformId: string
    connectionExternalId?: string
    log: FastifyBaseLogger
}

export type PieceToolRun = {
    result: McpToolResult
    resolvedInput: Record<string, unknown>
}
