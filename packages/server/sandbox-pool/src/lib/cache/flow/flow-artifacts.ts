import { tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { CodeArtifact, SandboxPoolSettings } from '../../types'
import { pieceCache, PieceNotFoundError } from '../pieces/piece-cache'

export async function resolveFlowArtifacts(params: {
    flowVersion: FlowVersion
    platformId: string
    flowId: string
    projectId: string
    log: ApLogger
    apiClient: WorkerToApiContract
    basePath: string
    getSettings: () => SandboxPoolSettings
}): Promise<FlowArtifacts> {
    const { flowVersion, platformId, flowId, projectId, log, apiClient, basePath, getSettings } = params
    const { data: pieces, error } = await tryCatch(() => extractPiecePackages({ flowVersion, platformId, log, apiClient, basePath, getSettings }))
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

async function extractPiecePackages(params: { flowVersion: FlowVersion, platformId: string, log: ApLogger, apiClient: WorkerToApiContract, basePath: string, getSettings: () => SandboxPoolSettings }): Promise<PiecePackage[]> {
    const { flowVersion, platformId, log, apiClient, basePath, getSettings } = params
    const pieceSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        .filter((step) => step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE)

    return Promise.all(
        pieceSteps.map((step) =>
            pieceCache(log, apiClient, basePath, getSettings).getPiece({
                pieceName: step.settings.pieceName,
                pieceVersion: step.settings.pieceVersion,
                platformId,
            }),
        ),
    )
}

function extractCodeArtifacts(flowVersion: FlowVersion): CodeArtifact[] {
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
