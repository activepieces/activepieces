import {
    FlowId,
    FlowVersionId,
    isNil,
    ProjectId,
    TriggerTestStrategy,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { triggerEventService } from '../../flows/trigger-events/trigger-event.service'
import { triggerService } from '../trigger-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { distributedLock } from '../../helper/lock'
import { ApLock } from '@activepieces/server-shared'


export const testTriggerService = (log: FastifyBaseLogger) => {
    return {
        async test(params: TestParams): Promise<unknown> {
            const { testStrategy, ...executeParams } = params
            const lock = await createLock({ flowId: executeParams.flowId, log })
            try {
                const populatedFlow = await flowService(log).getOnePopulatedOrThrow({
                    id: executeParams.flowId,
                    projectId: executeParams.projectId,
                    versionId: executeParams.flowVersionId,
                })

                switch (testStrategy) {
                    case TriggerTestStrategy.SIMULATION: {
                        const exists = await triggerService(log).existsByFlowId({
                            flowId: executeParams.flowId,
                            simulate: true,
                        })
                        if (exists) {
                            return triggerService(log).disable({
                                flowId: executeParams.flowId,
                                projectId: executeParams.projectId,
                                simulate: true,
                                ignoreError: true,
                            })
                        }
                        return triggerService(log).enable({
                            flowVersion: populatedFlow.version,
                            projectId: executeParams.projectId,
                            simulate: true,
                        })
                    }
                    case TriggerTestStrategy.TEST_FUNCTION: {
                        return triggerEventService(log).test({
                            flow: populatedFlow,
                            projectId: executeParams.projectId,
                        })
                    }
                }
            } finally {
                await lock.release()
            }
        },
        async cancel(params: CancelParams): Promise<void> {
            const { flowId, projectId } = params
            const lock = await createLock({ flowId, log })
            try {
                const trigger = await triggerService(log).get({
                    id: flowId,
                    projectId,
                    simulate: true,
                })
                if (isNil(trigger)) {
                    return
                }
                return triggerService(log).disable({
                    flowId,
                    simulate: true,
                    projectId,
                    ignoreError: false,
                })
            } finally {
                await lock.release()
            }
        },
    }
}

async function createLock({ flowId, log }: AcquireLockParams): Promise<ApLock> {
    const key = `${flowId}-test-trigger`
    return distributedLock.acquireLock({ key, timeout: 120000, log })
}

type AcquireLockParams = {
    flowId: FlowId
    log: FastifyBaseLogger
}

type TestParams = {
    flowId: FlowId
    flowVersionId: FlowVersionId
    projectId: ProjectId
    testStrategy: TriggerTestStrategy
}

type CancelParams = {
    flowId: FlowId
    projectId: ProjectId
}