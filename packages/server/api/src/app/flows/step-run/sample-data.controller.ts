import { CreateStepRunRequestBody, EngineHttpResponse, GetSampleDataRequest, PauseType, PrincipalType, ProgressUpdateType, SERVICE_KEY_SECURITY_OPENAPI, WebhookPauseMetadata, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { websocketService } from '../../websockets/websockets.service'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { flowService } from '../flow/flow.service'
import { flowRunService, WEBHOOK_TIMEOUT_MS } from '../flow-run/flow-run-service'
import { sampleDataService } from './sample-data.service'

export const sampleDataController: FastifyPluginAsyncTypebox = async (fastify) => {
    websocketService.addListener(WebsocketServerEvent.TEST_STEP_RUN, (socket) => {
        return async (data: CreateStepRunRequestBody) => {
            const principal = await websocketService.verifyPrincipal(socket)
            fastify.log.debug({ data }, '[Socket#testStepRun]')
            const synchronousHandlerId = engineResponseWatcher(fastify.log).getServerId()
            const testCallbackRequestId = data.id
            const pauseMetadata: WebhookPauseMetadata = {
                type: PauseType.WEBHOOK,
                requestId: testCallbackRequestId,
                testCallbackRequestId,
                handlerId: synchronousHandlerId,
                response: {
                    status: StatusCodes.NO_CONTENT,
                    body: {},
                    headers: {},
                },
                progressUpdateType: ProgressUpdateType.NONE,    
            }
            await flowRunService(fastify.log).test({
                projectId: principal.projectId,
                flowVersionId: data.flowVersionId,
                stepNameToTest: data.stepName,
                pauseMetadata,
            })
            const response = await engineResponseWatcher(fastify.log).oneTimeListener<EngineHttpResponse>(testCallbackRequestId, true, WEBHOOK_TIMEOUT_MS, {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            })

            socket.emit(WebsocketClientEvent.TEST_STEP_FINISHED, response)
        }
    })

    fastify.get('/', GetSampleDataRequestParams, async (request) => {
        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.query.flowId,
            projectId: request.principal.projectId,
            versionId: request.query.flowVersionId,
        })
        const sampleData = await sampleDataService(request.log).getOrReturnEmpty({
            projectId: request.principal.projectId,
            flowVersion: flow.version,
            stepName: request.query.stepName,
            type: request.query.type,
        })
        return sampleData
    })
}


const GetSampleDataRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
    schema: {
        tags: ['sample-data'],
        querystring: GetSampleDataRequest,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}
