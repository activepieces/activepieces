import { facebookLeads } from '@activepieces/piece-facebook-leads'
import { intercom } from '@activepieces/piece-intercom'
import { slack } from '@activepieces/piece-slack'
import { square } from '@activepieces/piece-square'
import { Piece } from '@activepieces/pieces-framework'
import { JobType, LATEST_JOB_DATA_SCHEMA_VERSION, logger, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError, ALL_PRINCIPAL_TYPES,
    apId,
    assertNotNullOrUndefined,
    ErrorCode,
    isNil,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { flowQueue } from '../workers/queue'
import { DEFAULT_PRIORITY } from '../workers/queue/queue-manager'
import { appEventRoutingService } from './app-event-routing.service'

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
    fastify.all('/:pieceUrl', EventRoutingParam, async (request, requestReply) => {
        const pieceUrl = request.params.pieceUrl
        const payload = {
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
        assertNotNullOrUndefined(piece.events, 'Event is not defined')
        const { reply, event, identifierValue } = piece.events.parseAndReply({ payload })
        logger.info({
            event,
            identifierValue,
        }, '[AppEventRoutingController#event] event')
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
                        projectId: listener.projectId,
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        requestId,
                        synchronousHandlerId: null,
                        payload,
                        flowId: listener.flowId,
                        simulate: false,
                    },
                    priority: DEFAULT_PRIORITY,
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

const EventRoutingParam = {
    config: {
        rawBody: true,
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            pieceUrl: Type.String(),
        }),
        body: Type.Unknown(),
    },
}