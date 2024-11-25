import { logger } from '@activepieces/server-shared'
import {
    FlowId,
    FlowVersionId,
    ProjectId,
    SeekPage,
    TriggerTestStrategy,
    WebhookSimulation } from '@activepieces/shared'
import { projectService } from '../../project/project-service'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { flowService } from '../flow/flow.service'
import { triggerEventService } from '../trigger-events/trigger-event.service'

export const testTriggerService = {
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

const executeSimulation = async ({
    flowId,
    flowVersionId,
    projectId,
}: ExecuteTestParams): Promise<WebhookSimulation> => {
    logger.debug({
        name: 'testTriggerService.executeSimulation',
        flowId,
        flowVersionId,
        projectId,
    })

    return webhookSimulationService.create({
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
    logger.debug({
        name: 'testTriggerService.executeTestFunction',
        flowId,
        flowVersionId,
        projectId,
    })

    const flow = await flowService.getOnePopulatedOrThrow({
        id: flowId,
        projectId,
        versionId: flowVersionId,
    })

    const platformId = await projectService.getPlatformId(projectId)
    return triggerEventService.test({
        flow,
        projectId,
        platformId,
    })
}

type TestParams = {
    flowId: FlowId
    flowVersionId: FlowVersionId
    projectId: ProjectId
    testStrategy: TriggerTestStrategy
}

type ExecuteTestParams = Omit<TestParams, 'testStrategy'>
