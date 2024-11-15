import { logger } from '@activepieces/server-shared'
import { CreateStepRunRequestBody, GetSampleDataRequest, PrincipalType, SaveSampleDataRequest, StepRunResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { websocketService } from '../../websockets/websockets.service'
import { flowService } from '../flow/flow.service'
import { sampleDataService } from './sample-data.service'

export const sampleDataController: FastifyPluginAsyncTypebox = async (fastify) => {
    websocketService.addListener(WebsocketServerEvent.TEST_STEP_RUN, (socket) => {
        return async (data: CreateStepRunRequestBody) => {
            const principal = await accessTokenManager.verifyPrincipal(socket.handshake.auth.token)
            logger.debug({ data }, '[Socket#testStepRun]')
            const stepRun = await sampleDataService.runAction({
                projectId: principal.projectId,
                platformId: principal.platform.id,
                flowVersionId: data.flowVersionId,
                stepName: data.stepName,
            })

            const response: StepRunResponse = {
                id: data.id,
                success: stepRun.success,
                output: stepRun.output,
                standardError: stepRun.standardError,
                standardOutput: stepRun.standardOutput,
            }
            socket.emit(WebsocketClientEvent.TEST_STEP_FINISHED, response)
        }
    })


    fastify.post('/', SaveSampleRequest, async (request) => {
        return sampleDataService.save({
            projectId: request.principal.projectId,
            flowVersionId: request.body.flowVersionId,
            stepName: request.body.stepName,
            payload: request.body.payload,
        })
    })

    fastify.get('/', GetSampleDataRequestParams, async (request) => {
        const flow = await flowService.getOnePopulatedOrThrow({
            id: request.query.flowId,
            projectId: request.principal.projectId,
            versionId: request.query.flowVersionId,
        })
        const sampleData = await sampleDataService.getOrReturnEmpty({
            projectId: request.principal.projectId,
            flowVersion: flow.version,
            stepName: request.query.stepName,
        })
        return sampleData
    })
}

const SaveSampleRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: SaveSampleDataRequest,
    },
}

const GetSampleDataRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        querystring: GetSampleDataRequest,
    },
}
