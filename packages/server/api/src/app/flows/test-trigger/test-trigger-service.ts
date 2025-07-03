import {
    FlowId,
    FlowVersionId,
    ProjectId,
    SeekPage,
    TriggerTestStrategy,
    WebhookSimulation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { flowService } from '../flow/flow.service'
import { triggerEventService } from '../trigger-events/trigger-event.service'

export const testTriggerService = (log: FastifyBaseLogger) => {
    const executeSimulation = async ({
        flowId,
        flowVersionId,
        projectId,
    }: ExecuteTestParams): Promise<WebhookSimulation> => {
        log.debug({
            name: 'testTriggerService.executeSimulation',
            flowId,
            flowVersionId,
            projectId,
        })

        return webhookSimulationService(log).create({
            flowId,
            flowVersionId,
            projectId,
        })
    }

    const executeTestFunction = async ({
        flowId,
        flowVersionId,
        projectId,
    }: ExecuteTestParams): Promise<SeekPage<unknown>> => {
        log.debug({
            name: 'testTriggerService.executeTestFunction',
            flowId,
            flowVersionId,
            projectId,
        })

        const flow = await flowService(log).getOnePopulatedOrThrow({
            id: flowId,
            projectId,
            versionId: flowVersionId,
        })

        return triggerEventService(log).test({
            flow,
            projectId,
        })
    }

    return {
        async test(params: TestParams): Promise<unknown> {
            const { testStrategy, ...executeParams } = params

            const testExecutors: Record<
            TriggerTestStrategy,
            (p: ExecuteTestParams) => Promise<unknown>
            > = {
                [TriggerTestStrategy.SIMULATION]: executeSimulation,
                [TriggerTestStrategy.TEST_FUNCTION]: executeTestFunction,
            }

            const executor = testExecutors[testStrategy]
            return executor(executeParams)
        },
    }
}

type TestParams = {
    flowId: FlowId
    flowVersionId: FlowVersionId
    projectId: ProjectId
    testStrategy: TriggerTestStrategy
}

type ExecuteTestParams = Omit<TestParams, 'testStrategy'>
