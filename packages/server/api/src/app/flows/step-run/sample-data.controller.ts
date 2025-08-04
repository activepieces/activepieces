import { CreateStepRunRequestBody, GetSampleDataRequest, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { serverEventBus, websocketService } from '../../websockets/websockets.service'
import { flowService } from '../flow/flow.service'
import { flowRunService } from '../flow-run/flow-run-service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { sampleDataService } from './sample-data.service'
import { stepRunProgressHandler } from './step-run-progress.handler'

export const sampleDataController: FastifyPluginAsyncTypebox = async (fastify) => {
    websocketService.addListener(WebsocketServerEvent.TEST_STEP_RUN, (socket) => {
        return async (data: CreateStepRunRequestBody) => {
            const principal = await websocketService.verifyPrincipal(socket)
            fastify.log.debug({ data }, '[Socket#testStepRun]')
            const flowVersion = await flowVersionService(fastify.log).getOneOrThrow(data.flowVersionId)
            
            const flowRun = await flowRunService(fastify.log).test({
                projectId: principal.projectId,
                flowVersionId: data.flowVersionId,
                stepNameToTest: data.stepName,
            })

            const onProgress = stepRunProgressHandler.createProgressHandler({
                socket,
                projectId: principal.projectId,
                logger: fastify.log,
                stepName: data.stepName,
                requestId: data.id,
                runId: flowRun.id,
                flowVersion,
            })

            serverEventBus.on(WebsocketServerEvent.TEST_STEP_RUN_PROGRESS, onProgress)

            socket.on('disconnect', () =>
                serverEventBus.off(WebsocketServerEvent.TEST_STEP_RUN_PROGRESS, onProgress),
            )
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
