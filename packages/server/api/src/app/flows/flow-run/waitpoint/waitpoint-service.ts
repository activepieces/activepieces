import { apId, isNil } from '@activepieces/core-utils'
import { ActivepiecesError, ErrorCode, FlowRunStatus, PauseType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { legacyResumeDelayJobId, resumeDelayJobId, SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { fanInBarrier } from './fan-in-barrier'
import { WaitpointEntity } from './waitpoint-entity'
import { CompleteParams, CompleteResult, CreateForPauseParams, CreateForPauseResult, FindPendingByVersionParams, HandleResumeSignalParams, Waitpoint, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)

export const waitpointService = (log: FastifyBaseLogger) => ({
    async createForPause(params: CreateForPauseParams): Promise<CreateForPauseResult> {
        if (params.isFanIn ?? false) {
            if (isNil(params.expectedChildren)) {
                return this.createFanInBarrier(params)
            }
            return { inserted: false, waitpoint: await this.sealFanInBarrier({ params }) }
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
                fanInBaseline: null,
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
            await scheduleTimeoutJob({
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
        return transaction(async (entityManager) => {
            const repo = waitpointRepo(entityManager)
            const counts = await fanInBarrier.countChildren({ parentRunId: params.flowRunId }, entityManager)
            const existing = await repo.findOneBy({ flowRunId: params.flowRunId, stepName: params.stepName })
            if (!isNil(existing) && existing.status === WaitpointStatus.PENDING) {
                if (fanInBarrier.hasChildrenBeyondBaseline({ counts, barrier: existing })) {
                    throw new ActivepiecesError({
                        code: ErrorCode.VALIDATION,
                        params: { message: 'This fan-in step already dispatched subflows for this run, so it cannot be started again — re-running the dispatch loop would create duplicate children. Retry the parent run from the beginning instead of retrying the step.' },
                    })
                }
                log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: existing.id } }, '[waitpointService#createFanInBarrier] Barrier already exists for this step, reusing it')
                return { inserted: false, waitpoint: existing }
            }
            if (!isNil(existing)) {
                log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: existing.id } }, '[waitpointService#createFanInBarrier] Discarding a completed barrier left over from a previous execution of this step')
                await repo.delete({ id: existing.id })
            }
            await repo.delete({ flowRunId: params.flowRunId, isFanIn: true, status: WaitpointStatus.PENDING, expectedChildren: IsNull() })

            if (counts.stillRunning > 0) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: 'Cannot start a wait-for-all fan-in step while this run still has subflow children running. Either a fire-and-forget fan-out is still in flight, or an earlier fan-in timed out and left stragglers behind. Mixing those with a wait-for-all fan-in in the same run is not supported; move the fire-and-forget dispatch into a child flow, or raise the earlier timeout.' },
                })
            }

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
                    fanInBaseline: fanInBarrier.toBaseline(counts),
                })
                .orIgnore()
                .execute()

            const waitpoint = await repo.findOneByOrFail({ flowRunId: params.flowRunId, stepName: params.stepName })
            log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: waitpoint.id }, baseline: waitpoint.fanInBaseline }, '[waitpointService#createFanInBarrier] Barrier created')
            return { inserted: waitpoint.id === id, waitpoint }
        })
    },

    async sealFanInBarrier({ params }: SealFanInBarrierParams): Promise<Waitpoint> {
        const barrier = await waitpointRepo().findOneBy({ flowRunId: params.flowRunId, stepName: params.stepName })
        if (isNil(barrier) || !barrier.isFanIn) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'The fan-in barrier for this step no longer exists, so the dispatched subflows cannot be waited on.' },
            })
        }
        const timeoutAt = clampFanInTimeout({ requested: params.resumeDateTime, log })
        await waitpointRepo().update({ id: barrier.id, status: WaitpointStatus.PENDING }, {
            expectedChildren: params.expectedChildren,
            failedToDispatch: params.failedToDispatch ?? 0,
            resumeDateTime: timeoutAt ?? null,
        })
        const sealed = await waitpointRepo().findOneByOrFail({ id: barrier.id })
        if (sealed.status !== WaitpointStatus.PENDING) {
            log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: sealed.id } }, '[waitpointService#sealFanInBarrier] Barrier was already completed, leaving it untouched')
            return sealed
        }

        const counts = await fanInBarrier.countChildren({ parentRunId: params.flowRunId })
        if (fanInBarrier.isReleasable({ counts, barrier: sealed })) {
            const summary = fanInBarrier.toSummary({ counts, barrier: sealed, timedOut: false })
            await this.complete({ flowRunId: params.flowRunId, projectId: params.projectId, waitpointId: sealed.id, resumePayload: { body: summary, headers: {}, queryParams: {} } })
            log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: sealed.id } }, '[waitpointService#sealFanInBarrier] All children terminal at seal; completed barrier, PAUSED-upload reconciliation will resume')
            return waitpointRepo().findOneByOrFail({ id: sealed.id })
        }

        if (!isNil(timeoutAt)) {
            await scheduleTimeoutJob({
                flowRunId: params.flowRunId,
                projectId: params.projectId,
                waitpointId: sealed.id,
                resumeDateTime: timeoutAt,
                log,
            })
        }
        return sealed
    },

    async findFanInBarrier({ flowRunId }: { flowRunId: string }): Promise<Waitpoint | null> {
        const sealedAndPending = await waitpointRepo().findOne({
            where: { flowRunId, isFanIn: true, status: WaitpointStatus.PENDING, expectedChildren: Not(IsNull()) },
            order: { created: 'DESC' },
        })
        if (!isNil(sealedAndPending)) {
            return sealedAndPending
        }
        return waitpointRepo().findOne({
            where: { flowRunId, isFanIn: true, status: WaitpointStatus.COMPLETED },
            order: { created: 'DESC' },
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
            await removeTimeoutJobs({ waitpointId: waitpoint.id, flowRunId, log })
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

    async findNonFanInByFlowRunId(flowRunId: string): Promise<Waitpoint | null> {
        const completed = await waitpointRepo().findOneBy({ flowRunId, status: WaitpointStatus.COMPLETED, isFanIn: false })
        return completed ?? waitpointRepo().findOneBy({ flowRunId, isFanIn: false })
    },

    async delete({ id }: { id: string }): Promise<void> {
        const waitpoint = await waitpointRepo().findOneBy({ id })
        await waitpointRepo().delete({ id })
        if (!isNil(waitpoint)) {
            await removeTimeoutJobs({ waitpointId: waitpoint.id, flowRunId: waitpoint.flowRunId, log })
        }
        log.info({ waitpoint: { id } }, '[waitpointService#delete] Waitpoint deleted')
    },

    async deleteByFlowRunId(flowRunId: string): Promise<void> {
        const waitpoints = await waitpointRepo().findBy({ flowRunId })
        await waitpointRepo().delete({ flowRunId })
        for (const waitpoint of waitpoints) {
            await removeTimeoutJobs({ waitpointId: waitpoint.id, flowRunId, log })
        }
        log.info({ flowRun: { id: flowRunId } }, '[waitpointService#deleteByFlowRunId] Waitpoint deleted')
    },
})

async function scheduleTimeoutJob({ flowRunId, projectId, waitpointId, resumeDateTime, log }: ScheduleTimeoutJobParams): Promise<void> {
    await systemJobsSchedule(log).upsertJob({
        job: {
            name: SystemJobName.RESUME_DELAY_WAITPOINT,
            data: { flowRunId, projectId, waitpointId },
            jobId: resumeDelayJobId({ waitpointId }),
        },
        schedule: {
            type: 'one-time',
            date: dayjs(resumeDateTime),
        },
    })
}

async function removeTimeoutJobs({ waitpointId, flowRunId, log }: RemoveTimeoutJobsParams): Promise<void> {
    await systemJobsSchedule(log).removeJob({ jobId: resumeDelayJobId({ waitpointId }) })
    const legacyJobId = legacyResumeDelayJobId({ flowRunId })
    const legacyJob = await systemJobsSchedule(log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(legacyJobId)
    if (!isNil(legacyJob) && legacyJob.data.waitpointId === waitpointId) {
        await systemJobsSchedule(log).removeJob({ jobId: legacyJobId })
    }
}

function clampFanInTimeout({ requested, log }: ClampFanInTimeoutParams): string | undefined {
    if (isNil(requested)) {
        return undefined
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
    const maxAt = now.add(system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS), 'day')
    if (requestedAt.isAfter(maxAt)) {
        log.warn({ requested, clampedTo: maxAt.toISOString() }, '[waitpointService#clampFanInTimeout] Fan-in timeout exceeds the maximum pause duration, clamping it')
        return maxAt.toISOString()
    }
    return requestedAt.toISOString()
}

type SealFanInBarrierParams = {
    params: CreateForPauseParams
}

type ScheduleTimeoutJobParams = {
    flowRunId: string
    projectId: string
    waitpointId: string
    resumeDateTime: string
    log: FastifyBaseLogger
}

type RemoveTimeoutJobsParams = {
    waitpointId: string
    flowRunId: string
    log: FastifyBaseLogger
}

type ClampFanInTimeoutParams = {
    requested: string | undefined
    log: FastifyBaseLogger
}
