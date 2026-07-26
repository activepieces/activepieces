import { apId, isNil } from '@activepieces/core-utils'
import { ActivepiecesError, ErrorCode, FlowRunStatus, PauseType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { fanInBarrier } from './fan-in-summary'
import { WaitpointEntity } from './waitpoint-entity'
import { CompleteParams, CompleteResult, CreateForPauseParams, CreateForPauseResult, FindPendingByVersionParams, HandleResumeSignalParams, Waitpoint, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)

export const waitpointService = (log: FastifyBaseLogger) => ({
    async createForPause(params: CreateForPauseParams): Promise<CreateForPauseResult> {
        const preCompleted = await waitpointRepo().findOneBy({
            flowRunId: params.flowRunId,
            stepName: params.stepName,
            status: WaitpointStatus.COMPLETED,
        })
        if (!isNil(preCompleted)) {
            log.info({ flowRun: { id: params.flowRunId }, step: { name: params.stepName }, existingStatus: preCompleted.status }, '[waitpointService#createForPause] Waitpoint already pre-completed for this step')
            return { inserted: false, waitpoint: preCompleted }
        }

        const isSeal = !isNil(params.expectedChildren)
        const isFanInCreate = (params.isFanIn ?? false) && !isSeal
        if (isFanInCreate) {
            const nonTerminalChildren = await fanInBarrier.countNonTerminalChildren({ parentRunId: params.flowRunId })
            if (nonTerminalChildren > 0) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: 'Cannot start a wait-for-all fan-in step while this run still has subflow children running. Mixing a fire-and-forget fan-out with a wait-for-all fan-in in the same run is not supported.' },
                })
            }
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
                isFanIn: params.isFanIn ?? false,
            })
            .orIgnore()
            .execute()

        const waitpoint = await waitpointRepo().findOneByOrFail({ flowRunId: params.flowRunId, stepName: params.stepName })
        const inserted = waitpoint.id === id
        if (inserted) {
            log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id } }, '[waitpointService#createForPause] Waitpoint created')
            if (params.type === PauseType.DELAY && !isNil(params.resumeDateTime)) {
                await systemJobsSchedule(log).upsertJob({
                    job: {
                        name: SystemJobName.RESUME_DELAY_WAITPOINT,
                        data: { flowRunId: params.flowRunId, projectId: params.projectId, waitpointId: id },
                        jobId: `resume-delay-${params.flowRunId}`,
                    },
                    schedule: {
                        type: 'one-time',
                        date: dayjs(params.resumeDateTime),
                    },
                })
            }
            return { inserted, waitpoint }
        }

        log.info({ flowRun: { id: params.flowRunId }, existingStatus: waitpoint.status }, '[waitpointService#createForPause] Waitpoint already exists')
        if (isSeal) {
            return { inserted: false, waitpoint: await this.sealFanInBarrier({ params, barrier: waitpoint }) }
        }
        return { inserted, waitpoint }
    },

    async sealFanInBarrier({ params, barrier }: SealFanInBarrierParams): Promise<Waitpoint> {
        await waitpointRepo().update({ id: barrier.id }, {
            expectedChildren: params.expectedChildren,
            resumeDateTime: params.resumeDateTime ?? null,
        })
        if (!isNil(params.resumeDateTime)) {
            await systemJobsSchedule(log).upsertJob({
                job: {
                    name: SystemJobName.RESUME_DELAY_WAITPOINT,
                    data: { flowRunId: params.flowRunId, projectId: params.projectId, waitpointId: barrier.id },
                    jobId: `resume-delay-${params.flowRunId}`,
                },
                schedule: {
                    type: 'one-time',
                    date: dayjs(params.resumeDateTime),
                },
            })
        }
        const sealed = await waitpointRepo().findOneByOrFail({ id: barrier.id })
        const allTerminal = sealed.status === WaitpointStatus.PENDING
            && !isNil(sealed.expectedChildren)
            && sealed.terminalChildren >= sealed.expectedChildren
        if (allTerminal) {
            const summary = await fanInBarrier.buildSummary({ parentRunId: params.flowRunId, expectedChildren: sealed.expectedChildren ?? 0, timedOut: false })
            await this.complete({ flowRunId: params.flowRunId, projectId: params.projectId, waitpointId: sealed.id, resumePayload: { body: summary, headers: {}, queryParams: {} } })
            log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: sealed.id } }, '[waitpointService#sealFanInBarrier] All children terminal at seal; completed barrier, PAUSED-upload reconciliation will resume')
            return waitpointRepo().findOneByOrFail({ id: sealed.id })
        }
        return sealed
    },

    async incrementTerminalChildren({ parentRunId }: { parentRunId: string }, entityManager: EntityManager): Promise<Waitpoint | null> {
        const repo = waitpointRepo(entityManager)
        const barrier = await repo
            .createQueryBuilder('waitpoint')
            .setLock('pessimistic_write')
            .where({ flowRunId: parentRunId, status: WaitpointStatus.PENDING, isFanIn: true })
            .getOne()
        if (isNil(barrier)) {
            return null
        }
        const updated: Waitpoint = { ...barrier, terminalChildren: barrier.terminalChildren + 1 }
        await repo.save(updated)
        return updated
    },

    async getFanInBarrier(flowRunId: string): Promise<Waitpoint | null> {
        return waitpointRepo().findOneBy({ flowRunId, status: WaitpointStatus.PENDING, isFanIn: true })
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

    async delete({ id }: { id: string }): Promise<void> {
        await waitpointRepo().delete({ id })
        log.info({ waitpoint: { id } }, '[waitpointService#delete] Waitpoint deleted')
    },

    async deleteByFlowRunId(flowRunId: string): Promise<void> {
        await waitpointRepo().delete({ flowRunId })
        log.info({ flowRun: { id: flowRunId } }, '[waitpointService#deleteByFlowRunId] Waitpoint deleted')
    },
})

type SealFanInBarrierParams = {
    params: CreateForPauseParams
    barrier: Waitpoint
}
