import { apId, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { WaitpointEntity } from './waitpoint-entity'
import { ActivepiecesError, ErrorCode, FlowRunStatus } from '@activepieces/shared'
import { CompleteParams, CompleteResult, CreateForPauseParams, CreateForPauseResult, HandleResumeSignalParams, Waitpoint, WaitpointStatus, WaitpointType } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)

export const waitpointService = (log: FastifyBaseLogger) => ({
    async createForPause(params: CreateForPauseParams): Promise<CreateForPauseResult> {
        const id = apId()
        const { error } = await tryCatch(() =>
            waitpointRepo().save({
                id,
                flowRunId: params.flowRunId,
                projectId: params.projectId,
                type: params.type,
                status: WaitpointStatus.PENDING,
                resumeDateTime: params.resumeDateTime ?? null,
                timeoutSeconds: params.timeoutSeconds ?? null,
                responseToSend: params.responseToSend ?? null,
                workerHandlerId: params.workerHandlerId ?? null,
                httpRequestId: params.httpRequestId ?? null,
                resumePayload: null,
            }),
        )

        if (isNil(error)) {
            const inserted = await waitpointRepo().findOneByOrFail({ id })
            log.info({ flowRunId: params.flowRunId, waitpointId: id }, '[waitpointService#createForPause] Waitpoint created')
            return { inserted: true, waitpoint: inserted }
        }

        const existing = await waitpointRepo().findOneByOrFail({ flowRunId: params.flowRunId })
        log.info({
            flowRunId: params.flowRunId,
            existingStatus: existing.status,
        }, '[waitpointService#createForPause] Waitpoint already exists')
        return { inserted: false, waitpoint: existing }
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
                await repo.save({
                    ...pending,
                    status: WaitpointStatus.COMPLETED,
                    resumePayload: params.resumePayload,
                })
                const updated = await repo.findOneByOrFail({ id: pending.id })
                log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Completed existing PENDING waitpoint')
                return { completedExisting: true, waitpoint: updated }
            }

            const existing = await repo.findOneBy({ flowRunId: params.flowRunId })
            if (!isNil(existing)) {
                log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Waitpoint already completed, skipping')
                return { completedExisting: false, waitpoint: existing }
            }

            const id = apId()
            const { error } = await tryCatch(() =>
                repo.save({
                    id,
                    flowRunId: params.flowRunId,
                    projectId: params.projectId,
                    type: WaitpointType.WEBHOOK,
                    status: WaitpointStatus.COMPLETED,
                    resumeDateTime: null,
                    timeoutSeconds: null,
                    responseToSend: null,
                    workerHandlerId: null,
                    httpRequestId: null,
                    resumePayload: params.resumePayload,
                }),
            )

            if (!isNil(error)) {
                const concurrent = await repo.findOneByOrFail({ flowRunId: params.flowRunId })
                log.info({ flowRunId: params.flowRunId }, '[waitpointService#complete] Concurrent insert, returning existing')
                return { completedExisting: false, waitpoint: concurrent }
            }

            const preCompleted = await repo.findOneByOrFail({ flowRunId: params.flowRunId })
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
