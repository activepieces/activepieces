import { PrincipalType, TestTriggerRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { testTriggerService } from './test-trigger-service'

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
}

const TestTriggerRequest = {
    schema: {
        body: TestTriggerRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
