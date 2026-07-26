import { apId, tryCatch } from '@activepieces/core-utils'
import { CodeAction, FlowActionType, PieceAction, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getPiecePackageWithoutArchive } from '../pieces/metadata/piece-metadata-service'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import { ActionRunOutcome, deriveActionRunOutcome, EngineActionResponse } from './action-run-outcome'

// The worker caps the sandbox at ACTION_RUN_ACTION_TIMEOUT_SECONDS (120s) and answers with a clean
// TIMEOUT. This watcher budget sits just above it so the sandbox normally wins and the watcher is
// only the backstop for a worker that never answers at all (killed mid-run by a deploy or an OOM).
// Without it the caller would inherit the shared 5-minute WATCHER_SAFETY_TIMEOUT_MS, blocking an MCP
// tool call or a chat turn for far longer than the 120s budget those callers document.
const ACTION_RUN_WATCHER_TIMEOUT_MS = 130 * 1000

export const actionRunService = (log: FastifyBaseLogger) => ({
    async run({ projectId, platformId, step }: RunParams): Promise<ActionRunResult> {
        const piece = step.type === FlowActionType.PIECE
            ? await getPiecePackageWithoutArchive(log, platformId, {
                pieceName: step.settings.pieceName,
                pieceVersion: step.settings.pieceVersion,
            })
            : undefined

        const id = apId()
        const result = await tryCatch(() => userInteractionWatcher.submitAndWaitForResponse<EngineActionResponse>({
            jobType: WorkerJobType.EXECUTE_ACTION,
            projectId,
            platformId,
            step,
            piece,
        }, log, undefined, ACTION_RUN_WATCHER_TIMEOUT_MS))

        const outcome = deriveActionRunOutcome({ result })
        log.info({ actionRun: { id, status: outcome.status } }, '[actionRunService#run] completed')
        return { id, ...outcome }
    },
})

type RunParams = {
    projectId: string
    platformId: string
    step: PieceAction | CodeAction
}

export type ActionRunResult = ActionRunOutcome & { id: string }
