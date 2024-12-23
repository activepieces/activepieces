import { ApLock } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    FlowId,
    FlowVersionId,
    isNil,
    ProjectId,
    WebhookSimulation,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { distributedLock } from '../../helper/lock'
import { WebhookSimulationEntity } from './webhook-simulation-entity'
import { webhookSideEffects } from './webhook-simulation-side-effects'

type BaseParams = {
    flowId: FlowId
    flowVersionId?: FlowVersionId
    projectId: ProjectId
}

type DeleteParams = BaseParams & {
    parentLock?: ApLock
}

type GetParams = BaseParams
type CreateParams = BaseParams

type AcquireLockParams = {
    flowId: FlowId
    log: FastifyBaseLogger
}

const createLock = async ({ flowId, log }: AcquireLockParams): Promise<ApLock> => {
    const key = `${flowId}-webhook-simulation`
    return distributedLock.acquireLock({ key, timeout: 5000, log })
}

const webhookSimulationRepo = repoFactory(WebhookSimulationEntity)

export const webhookSimulationService = (log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<WebhookSimulation> {
        log.debug(params, '[WebhookSimulationService#deleteByFlowId] params')

        const { flowId, flowVersionId, projectId } = params

        const lock = await createLock({
            flowId,
            log,
        })

        try {
            const webhookSimulationExists = await webhookSimulationRepo().exists({
                where: { flowId },
            })

            if (webhookSimulationExists) {
                await this.delete({
                    flowId,
                    flowVersionId,
                    projectId,
                    parentLock: lock,
                })
            }

            const webhookSimulation: Omit<WebhookSimulation, 'created' | 'updated'> =
        {
            id: apId(),
            ...params,
        }

            await webhookSideEffects(log).preCreate({
                flowId,
                projectId,
            })

            return await webhookSimulationRepo().save(webhookSimulation)
        }
        finally {
            await lock.release()
        }
    },
    async exists(flowId: FlowId): Promise<boolean> {
        const webhookSimulation = await webhookSimulationRepo().findOneBy({
            flowId,
        })
        return !isNil(webhookSimulation)
    },
    async get(params: GetParams): Promise<WebhookSimulation | null> {
        log.debug(params, '[WebhookSimulationService#getByFlowId] params')

        const { flowId, projectId } = params

        return webhookSimulationRepo().findOneBy({
            flowId,
            projectId,
        })
    },
    async getOrThrow(params: GetParams): Promise<WebhookSimulation> {
        const webhookSimulation = await this.get(params)
        const { flowId, projectId } = params

        if (isNil(webhookSimulation)) {
            log.debug('[WebhookSimulationService#getByFlowId] not found')
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `entityType=webhookSimulation flowId=${flowId} projectId=${projectId}`,
                },
            })
        }
        return webhookSimulation
    },
    
    async delete(params: DeleteParams): Promise<void> {
        log.debug(params, '[WebhookSimulationService#deleteByFlowId] params')

        const { flowId, flowVersionId, projectId, parentLock } = params

        let lock: ApLock | null = null

        if (isNil(parentLock)) {
            lock = await createLock({
                flowId,
                log,
            })
        }

        try {
            const webhookSimulation = await this.get({
                flowId,
                projectId,
            })
            if (isNil(webhookSimulation)) {
                return
            }
            await webhookSideEffects(log).preDelete({
                flowId,
                projectId,
                flowVersionId,
            })

            await webhookSimulationRepo().remove(webhookSimulation)
        }
        finally {
            if (lock) {
                await lock.release()
            }
        }
    },
})
