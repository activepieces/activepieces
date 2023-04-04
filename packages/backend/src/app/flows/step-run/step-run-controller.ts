import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { TestStepRequest } from './step-run-dto'
import { stepRunService } from './step-run-service'

export const stepRunController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', TestStepRequest, async (req) => {
        return await stepRunService.test({
            ...req.body,
            projectId: req.principal.projectId,
        })
    })
}
