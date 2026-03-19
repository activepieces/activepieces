import {
    AppConnectionScope,
    ConnectionKeyId,
    GetOrDeleteConnectionFromTokenRequest,
    ListConnectionKeysRequest,
    PrincipalType,
    UpsertConnectionFromToken, UpsertSigningKeyConnection } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { projectService } from '../../project/project-service'
import { connectionKeyService } from './connection-key.service'

export const connectionKeyModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(connectionKeyController, {
        prefix: '/v1/connection-keys',
    })
}

const DEFAULT_LIMIT_SIZE = 10

const connectionKeyController: FastifyPluginAsyncZod = async (fastify) => {
    fastify.delete(
        '/app-connections',
        {
            config: {
                security: securityAccess.public(),
            },
            schema: {
                querystring: GetOrDeleteConnectionFromTokenRequest,
            },
        },
        async (request) => {
            const appConnection = await connectionKeyService(request.log).getConnection(
                request.query,
            )
            const platformId = await projectService(request.log).getPlatformId(request.query.projectId)
            if (appConnection !== null) {
                await appConnectionService(request.log).delete({
                    scope: AppConnectionScope.PROJECT,
                    platformId,
                    projectId: request.query.projectId,
                    id: appConnection.id,
                })
            }
        },
    )

    fastify.get(
        '/app-connections',
        {
            config: {
                security: securityAccess.public(),
            },
            schema: {
                querystring: GetOrDeleteConnectionFromTokenRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: GetOrDeleteConnectionFromTokenRequest
            }>,
        ) => {
            return connectionKeyService(request.log).getConnection(request.query)
        },
    )

    fastify.post(
        '/app-connections',
        {
            config: {
                security: securityAccess.public(),
            },
            schema: {
                body: UpsertConnectionFromToken,
            },
        },
        async (request) => {
            return connectionKeyService(request.log).createConnection(request.body)
        },
    )

    fastify.get(
        '/',
        {
            schema: {
                querystring: ListConnectionKeysRequest,
            },
            config: {
                security: securityAccess.project(
                    [PrincipalType.USER, PrincipalType.SERVICE],
                    undefined,
                    {
                        type: ProjectResourceType.QUERY,
                    },
                ),
            },
        },
        async (
            request,
        ) => {
            return connectionKeyService(request.log).list(
                request.projectId,
                request.query.cursor ?? null,
                request.query.limit ?? DEFAULT_LIMIT_SIZE,
            )
        },
    )

    fastify.post(
        '/',
        {
            schema: {
                body: UpsertSigningKeyConnection,
            },
            config: {
                security: securityAccess.project(
                    [PrincipalType.USER, PrincipalType.SERVICE],
                    undefined,
                    {
                        type: ProjectResourceType.BODY,
                    },
                ),
            },
        },
        async (
            request,
        ) => {
            return connectionKeyService(request.log).upsert({
                projectId: request.projectId,
                request: request.body,
            })
        },
    )

    fastify.delete(
        '/:connectionkeyId',
        async (
            request: FastifyRequest<{
                Params: {
                    connectionkeyId: ConnectionKeyId
                }
            }>,
            reply,
        ) => {
            await connectionKeyService(request.log).delete(request.params.connectionkeyId)
            return reply.status(StatusCodes.OK).send()
        },
    )
}
