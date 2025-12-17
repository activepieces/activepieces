import {
    AppCredential,
    AppCredentialType,
    ListAppCredentialsRequest,
    UpsertAppCredentialRequest,
} from '@activepieces/ee-shared'
import { publicAccess } from '@activepieces/server-shared'
import { PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { appCredentialService } from './app-credentials.service'

export const appCredentialModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(appCredentialController, {
        prefix: '/v1/app-credentials',
    })
}

const DEFAULT_LIMIT_SIZE = 10

const appCredentialController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        '/', ListCredsRequest, async (request) => {
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
        '/', UpsertAppCredentialRequestOptions, async (request) => {
            return appCredentialService.upsert({
                projectId: request.principal.projectId,
                request: request.body,
            })
        },
    )

    fastify.delete(
        '/:credentialId', DeleteAppCredentialRequestOptions, async (request, reply) => {
            await appCredentialService.delete({
                id: request.params.credentialId,
                projectId: request.principal.projectId,
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
        security: publicAccess(),
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
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}

const DeleteAppCredentialRequestOptions = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    schema: {
        params: Type.Object({
            credentialId: Type.String(),
        }),
    },
}