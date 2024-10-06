import { CreateStepRunRequestBody, PrincipalType, SaveSampleDataRequest, StepRunResponse, WebsocketClientEvent, WebsocketServerEvent } from "@activepieces/shared"
import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox"
import { websocketService } from "../../websockets/websockets.service"
import { accessTokenManager } from "../../authentication/lib/access-token-manager"
import { sampleDataService } from "./sample-data.service"
import { logger } from "@sentry/utils"

export const sampleDataController: FastifyPluginAsyncTypebox = async (fastify) => {
    websocketService.addListener(WebsocketServerEvent.TEST_STEP_RUN, (socket) => {
        return async (data: CreateStepRunRequestBody) => {
            const principal = await accessTokenManager.verifyPrincipal(socket.handshake.auth.token)
            logger.debug({ data }, '[Socket#testStepRun]')
            const stepRun = await sampleDataService.runAction({
                projectId: principal.projectId,
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
        return await sampleDataService.save({
            projectId: request.principal.projectId,
            flowVersionId: request.body.flowVersionId,
            stepName: request.body.stepName,
            payload: request.body.payload,
        })
    })

    fastify.get('/:id', GetSampleDataRequestParams, async (request) => {
        const sampleData = await sampleDataService.getOrThrow({
            projectId: request.principal.projectId,
            id: request.params.id,
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
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
