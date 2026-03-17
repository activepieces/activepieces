import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, PiecePackage, tryCatch, WorkerToApiContract } from '@activepieces/shared'
import { Logger } from 'pino'
import { CodeArtifact } from '../../cache/code/code-builder'
import { pieceCache } from '../../cache/pieces/piece-cache'
import { provisioner } from '../../cache/provisioner'

export async function provisionFlowPieces(params: {
    flowVersion: FlowVersion
    platformId: string
    flowId: string
    projectId: string
    log: Logger
    apiClient: WorkerToApiContract
}): Promise<boolean> {
    const { flowVersion, platformId, flowId, projectId, log, apiClient } = params
    const { error } = await tryCatch(async () => {
        const pieces = await extractPiecePackages(flowVersion, platformId, log, apiClient)
        const codeSteps = extractCodeArtifacts(flowVersion)
        await provisioner(log, apiClient).provision({ pieces, codeSteps })
    })
    if (error) {
        log.warn({ error: String(error), flowId }, 'Flow disabled due to missing piece')
        await apiClient.disableFlow({ flowId, projectId })
        return false
    }
    return true
}

export async function extractPiecePackages(flowVersion: FlowVersion, platformId: string, log: Logger, apiClient: WorkerToApiContract): Promise<PiecePackage[]> {
    const pieceSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        .filter((step) => step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE)

    return Promise.all(
        pieceSteps.map((step) =>
            pieceCache(log, apiClient).getPiece({
                pieceName: step.settings.pieceName,
                pieceVersion: step.settings.pieceVersion,
                platformId,
            }),
        ),
    )
}

export function extractCodeArtifacts(flowVersion: FlowVersion): CodeArtifact[] {
    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .filter((step) => step.type === FlowActionType.CODE)
        .map((step) => ({
            name: step.name,
            sourceCode: step.settings.sourceCode,
            flowVersionId: flowVersion.id,
            flowVersionState: flowVersion.state,
        }))
}
