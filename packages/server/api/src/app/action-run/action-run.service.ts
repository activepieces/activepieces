import { ActivepiecesError, apId, ErrorCode, isNil, Result, tryCatch } from '@activepieces/core-utils'
import { ActionRunStep, CodeAction, FlowActionType, FlowRunStatus, PieceAction, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getPiecePackageWithoutArchive } from '../pieces/metadata/piece-metadata-service'
import { jobQueue } from '../workers/job-queue/job-queue'
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
        const validatedStep = parseStep(step)
        const piece = validatedStep.type === FlowActionType.PIECE
            ? await getPiecePackageWithoutArchive(log, platformId, {
                pieceName: validatedStep.settings.pieceName,
                pieceVersion: validatedStep.settings.pieceVersion,
            })
            : undefined

        // `id` is also the watcher's requestId, which becomes the BullMQ job id and the `requestId` on
        // every worker and engine log line — so the id handed back to the caller traces the whole run.
        const id = apId()
        const result = await tryCatch(() => userInteractionWatcher.submitAndWaitForResponse<EngineActionResponse>({
            jobType: WorkerJobType.EXECUTE_ACTION,
            projectId,
            platformId,
            step: validatedStep,
            piece,
            expiresAt: Date.now() + ACTION_RUN_BUDGET_MS,
        }, log, id, ACTION_RUN_BUDGET_MS + WATCHER_GRACE_MS))

        const outcome = deriveActionRunOutcome({ result })
        const neverStarted = outcome.neverStarted || await cancelledBeforeStarting({ outcome, result, id, projectId, platformId, log })
        log.info({ actionRun: { id, status: outcome.status, neverStarted } }, '[actionRunService#run] completed')
        return { id, ...outcome, neverStarted }
    },
})

// Invalid here means a caller built a malformed step, not a user error. Left unvalidated it reaches
// the queue, fails schema validation at dequeue as unrecoverable — a path that never publishes to the
// watcher — and the caller hangs for the full budget before being told the action may have written.
function parseStep(step: PieceAction | CodeAction): ActionRunStep {
    const parsed = ActionRunStep.safeParse(step)
    if (!parsed.success) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `Invalid action-run step: ${parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}` },
        })
    }
    return parsed.data
}

// The watcher gave up without an answer: either no worker ever took the job, or one died mid-run.
// Cancelling settles which — a job still queued provably never executed — and it also stops that job
// from running and writing later, long after the caller walked away.
async function cancelledBeforeStarting({ outcome, result, id, projectId, platformId, log }: CancelledBeforeStartingParams): Promise<boolean> {
    if (outcome.status !== FlowRunStatus.TIMEOUT || !isNil(result.data)) {
        return false
    }
    const { data: cancelled, error } = await tryCatch(() => jobQueue(log).cancelIfNotStarted({
        jobId: id,
        platformId,
        projectId,
        jobType: WorkerJobType.EXECUTE_ACTION,
    }))
    if (error) {
        log.warn({ actionRun: { id }, error: String(error) }, '[actionRunService#run] could not determine whether the job started')
        return false
    }
    return cancelled
}

type RunParams = {
    projectId: string
    platformId: string
    step: PieceAction | CodeAction
}

type CancelledBeforeStartingParams = {
    outcome: ActionRunOutcome
    result: Result<EngineActionResponse, unknown>
    id: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}

export type ActionRunResult = ActionRunOutcome & { id: string }
