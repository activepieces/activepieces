import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StepEntity } from './step-entity'
import { repoFactory } from '../../../core/db/repo-factory'
import { Step } from './step'
import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'

export const stepModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(stepController, { prefix: '/v1/steps' })
}


export const stepController: FastifyPluginAsyncTypebox = async (fastify) => {
    const stepRepo = repoFactory(StepEntity)

    fastify.post('/', {
        schema: {
        },
        config: {
            allowedPrincipals: ALL_PRINCIPAL_TYPES,
        },
    }, async (req, res) => {
        const step = req.body
        console.log(step)
        const createdStep = await stepRepo().save(step as Step)
        return createdStep
    })
}