import {
    AppCredential,
    AppCredentialId,
    AppCredentialType,
    ListAppCredentialsRequest,
    UpsertAppCredentialRequest,
} from '@activepieces/ee-shared'
import { ALL_PRINCIPAL_TYPES, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
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
        '/',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                querystring: ListAppCredentialsRequest,
            },
        },
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
        {
            schema: {
                body: UpsertAppCredentialRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Body: UpsertAppCredentialRequest
            }>,
        ) => {
            return appCredentialService.upsert({
                projectId: request.principal.projectId,
                request: request.body,
            })
        },
    )

    fastify.delete(
        '/:credentialId',
        async (
            request: FastifyRequest<{
                Params: {
                    credentialId: AppCredentialId
                }
            }>,
            reply,
        ) => {
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
