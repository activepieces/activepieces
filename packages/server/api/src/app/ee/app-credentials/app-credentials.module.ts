import {
    AppCredential,
    AppCredentialType,
    ListAppCredentialsRequest,
    UpsertAppCredentialRequest,
} from '@activepieces/ee-shared'
import { ALL_PRINCIPAL_TYPES, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { appCredentialService } from './app-credentials.service'
import { RouteKind } from '@activepieces/server-shared'

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
                security: {
                    kind: RouteKind.PUBLIC,
                },
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
