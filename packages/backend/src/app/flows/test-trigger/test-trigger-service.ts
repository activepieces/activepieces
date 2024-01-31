import { TriggerTestStrategy } from '@activepieces/pieces-framework'
import { triggerEventService } from '../trigger-events/trigger-event.service'
import { FlowId, FlowVersionId, ProjectId, SeekPage, WebhookSimulation } from '@activepieces/shared'
import { flowService } from '../flow/flow.service'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'

export const testTriggerService = {
    async test(params: TestParams): Promise<unknown> {
        const { testStrategy } = params

        const testExecutors: Record<TriggerTestStrategy, (p: ExecuteTestParams) => Promise<unknown>> = {
            [TriggerTestStrategy.SIMULATION]: executeSimulation,
            [TriggerTestStrategy.TEST_FUNCTION]: executeTestFunction,
        }

        const executor = testExecutors[testStrategy]
        return executor(params)
    },
}

const executeSimulation = async ({ flowId, flowVersionId, projectId }: ExecuteTestParams): Promise<WebhookSimulation> => {
    return webhookSimulationService.create({
        flowId,
        flowVersionId,
        projectId,
    })
}

const executeTestFunction = async ({ flowId, flowVersionId, projectId }: ExecuteTestParams): Promise<SeekPage<unknown>> => {
    const flow = await flowService.getOnePopulatedOrThrow({
        id: flowId,
        projectId,
        versionId: flowVersionId,
    })

    return triggerEventService.test({
        flow,
        projectId,
    })
}

type TestParams = {
    flowId: FlowId
    flowVersionId: FlowVersionId
    projectId: ProjectId
    testStrategy: TriggerTestStrategy
}

type ExecuteTestParams = Omit<TestParams, 'testStrategy'>
