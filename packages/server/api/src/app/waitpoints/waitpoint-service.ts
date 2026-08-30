import { apId, isNil } from '@activepieces/core-utils'
import { FlowRunStatus, PauseType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Not } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { WaitpointEntity } from './waitpoint-entity'
import { waitpointTimeoutJob } from './waitpoint-timeout-job'
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
                sealed: false,
                policy: null,
            })
            .orIgnore()
            .execute()

        const waitpoint = await waitpointRepo().findOneByOrFail({ flowRunId: params.flowRunId, stepName: params.stepName })
        const inserted = waitpoint.id === id
        if (inserted) {
            log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id } }, '[waitpointService#createForPause] Waitpoint created')
        }
        else {
            log.info({ flowRun: { id: params.flowRunId }, existingStatus: waitpoint.status }, '[waitpointService#createForPause] Waitpoint already exists')
        }
        if (!isNil(params.resumeDateTime)) {
            await waitpointTimeoutJob.schedule({
                flowRunId: params.flowRunId,
                projectId: params.projectId,
                waitpointId: waitpoint.id,
                resumeDateTime: params.resumeDateTime,
                log,
            })
        }
        return { inserted, waitpoint }
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

    async findCompletedWaitpointIfRunIsIdle({ flowRunId }: FindCompletedWaitpointIfRunIsIdleParams): Promise<Waitpoint | null> {
        const latest = await waitpointRepo().findOne({
            where: { flowRunId },
            order: { created: 'DESC' },
        })
        if (isNil(latest) || latest.status !== WaitpointStatus.COMPLETED) {
            return null
        }
        return latest
    },

    async hasPendingBarrier({ flowRunId, projectId }: HasPendingBarrierParams): Promise<boolean> {
        return waitpointRepo().existsBy({ flowRunId, projectId, type: PauseType.BARRIER, status: WaitpointStatus.PENDING })
    },

    async findSubflowWaitpoint({ flowRunId, projectId }: FindSubflowWaitpointParams): Promise<Waitpoint | null> {
        const pending = await waitpointRepo().findOne({
            where: { flowRunId, projectId, status: WaitpointStatus.PENDING, type: Not(PauseType.BARRIER) },
            order: { created: 'DESC' },
        })
        if (!isNil(pending)) {
            return pending
        }
        return waitpointRepo().findOne({
            where: { flowRunId, projectId, type: Not(PauseType.BARRIER) },
            order: { created: 'DESC' },
        })
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

type HasPendingBarrierParams = {
    flowRunId: string
    projectId: string
}

type FindCompletedWaitpointIfRunIsIdleParams = {
    flowRunId: string
}

type FindSubflowWaitpointParams = {
    flowRunId: string
    projectId: string
}

type DeleteWaitpointParams = {
    id: string
    projectId: string
}
