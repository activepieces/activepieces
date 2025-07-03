import { CreateStepRunRequestBody, GetSampleDataRequest, PrincipalType, RunEnvironment, SERVICE_KEY_SECURITY_OPENAPI, StepRunResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../../websockets/websockets.service'
import { flowService } from '../flow/flow.service'
import { sampleDataService } from './sample-data.service'

export const sampleDataController: FastifyPluginAsyncTypebox = async (fastify) => {
    websocketService.addListener(WebsocketServerEvent.TEST_STEP_RUN, (socket) => {
        return async (data: CreateStepRunRequestBody) => {
            const principal = await websocketService.verifyPrincipal(socket)
            fastify.log.debug({ data }, '[Socket#testStepRun]')
            const stepRun = await sampleDataService(fastify.log).runAction({
                projectId: principal.projectId,
                platformId: principal.platform.id,
                flowVersionId: data.flowVersionId,
                stepName: data.stepName,
                runEnvironment: RunEnvironment.TESTING,
                requestId: data.id,
            })
            const response: StepRunResponse = {
                id: data.id,
                success: stepRun.success,
                input: stepRun.input,
                output: stepRun.output,
                standardError: stepRun.standardError,
                standardOutput: stepRun.standardOutput,
            }
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
