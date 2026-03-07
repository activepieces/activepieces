import { FlowActionType, FlowVersion, flowStructureUtil, FlowTriggerType, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { Logger } from 'pino'
import { CodeArtifact } from '../../cache/code/code-builder'
import { pieceCache } from '../../cache/pieces/piece-cache'

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
