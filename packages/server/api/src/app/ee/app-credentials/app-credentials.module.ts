import {
    AppCredential,
    AppCredentialType,
    ListAppCredentialsRequest,
} from '@activepieces/ee-shared'
import { SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { appCredentialService } from './app-credentials.service'
import { publicAccess } from '@activepieces/server-shared'

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
                security: publicAccess(),
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
