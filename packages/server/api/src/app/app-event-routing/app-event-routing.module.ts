import { facebookLeads } from '@ensemble/piece-facebook-leads'
import { intercom } from '@ensemble/piece-intercom'
import { slack } from '@ensemble/piece-slack'
import { square } from '@ensemble/piece-square'
import { Piece } from '@ensemble/pieces-framework'
import {
    JobType,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    rejectedPromiseHandler,
} from '@ensemble/server-shared'
import {
    EnsembleError,
    ALL_PRINCIPAL_TYPES,
    apId,
    assertNotNullOrUndefined,
    ErrorCode,
    FlowStatus,
    isNil,
    RunEnvironment,
} from '@ensemble/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowService } from '../flows/flow/flow.service'
import { WebhookFlowVersionToRun, webhookHandler } from '../webhooks/webhook-handler'
import { webhookSimulationService } from '../webhooks/webhook-simulation/webhook-simulation-service'
import { jobQueue } from '../workers/queue'
import { DEFAULT_PRIORITY } from '../workers/queue/queue-manager'
import { appEventRoutingService } from './app-event-routing.service'

const appWebhooks: Record<string, Piece> = {
    slack,
    square,
    'facebook-leads': facebookLeads,
    intercom,
}
const pieceNames: Record<string, string> = {
    slack: '@ensemble/piece-slack',
    square: '@ensemble/piece-square',
    'facebook-leads': '@ensemble/piece-facebook-leads',
    intercom: '@ensemble/piece-intercom',
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
            const payload = {
                headers: request.headers as Record<string, string>,
                body: request.body,
                rawBody: request.rawBody,
                method: request.method,
                queryParams: request.query as Record<string, string>,
            }
            const piece = appWebhooks[pieceUrl]
            if (isNil(piece)) {
                throw new EnsembleError({
                    code: ErrorCode.PIECE_NOT_FOUND,
                    params: {
                        pieceName: pieceUrl,
                        pieceVersion: 'latest',
                        message: 'Pieces is not found in app event routing',
                    },
                })
            }
            const appName = pieceNames[pieceUrl]
            assertNotNullOrUndefined(piece.events, 'Event is possible in this piece')
            const { reply, event, identifierValue } = piece.events.parseAndReply({
                payload,
            })
            if (!isNil(reply)) {
                request.log.info(
                    {
                        reply,
                        piece: pieceUrl,
                    },
                    '[AppEventRoutingController#event] reply',
                )
                return requestReply
                    .status(StatusCodes.OK)
                    .headers(reply?.headers ?? {})
                    .send(reply?.body ?? {})
            }
            request.log.info(
                {
                    event,
                    identifierValue,
                },
                '[AppEventRoutingController#event] event',
            )
            if (isNil(event) || isNil(identifierValue)) {
                return requestReply.status(StatusCodes.BAD_REQUEST).send({})
            }
            const listeners = await appEventRoutingService.listListeners({
                appName,
                event,
                identifierValue,
            })
            const eventsQueue = listeners.map(async (listener) => {
                const requestId = apId()
                const flow = await flowService(request.log).getOneOrThrow({ id: listener.flowId, projectId: listener.projectId })
                const flowVersionIdToRun = await webhookHandler.getFlowVersionIdToRun(WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST, flow)

                return jobQueue(request.log).add({
                    id: requestId,
                    type: JobType.WEBHOOK,
                    data: {
                        projectId: listener.projectId,
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        requestId,
                        payload,
                        flowId: listener.flowId,
                        runEnvironment: RunEnvironment.PRODUCTION,
                        saveSampleData: await webhookSimulationService(request.log).exists(listener.flowId),
                        flowVersionIdToRun,
                        execute: flow.status === FlowStatus.ENABLED,
                    },
                    priority: DEFAULT_PRIORITY,
                })
            })
            rejectedPromiseHandler(Promise.all(eventsQueue), request.log)
            return requestReply.status(StatusCodes.OK).send({})
        },
    )
}
