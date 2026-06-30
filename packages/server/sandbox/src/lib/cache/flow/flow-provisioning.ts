import { isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, wideEvent } from '@activepieces/server-utils'
import { AgentPieceTool, FlowActionType, flowStructureUtil, FlowVersion, FlowVersionState, LATEST_FLOW_SCHEMA_VERSION, PiecePackage, Step, WorkerToApiContract } from '@activepieces/shared'
import { CodeArtifact, SandboxSettings } from '../../types'
import { pieceCache, PieceNotFoundError } from '../pieces/piece-cache'
import { flowBundleStore } from './flow-bundle-store'
import { flowCache } from './flow-cache'
import { flowSteps } from './flow-steps'

export const flowProvisioning = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string, getSettings: () => SandboxSettings) => ({
    async resolve({ flow, platformId }: ResolveParams): Promise<ResolvedFlow> {
        // A bundle is an optimization: never let a fetch error fail the run — fall through to resolve.
        // Timed as flowBundleDownloadMs so a run's breakdown shows the bundle fetch cost.
        const { data: bundle, error: bundleError } = await tryCatch(() => wideEvent.timed({
            name: 'flowBundleDownload',
            fn: () => flowBundleStore(log, apiClient, basePath).tryFetch({
                flowVersionId: flow.versionId,
                projectId: flow.projectId,
            }),
        }))
        if (bundleError) {
            log.warn({ error: String(bundleError), flow: { id: flow.id } }, 'Flow bundle fetch failed, falling back to resolve')
        }
        if (!isNil(bundle)) {
            // tryFetch already wrote the compiled code to the Code Cache; nothing to compile or republish.
            return { kind: 'ready', flowVersion: bundle.flowVersion, pieces: bundle.pieces, code: { kind: 'materialized' }, publishBundle: null }
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

        const shouldPublish = flowVersion.state === FlowVersionState.LOCKED && flowVersion.schemaVersion === LATEST_FLOW_SCHEMA_VERSION
        return {
            kind: 'ready',
            flowVersion,
            pieces,
            code: { kind: 'source', steps: extractCodeArtifacts(flowVersion) },
            // The compiled code only exists on disk after install, so the caller invokes this afterwards.
            publishBundle: shouldPublish ? buildPublishBundle({ log, apiClient, basePath, flowVersion, pieces, projectId: flow.projectId, platformId }) : null,
        }
    },
})

function buildPublishBundle({ log, apiClient, basePath, flowVersion, pieces, projectId, platformId }: BuildPublishBundleParams): PublishBundle {
    return async () => {
        const { error } = await tryCatch(() => flowBundleStore(log, apiClient, basePath).publish({ flowVersion, pieces, projectId, platformId }))
        if (error) {
            log.warn({ error: String(error), flowVersion: { id: flowVersion.id } }, 'Failed to publish flow bundle')
        }
    }
}

async function resolvePieces({ flowVersion, platformId, log, apiClient, basePath, getSettings }: ResolvePiecesParams): Promise<PiecePackage[]> {
    const stepPieceRefs = flowSteps.piece(flowVersion).map((step) => ({
        pieceName: step.settings.pieceName,
        pieceVersion: step.settings.pieceVersion,
    }))
    const agentToolPieceRefs = flowStructureUtil.getAllSteps(flowVersion.trigger).flatMap(extractAgentToolPieceRefs)
    const uniquePieceRefs = dedupePieceRefs([...stepPieceRefs, ...agentToolPieceRefs])
    return Promise.all(uniquePieceRefs.map((ref) =>
        pieceCache(log, apiClient, basePath, getSettings).getPiece({
            pieceName: ref.pieceName,
            pieceVersion: ref.pieceVersion,
            platformId,
        }),
    ))
}

// Pieces used as agent tools live in a PIECE step's `agentTools` input, not as their own flow steps, so the
// step-based scan above misses them and the engine would fail at runtime with the tool's piece uninstalled.
function extractAgentToolPieceRefs(step: Step): PieceRef[] {
    if (step.type !== FlowActionType.PIECE) {
        return []
    }
    const agentTools = step.settings.input['agentTools']
    if (!Array.isArray(agentTools)) {
        return []
    }
    return agentTools.flatMap((tool: unknown) => {
        const parsed = AgentPieceTool.safeParse(tool)
        if (!parsed.success) {
            return []
        }
        return [{
            pieceName: parsed.data.pieceMetadata.pieceName,
            pieceVersion: parsed.data.pieceMetadata.pieceVersion,
        }]
    })
}

function dedupePieceRefs(refs: PieceRef[]): PieceRef[] {
    const byKey = new Map<string, PieceRef>()
    for (const ref of refs) {
        byKey.set(`${ref.pieceName}@${ref.pieceVersion}`, ref)
    }
    return [...byKey.values()]
}

function extractCodeArtifacts(flowVersion: FlowVersion): CodeArtifact[] {
    return flowSteps.code(flowVersion).map((step) => ({
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

type ResolvePiecesParams = {
    flowVersion: FlowVersion
    platformId: string
    log: ApLogger
    apiClient: WorkerToApiContract
    basePath: string
    getSettings: () => SandboxSettings
}

type BuildPublishBundleParams = {
    log: ApLogger
    apiClient: WorkerToApiContract
    basePath: string
    flowVersion: FlowVersion
    pieces: PiecePackage[]
    projectId: string
    platformId: string
}

type PieceRef = {
    pieceName: string
    pieceVersion: string
}

export type PublishBundle = () => Promise<void>

export type ProvisionedCode =
    | { kind: 'materialized' }
    | { kind: 'source', steps: CodeArtifact[] }

export type ResolvedFlow =
    | { kind: 'flow-not-found' }
    | { kind: 'disabled' }
    | { kind: 'ready', flowVersion: FlowVersion, pieces: PiecePackage[], code: ProvisionedCode, publishBundle: PublishBundle | null }
