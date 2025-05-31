import { CreateStepRunRequestBody, FileType, GetSampleDataRequest, PrincipalType, RunEnvironment, SaveSampleDataRequest, SaveSampleDataResponse, SERVICE_KEY_SECURITY_OPENAPI, StepRunResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { websocketService } from '../../websockets/websockets.service'
import { flowService } from '../flow/flow.service'
import { sampleDataService } from './sample-data.service'

export const sampleDataController: FastifyPluginAsyncTypebox = async (fastify) => {
    websocketService.addListener(WebsocketServerEvent.TEST_STEP_RUN, (socket) => {
        return async (data: CreateStepRunRequestBody) => {
            const principal = await accessTokenManager.verifyPrincipal(socket.handshake.auth.token)
            fastify.log.debug({ data }, '[Socket#testStepRun]')
            const stepRun = await sampleDataService(fastify.log).runAction({
                projectId: principal.projectId,
                platformId: principal.platform.id,
                flowVersionId: data.flowVersionId,
                stepName: data.stepName,
                runEnvironment: RunEnvironment.TESTING,
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


    fastify.post('/', SaveSampleRequest, async (request) => {
        return sampleDataService(request.log).save({
            projectId: request.principal.projectId,
            flowVersionId: request.body.flowVersionId,
            stepName: request.body.stepName,
            payload: request.body.payload,
            fileType: request.body.fileType ?? FileType.SAMPLE_DATA,
        })
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
            fileType: request.query.fileType ?? FileType.SAMPLE_DATA,
        })
        return sampleData
    })
}

const SaveSampleRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
    schema: {
        tags: ['sample-data'],
        body: SaveSampleDataRequest,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: SaveSampleDataResponse,
        },
    },
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
