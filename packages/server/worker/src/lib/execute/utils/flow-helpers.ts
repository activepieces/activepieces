import { tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { pieceCache, PieceNotFoundError } from '../../runtime/local-pool/cache/pieces/piece-cache'
import { CodeArtifact } from '../../runtime/types'

// Resolve the pieces/code a flow needs into the artifacts that init() installs. A missing piece is
// not an error: the flow is disabled and `disabled: true` is returned so the caller skips the run.
export async function resolveFlowArtifacts(params: {
    flowVersion: FlowVersion
    platformId: string
    flowId: string
    projectId: string
    log: ApLogger
    apiClient: WorkerToApiContract
}): Promise<FlowArtifacts> {
    const { flowVersion, platformId, flowId, projectId, log, apiClient } = params
    const { data: pieces, error } = await tryCatch(() => extractPiecePackages(flowVersion, platformId, log, apiClient))
    if (error) {
        if (!(error instanceof PieceNotFoundError)) {
            throw error
        }
        log.warn({ error: String(error), flow: { id: flowId } }, 'Flow disabled due to missing piece')
        const { error: disableError } = await tryCatch(
            () => apiClient.disableFlow({ flowId, projectId }),
        )
        if (disableError) {
            log.error({ error: String(disableError), flow: { id: flowId } }, 'Failed to disable flow after missing piece')
        }
        return { disabled: true }
    }
    return { disabled: false, pieces, codeSteps: extractCodeArtifacts(flowVersion) }
}

export async function extractPiecePackages(flowVersion: FlowVersion, platformId: string, log: ApLogger, apiClient: WorkerToApiContract): Promise<PiecePackage[]> {
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

export type FlowArtifacts =
    | { disabled: true }
    | { disabled: false, pieces: PiecePackage[], codeSteps: CodeArtifact[] }
