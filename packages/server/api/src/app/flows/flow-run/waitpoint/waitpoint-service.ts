import { apId, FlowRunStatus, isNil, PauseType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { WaitpointEntity } from './waitpoint-entity'
import { CompleteParams, CompleteResult, CreateForPauseParams, CreateForPauseResult, FindPendingByVersionParams, HandleResumeSignalParams, Waitpoint, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)

export const waitpointService = (log: FastifyBaseLogger) => ({
    async createForPause(params: CreateForPauseParams): Promise<CreateForPauseResult> {
        const preCompleted = await waitpointRepo().findOneBy({
            flowRunId: params.flowRunId,
            status: WaitpointStatus.COMPLETED,
        })
        if (!isNil(preCompleted)) {
            log.info({ flowRunId: params.flowRunId, existingStatus: preCompleted.status }, '[waitpointService#createForPause] Waitpoint already pre-completed')
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
            })
            .orIgnore()
            .execute()

        const waitpoint = await waitpointRepo().findOneByOrFail({ flowRunId: params.flowRunId, stepName: params.stepName })
        const inserted = waitpoint.id === id
        if (inserted) {
            log.info({ flowRunId: params.flowRunId, waitpointId: id }, '[waitpointService#createForPause] Waitpoint created')
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
        }
        else {
            log.info({ flowRunId: params.flowRunId, existingStatus: waitpoint.status }, '[waitpointService#createForPause] Waitpoint already exists')
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

            if (!isNil(pending)) {
                const updated: Waitpoint = {
                    ...pending,
                    status: WaitpointStatus.COMPLETED,
                    resumePayload: params.resumePayload,
                    workerHandlerId: params.workerHandlerId ?? pending.workerHandlerId,
                }
                await repo.save(updated)
                log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Completed existing PENDING waitpoint')
                return { completedExisting: true, waitpoint: updated }
            }

            const existing = await repo.findOneBy({ flowRunId: params.flowRunId })
            if (!isNil(existing) && existing.status === WaitpointStatus.COMPLETED) {
                log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Waitpoint already completed, skipping pre-complete')
                return { completedExisting: false, waitpoint: existing }
            }

            await repo
                .createQueryBuilder()
                .insert()
                .into('waitpoint')
                .values({
                    id: apId(),
                    flowRunId: params.flowRunId,
                    projectId: params.projectId,
                    stepName: '',
                    type: PauseType.WEBHOOK,
                    status: WaitpointStatus.COMPLETED,
                    resumeDateTime: null,
                    responseToSend: null,
                    workerHandlerId: params.workerHandlerId ?? null,
                    httpRequestId: null,
                    resumePayload: params.resumePayload,
                })
                .orIgnore()
                .execute()

            const preCompleted = await repo.findOneByOrFail({ flowRunId: params.flowRunId, stepName: '' })
            log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Pre-completed waitpoint (resume arrived before pause)')
            return { completedExisting: false, waitpoint: preCompleted }
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
                log.info({ flowRunId, waitpointId }, '[waitpointService#handleResumeSignal] Stale waitpointId, ignoring')
                return false
            }
            log.info({ flowRunId, waitpointId }, '[waitpointService#handleResumeSignal] Resume triggered')
            return true
        }

        if (flowRunStatus === FlowRunStatus.RUNNING || flowRunStatus === FlowRunStatus.QUEUED) {
            await this.complete({ flowRunId, projectId, waitpointId, resumePayload, workerHandlerId })
            log.info({ flowRunId }, '[waitpointService#handleResumeSignal] Resume signal buffered (pre-completed)')
            return true
        }

        log.info({ flowRunId, flowRunStatus }, '[waitpointService#handleResumeSignal] Flow run not in resumable state, ignoring')
        return false
    },

    async findPendingByVersion({ flowRunId, version }: FindPendingByVersionParams): Promise<Waitpoint | null> {
        return waitpointRepo().findOne({
            where: { flowRunId, status: WaitpointStatus.PENDING, version },
        })
    },

    async getByFlowRunId(flowRunId: string): Promise<Waitpoint | null> {
        const completed = await waitpointRepo().findOneBy({ flowRunId, status: WaitpointStatus.COMPLETED })
        return completed ?? waitpointRepo().findOneBy({ flowRunId })
    },

    async deleteByFlowRunId(flowRunId: string): Promise<void> {
        await waitpointRepo().delete({ flowRunId })
        log.info({ flowRunId }, '[waitpointService#deleteByFlowRunId] Waitpoint deleted')
    },
})
