import { Principal, PrincipalType, StepRunResponse, TestFlowRunRequestBody, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../core/websockets.service'
import { flowWorkerController } from '../workers/worker-controller'
import { flowVersionController } from './flow/flow-version.controller'
import { flowController } from './flow/flow.controller'
import { flowRunService } from './flow-run/flow-run-service'
import { sampleDataController } from './step-run/sample-data.controller'

export const flowModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowWorkerController, { prefix: '/v1/worker/flows' })
    await app.register(flowVersionController, { prefix: '/v1/flows' })
    await app.register(flowController, { prefix: '/v1/flows' })
    await app.register(sampleDataController, { prefix: '/v1/sample-data' })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.TEST_FLOW_RUN, (socket) => {
        return async (data: TestFlowRunRequestBody, principal: Principal): Promise<void> => {
            const flowRun = await flowRunService(app.log).test({
                projectId: principal.projectId,
                flowVersionId: data.flowVersionId,
            })
            socket.emit(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, flowRun)
        }
    })
    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.EMIT_TEST_STEP_PROGRESS, (socket) => {
        return async (data: StepRunResponse & { projectId: string }, principal: Principal, callback?: (data: unknown) => void): Promise<void> => {
            socket.to(data.projectId).emit(WebsocketClientEvent.TEST_STEP_PROGRESS, data)
            if (callback) {
                callback({ success: true })
            }
        }
    })
    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.EMIT_TEST_STEP_FINISHED, (socket) => {
        return async (data: StepRunResponse & { projectId: string }, principal: Principal, callback?: (data: unknown) => void): Promise<void> => {
            socket.to(data.projectId).emit(WebsocketClientEvent.TEST_STEP_FINISHED, data)
            if (callback) {
                callback({ success: true })
            }
        }
    })

}
