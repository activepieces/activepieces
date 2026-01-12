import {
    AppCredential,
    AppCredentialType,
    ListAppCredentialsRequest,
    UpsertAppCredentialRequest,
} from '@activepieces/ee-shared'
import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { AppCredentialEntity } from './app-credentials.entity'
import { appCredentialService } from './app-credentials.service'

export const appCredentialModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(appCredentialController, {
        prefix: '/v1/app-credentials',
    })
}

const DEFAULT_LIMIT_SIZE = 10

const appCredentialController: FastifyPluginAsyncTypebox = async (fastify) => {
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
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
