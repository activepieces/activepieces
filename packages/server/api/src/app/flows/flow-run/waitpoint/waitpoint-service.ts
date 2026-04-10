import { ActivepiecesError, apId, ErrorCode, FlowRunStatus, isNil, PauseType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { WaitpointEntity } from './waitpoint-entity'
import { CompleteParams, CompleteResult, CreateForPauseParams, CreateForPauseResult, HandleResumeSignalParams, Waitpoint, WaitpointStatus } from './waitpoint-types'

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
                status: WaitpointStatus.PENDING,
                resumeDateTime: params.resumeDateTime ?? null,
                timeoutSeconds: params.timeoutSeconds ?? null,
                responseToSend: params.responseToSend ? () => `'${JSON.stringify(params.responseToSend)}'::jsonb` : null,
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
                        data: { flowRunId: params.flowRunId, projectId: params.projectId },
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
                .where({
                    flowRunId: params.flowRunId,
                    status: WaitpointStatus.PENDING,
                })
                .getOne()

            if (!isNil(pending)) {
                const updated: Waitpoint = {
                    ...pending,
                    status: WaitpointStatus.COMPLETED,
                    resumePayload: params.resumePayload,
                }
                await repo.save(updated)
                log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Completed existing PENDING waitpoint')
                return { completedExisting: true, waitpoint: updated }
            }

            const existing = await repo.findOneBy({ flowRunId: params.flowRunId })
            if (!isNil(existing)) {
                log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Waitpoint already completed, skipping')
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
                    timeoutSeconds: null,
                    responseToSend: null,
                    workerHandlerId: null,
                    httpRequestId: null,
                    resumePayload: () => `'${JSON.stringify(params.resumePayload)}'::jsonb`,
                })
                .orIgnore()
                .execute()

            const preCompleted = await repo.findOneByOrFail({ flowRunId: params.flowRunId, stepName: '' })
            log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Pre-completed waitpoint (resume arrived before pause)')
            return { completedExisting: false, waitpoint: preCompleted }
        })
    },

    async handleResumeSignal(params: HandleResumeSignalParams): Promise<void> {
        const { flowRunId, flowRunStatus, projectId, resumeData, onReady } = params

        if (flowRunStatus === FlowRunStatus.PAUSED) {
            await transaction(async (entityManager) => {
                const repo = waitpointRepo(entityManager)
                const waitpoint = await repo
                    .createQueryBuilder('waitpoint')
                    .setLock('pessimistic_write')
                    .where({ flowRunId })
                    .getOne()
                if (isNil(waitpoint)) {
                    throw new ActivepiecesError({
                        code: ErrorCode.PAUSE_METADATA_MISSING,
                        params: {},
                    })
                }
                await onReady(waitpoint, resumeData)
                await repo.delete({ flowRunId })
            })
            log.info({ flowRunId }, '[waitpointService#handleResumeSignal] Resume triggered')
            return
        }

        if (flowRunStatus === FlowRunStatus.RUNNING || flowRunStatus === FlowRunStatus.QUEUED) {
            await this.complete({ flowRunId, projectId, resumePayload: resumeData })
            log.info({ flowRunId }, '[waitpointService#handleResumeSignal] Resume signal buffered (pre-completed)')
            return
        }

        log.info({ flowRunId, flowRunStatus }, '[waitpointService#handleResumeSignal] Flow run not in resumable state, ignoring')
    },

    async getByFlowRunId(flowRunId: string): Promise<Waitpoint | null> {
        return waitpointRepo().findOneBy({ flowRunId })
    },

    async deleteByFlowRunId(flowRunId: string): Promise<void> {
        await waitpointRepo().delete({ flowRunId })
        log.info({ flowRunId }, '[waitpointService#deleteByFlowRunId] Waitpoint deleted')
    },
})
