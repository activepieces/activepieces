import { isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, FlowVersionState, LATEST_FLOW_SCHEMA_VERSION, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { CodeArtifact, SandboxPoolSettings } from '../../types'
import { pieceCache, PieceNotFoundError } from '../pieces/piece-cache'
import { flowBundleStore } from './flow-bundle-store'
import { flowCache } from './flow-cache'

export const flowProvisioning = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string, getSettings: () => SandboxPoolSettings) => ({
    async resolve({ flow, platformId }: ResolveParams): Promise<ResolvedFlow> {
        const bundle = await flowBundleStore(log, apiClient, basePath).tryFetch({
            flowVersionId: flow.versionId,
            projectId: flow.projectId,
        })
        if (!isNil(bundle)) {
            return { kind: 'ready', flowVersion: bundle.flowVersion, pieces: bundle.pieces, codeSteps: [], needsPublish: false }
        }

        const flowVersion = await flowCache(log, apiClient, basePath).getVersion({ flowVersionId: flow.versionId })
        if (isNil(flowVersion)) {
            return { kind: 'flow-not-found' }
        }

        const { data: pieces, error } = await tryCatch(() => resolvePieces({ flowVersion, platformId, log, apiClient, basePath, getSettings }))
        if (error) {
            if (!(error instanceof PieceNotFoundError)) {
                throw error
            }
            log.warn({ error: String(error), flow: { id: flow.id } }, 'Flow disabled due to missing piece')
            const { error: disableError } = await tryCatch(() => apiClient.disableFlow({ flowId: flow.id, projectId: flow.projectId }))
            if (disableError) {
                log.error({ error: String(disableError), flow: { id: flow.id } }, 'Failed to disable flow after missing piece')
            }
            return { kind: 'disabled' }
        }

        return {
            kind: 'ready',
            flowVersion,
            pieces,
            codeSteps: extractCodeArtifacts(flowVersion),
            needsPublish: flowVersion.state === FlowVersionState.LOCKED && flowVersion.schemaVersion === LATEST_FLOW_SCHEMA_VERSION,
        }
    },

    async publishBundle({ flowVersion, pieces, projectId, platformId }: PublishBundleParams): Promise<void> {
        await tryCatch(() => flowBundleStore(log, apiClient, basePath).publish({ flowVersion, pieces, projectId, platformId }))
    },
})

async function resolvePieces({ flowVersion, platformId, log, apiClient, basePath, getSettings }: ResolvePiecesParams): Promise<PiecePackage[]> {
    const pieceSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        .filter((step) => step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE)

    return Promise.all(pieceSteps.map((step) =>
        pieceCache(log, apiClient, basePath, getSettings).getPiece({
            pieceName: step.settings.pieceName,
            pieceVersion: step.settings.pieceVersion,
            platformId,
        }),
    ))
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

type ResolveParams = {
    flow: { id: string, versionId: string, projectId: string }
    platformId: string
}

type PublishBundleParams = {
    flowVersion: FlowVersion
    pieces: PiecePackage[]
    projectId: string
    platformId: string
}

type ResolvePiecesParams = {
    flowVersion: FlowVersion
    platformId: string
    log: ApLogger
    apiClient: WorkerToApiContract
    basePath: string
    getSettings: () => SandboxPoolSettings
}

export type ResolvedFlow =
    | { kind: 'flow-not-found' }
    | { kind: 'disabled' }
    | { kind: 'ready', flowVersion: FlowVersion, pieces: PiecePackage[], codeSteps: CodeArtifact[], needsPublish: boolean }
