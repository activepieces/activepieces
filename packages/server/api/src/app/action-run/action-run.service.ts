import { ActivepiecesError, apId, ErrorCode, isNil, Result, tryCatch } from '@activepieces/core-utils'
import { ActionRunStep, CodeAction, FlowActionType, FlowRunStatus, PieceAction, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getPiecePackageWithoutArchive } from '../pieces/metadata/piece-metadata-service'
import { jobQueue } from '../workers/job-queue/job-queue'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import { ActionRunOutcome, deriveActionRunOutcome, EngineActionResponse } from './action-run-outcome'

const ACTION_RUN_BUDGET_MS = 120 * 1000

export const actionRunService = (log: FastifyBaseLogger) => ({
    async run({ projectId, platformId, step }: RunParams): Promise<ActionRunResult> {
        const validatedStep = parseStep(step)
        const piece = validatedStep.type === FlowActionType.PIECE
            ? await getPiecePackageWithoutArchive(log, platformId, {
                pieceName: validatedStep.settings.pieceName,
                pieceVersion: validatedStep.settings.pieceVersion,
            })
            : undefined

        const id = apId()
        const result = await tryCatch(() => userInteractionWatcher.submitAndWaitForResponse<EngineActionResponse>({
            jobType: WorkerJobType.EXECUTE_ACTION,
            projectId,
            platformId,
            step: validatedStep,
            piece,
            expiresAt: Date.now() + ACTION_RUN_BUDGET_MS,
        }, log, id))

        const outcome = deriveActionRunOutcome({ result })
        const neverStarted = outcome.neverStarted || await abandonedWithoutStarting({ outcome, result, id, projectId, platformId, log })
        log.info({ actionRun: { id, status: outcome.status, neverStarted } }, '[actionRunService#run] completed')
        return { id, ...outcome, neverStarted }
    },
})

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

async function abandonedWithoutStarting({ outcome, result, id, projectId, platformId, log }: AbandonedWithoutStartingParams): Promise<boolean> {
    if (outcome.status !== FlowRunStatus.TIMEOUT || !isNil(result.data)) {
        return false
    }
    const { data: neverStarted, error } = await tryCatch(() => jobQueue(log).cancelAndReportNeverStarted({
        jobId: id,
        platformId,
        projectId,
        jobType: WorkerJobType.EXECUTE_ACTION,
    }))
    if (error) {
        log.warn({ actionRun: { id }, error: String(error) }, '[actionRunService#run] could not determine whether the job started')
        return false
    }
    return neverStarted
}

type RunParams = {
    projectId: string
    platformId: string
    step: PieceAction | CodeAction
}

type AbandonedWithoutStartingParams = {
    outcome: ActionRunOutcome
    result: Result<EngineActionResponse, unknown>
    id: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}

export type ActionRunResult = ActionRunOutcome & { id: string }
