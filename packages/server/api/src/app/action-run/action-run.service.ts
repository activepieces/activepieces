import { apId, tryCatch } from '@activepieces/core-utils'
import { CodeAction, FlowActionType, PieceAction, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getPiecePackageWithoutArchive } from '../pieces/metadata/piece-metadata-service'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import { ActionRunOutcome, deriveActionRunOutcome, EngineActionResponse } from './action-run-outcome'

// The budget is end-to-end and belongs to the caller: it is stamped onto the job as an absolute
// deadline, so queueing, resolution and provisioning all spend the same 120s the sandbox does, and
// the worker kills the run at the deadline instead of starting a fresh 120s clock of its own. A
// watcher that expired first would hand the caller a TIMEOUT while the action kept running and
// writing, and the retry that invites duplicates the write. The grace only has to cover the
// sandbox kill and the pubsub hop back, so the watcher stays the backstop for a worker that never
// answers at all (killed mid-run by a deploy or an OOM).
const ACTION_RUN_BUDGET_MS = 120 * 1000
const WATCHER_GRACE_MS = 10 * 1000

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
            expiresAt: Date.now() + ACTION_RUN_BUDGET_MS,
        }, log, undefined, ACTION_RUN_BUDGET_MS + WATCHER_GRACE_MS))

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
