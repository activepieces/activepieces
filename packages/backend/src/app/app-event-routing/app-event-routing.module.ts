import { FastifyInstance, FastifyRequest } from 'fastify'
import { webhookService } from '../webhooks/webhook-service'
import { appEventRoutingService } from './app-event-routing.service'
import { logger } from '../helper/logger'
import { isNil } from 'lodash'
import { ActivepiecesError, ErrorCode, EventPayload } from '@activepieces/shared'
import { flowService } from '../flows/flow/flow.service'
import { AppEventRouting } from './app-event-routing.entity'
import { slack } from '@activepieces/piece-slack'
import { square } from '@activepieces/piece-square'
import { Piece } from '@activepieces/pieces-framework'

const appWebhooks: Record<string, Piece> = {
    slack: slack,
    square: square,
}

export const appEventRoutingModule = async (app: FastifyInstance) => {
    app.register(appEventRoutingController, { prefix: '/v1/app-events' })
}

export const appEventRoutingController = async (fastify: FastifyInstance) => {

    fastify.post(
        '/:pieceName',
        {
            config: {
                rawBody: true,
            },
        },
        async (
            request: FastifyRequest<{
                Body: unknown
                Params: {
                    pieceName: string
                }
            }>,
            requestReply,
        ) => {
            const pieceName = request.params.pieceName
            const eventPayload = {
                headers: request.headers as Record<string, string>,
                body: request.body,
                rawBody: request.rawBody,
                method: request.method,
                queryParams: request.query as Record<string, string>,
            }
            const piece = appWebhooks[pieceName]

            if (isNil(piece)) {
                throw new ActivepiecesError({
                    code: ErrorCode.PIECE_NOT_FOUND,
                    params: {
                        pieceName,
                        pieceVersion: 'latest',
                    },
                })
            }

            const { reply, event, identifierValue } = piece.events!.parseAndReply({ payload: eventPayload })

            logger.info(`Received event ${event} with identifier ${identifierValue} in app ${pieceName}`)
            if (event && identifierValue) {
                const listeners = await appEventRoutingService.listListeners({
                    appName: pieceName,
                    event: event,
                    identifierValue: identifierValue,
                })
                logger.info(`Found ${listeners.length} listeners for event ${event} with identifier ${identifierValue} in app ${pieceName}`)
                listeners.map(listener => {
                    callback(listener, eventPayload)
                })
            }
            requestReply.status(200).headers(reply?.headers ?? {}).send(reply?.body ?? {})
        },
    )

}

async function callback(listener: AppEventRouting, eventPayload: EventPayload) {
    const flow = await flowService.getOneOrThrow({ projectId: listener.projectId, id: listener.flowId })
    webhookService.callback({
        flow: flow,
        payload: eventPayload,
    })
}
