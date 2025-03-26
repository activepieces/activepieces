import {
    GlobalOAuthApp,
    ListOAuth2AppRequest,
    SeekPage,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { globalOAuthAppService } from './global-oauth-app.service'

export const globalOAuthAppModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(readGlobalOauthAppModule)
}

const readGlobalOauthAppModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(readGlobalOauthAppController, { prefix: '/v1/global-oauth-apps' })
}

const readGlobalOauthAppController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            schema: {
                querystring: ListOAuth2AppRequest,
                response: {
                    [StatusCodes.OK]: SeekPage(GlobalOAuthApp),
                },
            },
        },
        async (request) => {
            return globalOAuthAppService.list({ request: request.query })
        },
    )
}
