import {
    AppCredential,
    AppCredentialType,
    ListAppCredentialsRequest,
    PrincipalType,
    SeekPage, UpsertAppCredentialRequest } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { AppCredentialEntity } from './app-credentials.entity'
import { appCredentialService } from './app-credentials.service'

export const appCredentialModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(appCredentialController, {
        prefix: '/v1/app-credentials',
    })
}

const DEFAULT_LIMIT_SIZE = 10

const appCredentialController: FastifyPluginAsyncZod = async (fastify) => {
    fastify.get(
        '/',
        ListCredsRequest,
        async (
            request: FastifyRequest<{
                Querystring: ListAppCredentialsRequest
            }>,
        ) => {
            const page = await appCredentialService.list(
                request.query.projectId,
                request.query.appName,
                request.query.cursor ?? null,
                request.query.limit ?? DEFAULT_LIMIT_SIZE,
            )
            return censorClientSecret(page)
        },
    )

    fastify.post(
        '/',
        UpsertAppCredentialRequestOptions,
        async (request) => {
            return appCredentialService.upsert({
                projectId: request.projectId,
                request: request.body,
            })
        },
    )

    fastify.delete(
        '/:id', DeleteAppCredentialRequestOptions, async (request, reply) => {
            await appCredentialService.delete({
                id: request.params.id,
                projectId: request.projectId,
            })

            return reply.status(StatusCodes.OK).send()
        },
    )
}

function censorClientSecret(
    page: SeekPage<AppCredential>,
): SeekPage<AppCredential> {
    page.data = page.data.map((f) => {
        if (f.settings.type === AppCredentialType.OAUTH2) {
            f.settings.clientSecret = undefined
        }
        return f
    })
    return page
}

const ListCredsRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: ListAppCredentialsRequest,
    },
}

const UpsertAppCredentialRequestOptions = {
    schema: {
        body: UpsertAppCredentialRequest,
    },
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            undefined,
            {
                type: ProjectResourceType.BODY,
            },
        ),
    },
}

const DeleteAppCredentialRequestOptions = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            undefined,
            {
                type: ProjectResourceType.TABLE,
                tableName: AppCredentialEntity,
            },
        ),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
}
