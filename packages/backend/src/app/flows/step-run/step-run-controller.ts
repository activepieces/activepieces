import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { CreateStepRunRequest } from './step-run-dto'
import { stepRunService } from './step-run-service'

export const stepRunController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', CreateStepRunRequest, async (req) => {
        const { flowVersionId, stepName } = req.body
        const { projectId } = req.principal

        const result = await stepRunService.create({
            projectId,
            flowVersionId,
            userId: req.principal.id, 
            stepName,
        })

        return result

    })

    done()
}
