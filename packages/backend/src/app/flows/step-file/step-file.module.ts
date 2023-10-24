import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { allowWorkersOnly, entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { Type } from '@sinclair/typebox'
import { stepFileService } from './step-file.service'
import { StepFileUpsert } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'

export const stepFileModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('onRequest', allowWorkersOnly)
    await app.register(stepFileController, { prefix: '/v1/step-files' })
}

export const stepFileController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:id', {
        schema: {
            params: Type.Object({
                id: Type.String(),
            }),
        },
    }, async (request, reply) => {
        const stepFile = await stepFileService.get({
            projectId: request.principal.projectId,
            id: request.params.id,
        })
        return reply.header('Content-Disposition', `attachment; filename="${stepFile?.name}"`)
            .type('application/octet-stream')
            .status(StatusCodes.OK)
            .send(stepFile?.data)
    })

    app.post('/', {
        schema: {
            body: StepFileUpsert,
        },
    }, async (request) => {    
        return stepFileService.upsert({
            projectId: request.principal.projectId,
            request: request.body,
        })
    })


    app.delete('/:id', {
        schema: {
            params: Type.Object({
                id: Type.String(),
            }),
        },
    }, async (request) => {
        return stepFileService.delete({
            projectId: request.principal.projectId,
            id: request.params.id,
        })
    })
}
