import { databaseConnection } from '../../database/database-connection'
import { acquireLock, ApLock } from '../../helper/lock'
import { WebhookSimulationEntity } from './webhook-simulation-entity'
import { webhookSideEffects } from './webhook-simulation-side-effects'
import { logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    FlowId,
    FlowVersionId,
    isNil,
    ProjectId, WebhookSimulation } from '@activepieces/shared'

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
}

const createLock = async ({ flowId }: AcquireLockParams): Promise<ApLock> => {
    const key = `${flowId}-webhook-simulation`
    return acquireLock({ key, timeout: 5000 })
}

const webhookSimulationRepo = databaseConnection.getRepository(
    WebhookSimulationEntity,
)

export const webhookSimulationService = {
    async create(params: CreateParams): Promise<WebhookSimulation> {
        logger.debug(params, '[WebhookSimulationService#deleteByFlowId] params')

        const { flowId, flowVersionId, projectId } = params

        const lock = await createLock({
            flowId,
        })

        try {
            const webhookSimulationExists = await webhookSimulationRepo.exists({
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

            await webhookSideEffects.preCreate({
                flowId,
                projectId,
            })

            return await webhookSimulationRepo.save(webhookSimulation)
        }
        finally {
            await lock.release()
        }
    },

    async get(params: GetParams): Promise<WebhookSimulation> {
        logger.debug(params, '[WebhookSimulationService#getByFlowId] params')

        const { flowId, projectId } = params

        const webhookSimulation = await webhookSimulationRepo.findOneBy({
            flowId,
            projectId,
        })

        if (isNil(webhookSimulation)) {
            logger.debug('[WebhookSimulationService#getByFlowId] not found')
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
        logger.debug(params, '[WebhookSimulationService#deleteByFlowId] params')

        const { flowId, flowVersionId, projectId, parentLock } = params

        let lock: ApLock | null = null

        if (isNil(parentLock)) {
            lock = await createLock({
                flowId,
            })
        }

        try {
            const webhookSimulation = await this.get({
                flowId,
                projectId,
            })

            await webhookSideEffects.preDelete({
                flowId,
                projectId,
                flowVersionId,
            })

            await webhookSimulationRepo.remove(webhookSimulation)
        }
        finally {
            if (lock) {
                await lock.release()
            }
        }
    },
}
