import {
    FlowId,
    FlowVersionId,
    isNil,
    ProjectId,
    TriggerTestStrategy,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock } from '../../database/redis-connections'
import { flowService } from '../../flows/flow/flow.service'
import { triggerEventService } from '../trigger-events/trigger-event.service'
import { triggerSourceService } from '../trigger-source/trigger-source-service'

const lockKey: (flowId: FlowId) => string = (flowId) => `${flowId}-test-trigger`

export const testTriggerService = (log: FastifyBaseLogger) => {
    return {
        async test(params: TestParams): Promise<unknown> {
            const { testStrategy, ...executeParams } = params
            log.info('[testTriggerService#test] Starting test trigger')
            return distributedLock(log).runExclusive({
                key: lockKey(executeParams.flowId),
                timeoutInSeconds: 120,
                fn: async () => {
                    log.info('[testTriggerService#test] Acquired lock')
                    const populatedFlow = await flowService(log).getOnePopulatedOrThrow({
                        id: executeParams.flowId,
                        projectId: executeParams.projectId,
                        versionId: executeParams.flowVersionId,
                    })

                    switch (testStrategy) {
                        case TriggerTestStrategy.SIMULATION: {
                            const exists = await triggerSourceService(log).existsByFlowId({
                                flowId: executeParams.flowId,
                                simulate: true,
                            })
                            log.info({
                                exists,
                            }, '[testTriggerService#test] Trigger source exists')
                            if (exists) {
                                await triggerSourceService(log).disable({
                                    flowId: executeParams.flowId,
                                    projectId: executeParams.projectId,
                                    simulate: true,
                                    ignoreError: true,
                                })
                                return
                            }
                            await triggerSourceService(log).enable({
                                flowVersion: populatedFlow.version,
                                projectId: executeParams.projectId,
                                simulate: true,
                            })
                            return
                        }
                        case TriggerTestStrategy.TEST_FUNCTION: {
                            return triggerEventService(log).test({
                                flow: populatedFlow,
                                projectId: executeParams.projectId,
                            })
                        }
                    }
                },
            })
        },
        async cancel(params: CancelParams): Promise<void> {
            const { flowId, projectId } = params
            return distributedLock(log).runExclusive({
                key: lockKey(flowId),
                timeoutInSeconds: 120,
                fn: async () => {
                    const trigger = await triggerSourceService(log).getByFlowId({
                        flowId,
                        projectId,
                        simulate: true,
                    })
                    if (isNil(trigger)) {
                        return
                    }
                    return triggerSourceService(log).disable({
                        flowId,
                        simulate: true,
                        projectId,
                        ignoreError: false,
                    })
                },
            })
        },
    }
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