import { PredefinedInputsStructure } from '@activepieces/core-piece-types'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { McpToolResult } from '@activepieces/shared'
import { LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { executeAdhocAction } from '../../../mcp/tools/flow-run-utils'
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

    const result = await executeAdhocAction({
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
        version: undefined,
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

const REDACTED_AUTH = 'Redacted'

export const pieceToolRunner = {
    runFromInstruction,
}

export type PieceActionRef = {
    pieceName: string
    actionName: string
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
