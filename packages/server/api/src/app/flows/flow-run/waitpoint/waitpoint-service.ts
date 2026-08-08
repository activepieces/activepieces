import { apId, isNil } from '@activepieces/core-utils'
import { ActivepiecesError, ErrorCode, FanInBarrierState, FlowRunStatus, PauseType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { fanInBarrier, FanInChild, FanInChildCounts } from './fan-in-barrier'
import { WaitpointEntity } from './waitpoint-entity'
import { waitpointTimeoutJob } from './waitpoint-timeout-job'
import { CompleteParams, CompleteResult, CreateForPauseParams, CreateForPauseResult, FindPendingByVersionParams, HandleResumeSignalParams, Waitpoint, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)

export const waitpointService = (log: FastifyBaseLogger) => ({
    async createForPause(params: CreateForPauseParams): Promise<CreateForPauseResult> {
        if (params.isFanIn ?? false) {
            return this.createFanInBarrier(params)
        }

        const preCompleted = await waitpointRepo().findOneBy({
            flowRunId: params.flowRunId,
            stepName: params.stepName,
            status: WaitpointStatus.COMPLETED,
        })
        if (!isNil(preCompleted)) {
            log.info({ flowRun: { id: params.flowRunId }, step: { name: params.stepName }, existingStatus: preCompleted.status }, '[waitpointService#createForPause] Waitpoint already pre-completed for this step')
            return { inserted: false, waitpoint: preCompleted }
        }

        const id = apId()
        await waitpointRepo()
            .createQueryBuilder()
            .insert()
            .into('waitpoint')
            .values({
                id,
                flowRunId: params.flowRunId,
                projectId: params.projectId,
                stepName: params.stepName,
                type: params.type,
                version: params.version,
                status: WaitpointStatus.PENDING,
                resumeDateTime: params.resumeDateTime ?? null,
                responseToSend: params.responseToSend ?? null,
                workerHandlerId: params.workerHandlerId ?? null,
                httpRequestId: params.httpRequestId ?? null,
                resumePayload: null,
                isFanIn: false,
                failedToDispatch: 0,
            })
            .orIgnore()
            .execute()

        const waitpoint = await waitpointRepo().findOneByOrFail({ flowRunId: params.flowRunId, stepName: params.stepName })
        const inserted = waitpoint.id === id
        if (!inserted) {
            log.info({ flowRun: { id: params.flowRunId }, existingStatus: waitpoint.status }, '[waitpointService#createForPause] Waitpoint already exists')
            return { inserted, waitpoint }
        }

        log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id } }, '[waitpointService#createForPause] Waitpoint created')
        if (params.type === PauseType.DELAY && !isNil(params.resumeDateTime)) {
            await waitpointTimeoutJob.schedule({
                flowRunId: params.flowRunId,
                projectId: params.projectId,
                waitpointId: id,
                resumeDateTime: params.resumeDateTime,
                log,
            })
        }
        return { inserted, waitpoint }
    },

    async createFanInBarrier(params: CreateForPauseParams): Promise<CreateForPauseResult> {
        const dispatchDigest = params.dispatchDigest
        if (isNil(dispatchDigest)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'A fan-in barrier must be created with a dispatchDigest, so a dispatcher re-entering after a crash can prove it resolved the same payload before dispatching the rest.' },
            })
        }
        if (!isNil(params.intendedChildren)) {
            assertFanInChildrenWithinLimit({ dispatched: params.intendedChildren })
        }
        return transaction(async (entityManager) => {
            const repo = waitpointRepo(entityManager)
            const existing = await repo.findOneBy({ flowRunId: params.flowRunId, stepName: params.stepName })
            if (!isNil(existing) && existing.status === WaitpointStatus.PENDING) {
                const children = await fanInBarrier.listChildren({ parentWaitpointId: existing.id, projectId: params.projectId, entityManager })
                assertReEntryIsSafe({ children })
                log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: existing.id }, childCount: children.length }, '[waitpointService#createFanInBarrier] Barrier already exists for this step, reusing it')
                return { inserted: false, waitpoint: existing, fanIn: toBarrierState({ barrier: existing, children }) }
            }
            if (!isNil(existing)) {
                log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: existing.id } }, '[waitpointService#createFanInBarrier] Discarding a completed barrier left over from a previous execution of this step')
                await repo.delete({ id: existing.id })
            }
            await repo.delete({ flowRunId: params.flowRunId, isFanIn: true, status: WaitpointStatus.PENDING, expectedChildren: IsNull() })

            const id = apId()
            await repo
                .createQueryBuilder()
                .insert()
                .into('waitpoint')
                .values({
                    id,
                    flowRunId: params.flowRunId,
                    projectId: params.projectId,
                    stepName: params.stepName,
                    type: params.type,
                    version: params.version,
                    status: WaitpointStatus.PENDING,
                    resumeDateTime: null,
                    responseToSend: params.responseToSend ?? null,
                    workerHandlerId: params.workerHandlerId ?? null,
                    httpRequestId: params.httpRequestId ?? null,
                    resumePayload: null,
                    isFanIn: true,
                    expectedChildren: null,
                    failedToDispatch: 0,
                    dispatchDigest,
                })
                .orIgnore()
                .execute()

            const waitpoint = await repo.findOneByOrFail({ flowRunId: params.flowRunId, stepName: params.stepName })
            log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: waitpoint.id } }, '[waitpointService#createFanInBarrier] Barrier created')
            return { inserted: waitpoint.id === id, waitpoint, fanIn: toBarrierState({ barrier: waitpoint, children: [] }) }
        })
    },

    async sealFanInBarrier(params: SealFanInBarrierParams): Promise<SealFanInBarrierResult> {
        assertFanInChildrenWithinLimit({ dispatched: params.expectedChildren + (params.failedToDispatch ?? 0) })
        const barrier = await waitpointRepo().findOneBy({ id: params.waitpointId, projectId: params.projectId })
        if (isNil(barrier) || !barrier.isFanIn) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'The fan-in barrier for this step no longer exists, so the dispatched subflows cannot be waited on.' },
            })
        }
        const flowRunId = barrier.flowRunId
        const alreadySealed = !isNil(barrier.expectedChildren)
        const timeoutAt = clampFanInTimeout({ requested: params.timeoutAt, log })
        await waitpointRepo().update({ id: barrier.id, status: WaitpointStatus.PENDING, expectedChildren: IsNull() }, {
            expectedChildren: params.expectedChildren,
            failedToDispatch: params.failedToDispatch ?? 0,
            resumeDateTime: timeoutAt,
        })
        if (alreadySealed) {
            log.info({ flowRun: { id: flowRunId }, waitpoint: { id: barrier.id }, expectedChildren: barrier.expectedChildren }, '[waitpointService#sealFanInBarrier] Barrier was already sealed; ignoring the re-seal and re-evaluating the release predicate against the original expectation')
        }
        const sealed = await waitpointRepo().findOneByOrFail({ id: barrier.id })
        const effectiveTimeoutAt = isNil(sealed.resumeDateTime) ? timeoutAt : dayjs(sealed.resumeDateTime).toISOString()
        if (sealed.status !== WaitpointStatus.PENDING) {
            log.info({ flowRun: { id: flowRunId }, waitpoint: { id: sealed.id } }, '[waitpointService#sealFanInBarrier] Barrier was already completed, leaving it untouched')
            return { waitpoint: sealed, alreadySealed, timeoutAt: effectiveTimeoutAt }
        }

        const counts = await fanInBarrier.countChildren({ parentWaitpointId: sealed.id, projectId: params.projectId })
        if (fanInBarrier.isReleasable({ counts, barrier: sealed })) {
            await this.completeFanInBarrier({ barrier: sealed, projectId: params.projectId, counts, timedOut: false })
            log.info({ flowRun: { id: flowRunId }, waitpoint: { id: sealed.id } }, '[waitpointService#sealFanInBarrier] All children terminal at seal; completed barrier, PAUSED-upload reconciliation will resume')
            return { waitpoint: await waitpointRepo().findOneByOrFail({ id: sealed.id }), alreadySealed, timeoutAt: effectiveTimeoutAt }
        }

        await waitpointTimeoutJob.schedule({
            flowRunId,
            projectId: params.projectId,
            waitpointId: sealed.id,
            resumeDateTime: effectiveTimeoutAt,
            log,
        })
        return { waitpoint: sealed, alreadySealed, timeoutAt: effectiveTimeoutAt }
    },

    async findFanInBarrierById({ waitpointId, projectId }: FindFanInBarrierByIdParams): Promise<Waitpoint | null> {
        const waitpoint = await waitpointRepo().findOneBy({ id: waitpointId, projectId })
        if (isNil(waitpoint) || !waitpoint.isFanIn) {
            return null
        }
        return waitpoint
    },

    async completeFanInBarrier({ barrier, projectId, counts, timedOut }: CompleteFanInBarrierParams): Promise<CompleteResult> {
        return this.complete({
            flowRunId: barrier.flowRunId,
            projectId,
            waitpointId: barrier.id,
            resumePayload: { body: fanInBarrier.toSummary({ counts, barrier, timedOut }), headers: {}, queryParams: {} },
        })
    },

    async complete(params: CompleteParams): Promise<CompleteResult> {
        return transaction(async (entityManager) => {
            const repo = waitpointRepo(entityManager)

            const pending = await repo
                .createQueryBuilder('waitpoint')
                .setLock('pessimistic_write')
                .where({ id: params.waitpointId, flowRunId: params.flowRunId, status: WaitpointStatus.PENDING })
                .getOne()

            if (isNil(pending)) {
                log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: params.waitpointId } }, '[waitpointService#complete] No pending waitpoint matches; dropping stale resume signal')
                return { completedExisting: false, waitpoint: null }
            }

            const updated: Waitpoint = {
                ...pending,
                status: WaitpointStatus.COMPLETED,
                resumePayload: params.resumePayload,
                workerHandlerId: params.workerHandlerId ?? pending.workerHandlerId,
            }
            await repo.save(updated)
            log.info({ flowRun: { id: params.flowRunId } }, '[waitpointService#complete] Completed existing PENDING waitpoint')
            return { completedExisting: true, waitpoint: updated }
        })
    },

    async handleResumeSignal(params: HandleResumeSignalParams): Promise<boolean> {
        const { flowRunId, waitpointId, flowRunStatus, projectId, resumePayload, workerHandlerId, onReady } = params

        if (flowRunStatus === FlowRunStatus.PAUSED) {
            const waitpoint = await transaction(async (entityManager) => {
                const repo = waitpointRepo(entityManager)
                const found = await repo
                    .createQueryBuilder('waitpoint')
                    .setLock('pessimistic_write')
                    .where({ id: waitpointId, flowRunId })
                    .getOne()
                if (isNil(found)) {
                    return null
                }
                await onReady(found)
                await repo.delete({ id: found.id })
                return found
            })
            if (isNil(waitpoint)) {
                log.info({ flowRun: { id: flowRunId }, waitpoint: { id: waitpointId } }, '[waitpointService#handleResumeSignal] Stale waitpointId, ignoring')
                return false
            }
            await waitpointTimeoutJob.remove({ waitpointId: waitpoint.id, flowRunId, log })
            log.info({ flowRun: { id: flowRunId }, waitpoint: { id: waitpointId } }, '[waitpointService#handleResumeSignal] Resume triggered')
            return true
        }

        if (flowRunStatus === FlowRunStatus.RUNNING || flowRunStatus === FlowRunStatus.QUEUED) {
            const { completedExisting } = await this.complete({ flowRunId, projectId, waitpointId, resumePayload, workerHandlerId })
            if (!completedExisting) {
                log.info({ flowRun: { id: flowRunId }, waitpoint: { id: waitpointId } }, '[waitpointService#handleResumeSignal] Stale resume signal during RUNNING/QUEUED, ignoring')
                return false
            }
            log.info({ flowRun: { id: flowRunId } }, '[waitpointService#handleResumeSignal] Marked PENDING waitpoint COMPLETED while flow still RUNNING/QUEUED; runsMetadataQueue will trigger resume on PAUSED upload')
            return true
        }

        log.info({ flowRun: { id: flowRunId }, flowRunStatus }, '[waitpointService#handleResumeSignal] Flow run not in resumable state, ignoring')
        return false
    },

    async findPendingByVersion({ flowRunId, version }: FindPendingByVersionParams): Promise<Waitpoint | null> {
        return waitpointRepo().findOne({
            where: { flowRunId, status: WaitpointStatus.PENDING, version },
        })
    },

    async findByIdAndFlowRunId({ waitpointId, flowRunId }: { waitpointId: string, flowRunId: string }): Promise<Waitpoint | null> {
        return waitpointRepo().findOneBy({ id: waitpointId, flowRunId })
    },

    async getByFlowRunId(flowRunId: string): Promise<Waitpoint | null> {
        const completed = await waitpointRepo().findOneBy({ flowRunId, status: WaitpointStatus.COMPLETED })
        return completed ?? waitpointRepo().findOneBy({ flowRunId })
    },

    async hasPendingFanInBarrier({ flowRunId, projectId }: HasPendingFanInBarrierParams): Promise<boolean> {
        const barrier = await waitpointRepo().findOneBy({ flowRunId, projectId, isFanIn: true, status: WaitpointStatus.PENDING })
        return !isNil(barrier)
    },

    async findNonFanInByFlowRunId({ flowRunId, projectId }: FindNonFanInByFlowRunIdParams): Promise<Waitpoint | null> {
        const completed = await waitpointRepo().findOneBy({ flowRunId, projectId, status: WaitpointStatus.COMPLETED, isFanIn: false })
        return completed ?? waitpointRepo().findOneBy({ flowRunId, projectId, isFanIn: false })
    },

    async delete({ id, projectId }: DeleteWaitpointParams): Promise<void> {
        const waitpoint = await waitpointRepo().findOneBy({ id, projectId })
        await waitpointRepo().delete({ id, projectId })
        if (!isNil(waitpoint)) {
            await waitpointTimeoutJob.remove({ waitpointId: waitpoint.id, flowRunId: waitpoint.flowRunId, log })
        }
        log.info({ waitpoint: { id } }, '[waitpointService#delete] Waitpoint deleted')
    },

    async deleteByFlowRunId(flowRunId: string): Promise<void> {
        const waitpoints = await waitpointRepo().findBy({ flowRunId })
        await waitpointRepo().delete({ flowRunId })
        for (const waitpoint of waitpoints) {
            await waitpointTimeoutJob.remove({ waitpointId: waitpoint.id, flowRunId, log })
        }
        log.info({ flowRun: { id: flowRunId } }, '[waitpointService#deleteByFlowRunId] Waitpoint deleted')
    },
})

function assertFanInChildrenWithinLimit({ dispatched }: AssertFanInChildrenWithinLimitParams): void {
    const maxChildren = system.getNumberOrThrow(AppSystemProp.MAX_FAN_IN_CHILDREN)
    if (dispatched > maxChildren) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `This fan-in step dispatched ${dispatched} subflows, which exceeds the maximum of ${maxChildren}. Dispatch fewer children or raise AP_MAX_FAN_IN_CHILDREN.` },
        })
    }
}

function assertReEntryIsSafe({ children }: AssertReEntryIsSafeParams): void {
    if (children.length === 0) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: 'This fan-in step already dispatched subflows, so it cannot be started again — re-running the dispatch loop would create duplicate children. Retry the parent run from the beginning instead of retrying the step.' },
    })
}

function toBarrierState({ barrier, children }: ToBarrierStateParams): FanInBarrierState {
    return {
        sealed: !isNil(barrier.expectedChildren),
        expectedChildren: barrier.expectedChildren,
        dispatchedIndices: children.map((child) => child.dispatchIndex).filter((index): index is number => !isNil(index)),
    }
}

function clampFanInTimeout({ requested, log }: ClampFanInTimeoutParams): string {
    const maxDurationInDays = system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
    if (isNil(requested)) {
        return dayjs().add(maxDurationInDays, 'day').toISOString()
    }
    const requestedAt = dayjs(requested)
    if (!requestedAt.isValid()) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'The fan-in timeout is not a valid date.' },
        })
    }
    const now = dayjs()
    if (requestedAt.isBefore(now)) {
        return now.toISOString()
    }
    const maxAt = now.add(maxDurationInDays, 'day')
    if (requestedAt.isAfter(maxAt)) {
        log.warn({ requested, clampedTo: maxAt.toISOString() }, '[waitpointService#clampFanInTimeout] Fan-in timeout exceeds the maximum pause duration, clamping it')
        return maxAt.toISOString()
    }
    return requestedAt.toISOString()
}

type SealFanInBarrierParams = {
    waitpointId: string
    projectId: string
    expectedChildren: number
    failedToDispatch?: number
    timeoutAt?: string
}

type SealFanInBarrierResult = {
    waitpoint: Waitpoint
    alreadySealed: boolean
    timeoutAt: string
}

type AssertFanInChildrenWithinLimitParams = {
    dispatched: number
}

type AssertReEntryIsSafeParams = {
    children: FanInChild[]
}

type CompleteFanInBarrierParams = {
    barrier: Waitpoint
    projectId: string
    counts: FanInChildCounts
    timedOut: boolean
}

type HasPendingFanInBarrierParams = {
    flowRunId: string
    projectId: string
}

type FindNonFanInByFlowRunIdParams = {
    flowRunId: string
    projectId: string
}

type DeleteWaitpointParams = {
    id: string
    projectId: string
}

type ToBarrierStateParams = {
    barrier: Waitpoint
    children: FanInChild[]
}

type FindFanInBarrierByIdParams = {
    waitpointId: string
    projectId: string
}

type ClampFanInTimeoutParams = {
    requested?: string
    log: FastifyBaseLogger
}
