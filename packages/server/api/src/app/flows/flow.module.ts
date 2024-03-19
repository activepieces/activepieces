import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowController } from './flow/flow.controller'
import { folderController } from './folder/folder.controller'
import { flowVersionController } from './flow/flow-version.controller'
import { testTriggerController } from './test-trigger/test-trigger-controller'
import { websocketService } from '../websockets/websockets.service'
import { CreateStepRunRequestBody, StepRunResponse, TestFlowRunRequestBody, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { flowResponseWatcher } from './flow-run/flow-response-watcher'
import { flowRunService } from './flow-run/flow-run-service'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { stepRunService } from './step-run/step-run-service'
import { logger } from 'server-shared'

export const flowModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowVersionController, { prefix: '/v1/flows' })
    await app.register(flowController, { prefix: '/v1/flows' })
    await app.register(folderController, { prefix: '/v1/folders' })
    await app.register(testTriggerController, { prefix: '/v1/test-trigger' })
    websocketService.addListener(WebsocketServerEvent.TEST_FLOW_RUN, (socket) => {
        return async (data: TestFlowRunRequestBody) => {
            const principal = await accessTokenManager.extractPrincipal(socket.handshake.auth.token)
            const flowRun = await flowRunService.test({
                projectId: principal.projectId,
                flowVersionId: data.flowVersionId,
            })
            socket.emit(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, flowRun)
            await flowResponseWatcher.listen(flowRun.id, false)
            socket.emit(WebsocketClientEvent.TEST_FLOW_RUN_FINSIHED, flowRun)
        }
    })
    websocketService.addListener(WebsocketServerEvent.TEST_STEP_RUN, (socket) => {
        return async (data: CreateStepRunRequestBody) => {
            const principal = await accessTokenManager.extractPrincipal(socket.handshake.auth.token)
            logger.debug({ data }, '[Socket#testStepRun]')
            const stepRun = await stepRunService.create({
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

}
