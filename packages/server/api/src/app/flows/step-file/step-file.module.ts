import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { Type } from '@sinclair/typebox'
import { stepFileService } from './step-file.service'
import {
    ALL_PRINCIPAL_TYPES,
    PrincipalType,
    StepFileUpsert,
} from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'

export const stepFileModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(stepFileController, { prefix: '/v1/step-files' })
}

export const stepFileController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/signed',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                querystring: Type.Object({
                    token: Type.String(),
                }),
            },
        },
        async (request, reply) => {
            const stepFile = await stepFileService.getByToken(request.query.token)
            await reply
                .header(
                    'Content-Disposition',
                    `attachment; filename="${stepFile?.name}"`,
                )
                .type('application/octet-stream')
                .status(StatusCodes.OK)
                .send(stepFile?.data)
        },
    )

    app.get(
        '/:id',
        {
            config: {
                allowedPrincipals: [PrincipalType.WORKER],
            },
            schema: {
                params: Type.Object({
                    id: Type.String(),
                }),
            },
        },
        async (request, reply) => {
            const stepFile = await stepFileService.get({
                projectId: request.principal.projectId,
                id: request.params.id,
            })
            return reply
                .header(
                    'Content-Disposition',
                    `attachment; filename="${stepFile?.name}"`,
                )
                .type('application/octet-stream')
                .status(StatusCodes.OK)
                .send(stepFile?.data)
        },
    )

    app.post(
        '/',
        {
            config: {
                allowedPrincipals: [PrincipalType.WORKER],
            },
            schema: {
                body: StepFileUpsert,
            },
        },
        async (request) => {
            return stepFileService.upsert({
                hostname: request.hostname,
                projectId: request.principal.projectId,
                request: request.body,
            })
        },
    )

    app.delete(
        '/:id',
        {
            config: {
                allowedPrincipals: [PrincipalType.WORKER],
            },
            schema: {
                params: Type.Object({
                    id: Type.String(),
                }),
            },
        },
        async (request) => {
            return stepFileService.delete({
                projectId: request.principal.projectId,
                id: request.params.id,
            })
        },
    )
}
