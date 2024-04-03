import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { appsumoService } from './appsumo.service'
import { system, SystemProp } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'

export const appSumoModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(appsumoController, { prefix: '/v1/appsumo' })
}

const exchangeCredentialUsername = system.get(SystemProp.APPSUMO_TOKEN)
const exchangeCredentialPassword = system.get(SystemProp.APPSUMO_TOKEN)
const token = system.get(SystemProp.APPSUMO_TOKEN)

const ActionRequest = Type.Object({
    action: Type.String(),
    plan_id: Type.String(),
    uuid: Type.String(),
    activation_email: Type.String(),
})

type ActionRequest = Static<typeof ActionRequest>

const ExchangeTokenRequest = Type.Object({
    username: Type.String(),
    password: Type.String(),
})
type ExchangeTokenRequest = Static<typeof ExchangeTokenRequest>

const AuthorizationHeaders = Type.Object({
    authorization: Type.String(),
})
type AuthorizationHeaders = Static<typeof AuthorizationHeaders>

const appsumoController: FastifyPluginAsyncTypebox = async (
    fastify: FastifyInstance,
) => {
    fastify.post(
        '/token',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                body: ExchangeTokenRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Body: ExchangeTokenRequest
            }>,
            reply,
        ) => {
            if (
                request.body.username === exchangeCredentialUsername &&
        request.body.password === exchangeCredentialPassword
            ) {
                return reply.status(StatusCodes.OK).send({
                    access: token,
                })
            }
            else {
                return reply.status(StatusCodes.UNAUTHORIZED).send()
            }
        },
    )

    fastify.post(
        '/action',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                headers: AuthorizationHeaders,
                body: ActionRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Headers: AuthorizationHeaders
                Body: ActionRequest
            }>,
            reply,
        ) => {
            if (request.headers.authorization != `Bearer ${token}`) {
                return reply.status(StatusCodes.UNAUTHORIZED).send()
            }
            else {
                const { plan_id, action, uuid, activation_email } = request.body
                await appsumoService.handleRequest({
                    plan_id,
                    action,
                    uuid,
                    activation_email,
                })
                switch (action) {
                    case 'activate':
                        return reply.status(StatusCodes.CREATED).send({
                            redirect_url:
                'https://cloud.activepieces.com/sign-up?email=' +
                encodeURIComponent(activation_email),
                            message: 'success',
                        })
                    default:
                        return reply.status(StatusCodes.OK).send({
                            message: 'success',
                        })
                }
            }
        },
    )
}
