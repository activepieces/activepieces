import { FastifyInstance, FastifyRequest } from 'fastify'
import { webhookService } from '../webhooks/webhook-service'
import { appEventRoutingService } from './app-event-routing.service'
import { logger } from '../helper/logger'
import { getPiece } from '@activepieces/pieces-apps'

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
            const piece = getPiece(pieceName)
            const { reply, event, identifierValue } = piece.events.parseAndReply({ payload: eventPayload })

            logger.info(`Received event ${event} with identifier ${identifierValue} in app ${pieceName}`)
            if (event && identifierValue) {
                const listeners = await appEventRoutingService.listListeners({
                    appName: pieceName,
                    event: event,
                    identifierValue: identifierValue,
                })
                logger.info(`Found ${listeners.length} listeners for event ${event} with identifier ${identifierValue} in app ${pieceName}`)
                listeners.forEach(listener => {
                    webhookService.callback({
                        flowId: listener.flowId,
                        payload: eventPayload,
                    })
                })
            }
            requestReply.status(200).headers(reply?.headers ?? {}).send(reply?.body ?? {})
        },
    )

}
