import { CancelTestTriggerRequestBody, PrincipalType, TestTriggerRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { testTriggerService } from '../../trigger/test-trigger/test-trigger-service'

export const testTriggerController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', TestTriggerRequest, async (req) => {
        const { projectId } = req.principal
        const { flowId, flowVersionId, testStrategy } = req.body

        return testTriggerService(req.log).test({
            flowId,
            flowVersionId,
            projectId,
            testStrategy,
        })
    })
    app.delete('/', CancelTestTriggerRequest, async (req) => {
        const { projectId } = req.principal
        const { flowId } = req.body

        return testTriggerService(req.log).cancel({
            flowId,
            projectId,
        })
    })
}

const TestTriggerRequest = {
    schema: {
        body: TestTriggerRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const CancelTestTriggerRequest = {
    schema: {
        body: CancelTestTriggerRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}