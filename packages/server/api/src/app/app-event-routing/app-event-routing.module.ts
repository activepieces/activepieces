import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { flowQueue } from '../flow-worker/queue'
import { appEventRoutingService } from './app-event-routing.service'
import { facebookLeads } from '@activepieces/piece-facebook-leads'
import { intercom } from '@activepieces/piece-intercom'
import { slack } from '@activepieces/piece-slack'
import { square } from '@activepieces/piece-square'
import { Piece } from '@activepieces/pieces-framework'
import { JobType, LATEST_JOB_DATA_SCHEMA_VERSION, logger, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError, ALL_PRINCIPAL_TYPES,
    apId,
    ErrorCode,
    isNil,
} from '@activepieces/shared'

const appWebhooks: Record<string, Piece> = {
    slack,
    square,
    'facebook-leads': facebookLeads,
    intercom,
}

const pieceNames: Record<string, string> = {
    slack: '@activepieces/piece-slack',
    square: '@activepieces/piece-square',
    'facebook-leads': '@activepieces/piece-facebook-leads',
    intercom: '@activepieces/piece-intercom',
}

export const appEventRoutingModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(appEventRoutingController, { prefix: '/v1/app-events' })
}

export const appEventRoutingController: FastifyPluginAsyncTypebox = async (
    fastify,
) => {
    fastify.all(
        '/:pieceUrl',
        {
            config: {
                rawBody: true,
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            logLevel: 'silent',
        },
        async (
            request: FastifyRequest<{
                Body: unknown
                Params: {
                    pieceUrl: string
                }
            }>,
            requestReply,
        ) => {
            const pieceUrl = request.params.pieceUrl
            const eventPayload = {
                headers: request.headers as Record<string, string>,
                body: request.body,
                rawBody: request.rawBody,
                method: request.method,
                queryParams: request.query as Record<string, string>,
            }
            const piece = appWebhooks[pieceUrl]
            if (isNil(piece)) {
                throw new ActivepiecesError({
                    code: ErrorCode.PIECE_NOT_FOUND,
                    params: {
                        pieceName: pieceUrl,
                        pieceVersion: 'latest',
                        message: 'Pieces is not found in app event routing',
                    },
                })
            }
            const pieceName = pieceNames[pieceUrl]
            const { reply, event, identifierValue } = piece.events!.parseAndReply({
                payload: eventPayload,
            })

            logger.debug(
                `Received event ${event} with identifier ${identifierValue} in app ${pieceName}`,
            )
            if (event && identifierValue) {
                const listeners = await appEventRoutingService.listListeners({
                    appName: pieceName,
                    event,
                    identifierValue,
                })
                rejectedPromiseHandler(Promise.all(listeners.map(async (listener) => {
                    const requestId = apId()
                    await flowQueue.add({
                        id: requestId,
                        type: JobType.WEBHOOK,
                        data: {
                            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                            requestId,
                            synchronousHandlerId: null,
                            payload: eventPayload,
                            flowId: listener.flowId,
                            simulate: false,
                        },
                        priority: 'medium',
                    })
                })))
            }
            return requestReply
                .status(200)
                .headers(reply?.headers ?? {})
                .send(reply?.body ?? {})
        },
    )
}
