import { PrincipalType, TestFlowRunRequestBody, WebsocketClientEvent, WebsocketLockFlowRequest, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { websocketService } from '../core/websockets.service'
import { userService } from '../user/user-service'
import { flowVersionController } from './flow/flow-version.controller'
import { flowController } from './flow/flow.controller'
import { flowLockService } from './flow-lock/flow-lock.service'
import { flowRunService } from './flow-run/flow-run-service'
import { sampleDataController } from './step-run/sample-data.controller'

export const flowModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(flowVersionController, { prefix: '/v1/flows' })
    await app.register(flowController, { prefix: '/v1/flows' })
    await app.register(sampleDataController, { prefix: '/v1/sample-data' })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.TEST_FLOW_RUN, (socket) => {
        return async (data: TestFlowRunRequestBody, principal, projectId) => {
            const flowRun = await flowRunService(app.log).test({
                projectId,
                flowVersionId: data.flowVersionId,
                triggeredBy: principal.id,
            })
            socket.emit(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, flowRun)
        }
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.MANUAL_TRIGGER_RUN_STARTED, (socket) => {
        return async (data: TestFlowRunRequestBody, principal, projectId) => {
            const flowRun = await flowRunService(app.log).startManualTrigger({
                projectId,
                flowVersionId: data.flowVersionId,
                triggeredBy: principal.id,
            })
            socket.emit(WebsocketClientEvent.MANUAL_TRIGGER_RUN_STARTED, flowRun)
        }
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.LOCK_FLOW, (socket) => {
        return async (data: WebsocketLockFlowRequest, principal, projectId, callback) => {
            try {
                const user = await userService(app.log).getMetaInformation({ id: principal.id })
                const displayName = `${user.firstName} ${user.lastName}`

                const result = await flowLockService(app.log).acquire({
                    flowId: data.flowId,
                    userId: principal.id,
                    userDisplayName: displayName,
                    force: data.force,
                })

                if (result.acquired) {
                    socket.data.lockedFlowId = data.flowId
                    socket.to(projectId).emit(WebsocketClientEvent.FLOW_LOCKED, {
                        flowId: data.flowId,
                        userId: principal.id,
                        userDisplayName: displayName,
                    })
                }

                registerDisconnectHandler(socket, principal.id, projectId, app.log)

                callback?.(result)
            }
            catch (error) {
                app.log.error({ err: error }, '[LOCK_FLOW] Failed to acquire flow lock')
                callback?.({ acquired: false, lock: null })
            }
        }
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.UNLOCK_FLOW, (socket) => {
        return async (data: { flowId: string }, principal, projectId) => {
            try {
                const released = await flowLockService(app.log).release({
                    flowId: data.flowId,
                    userId: principal.id,
                })
                socket.data.lockedFlowId = null
                if (released) {
                    websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_UNLOCKED, {
                        flowId: data.flowId,
                    })
                }
            }
            catch (error) {
                app.log.error({ err: error }, '[UNLOCK_FLOW] Failed to release flow lock')
            }
        }
    })
}

function registerDisconnectHandler(socket: { data: Record<string, unknown>, once: (event: string, handler: () => void) => void, id: string }, userId: string, projectId: string, log: FastifyBaseLogger): void {
    if (socket.data.flowLockDisconnectRegistered) {
        return
    }
    socket.data.flowLockDisconnectRegistered = true
    socket.once('disconnect', async () => {
        const lockedFlowId = socket.data.lockedFlowId
        if (typeof lockedFlowId === 'string') {
            const released = await flowLockService(log).release({
                flowId: lockedFlowId,
                userId,
            })
            if (released) {
                websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_UNLOCKED, {
                    flowId: lockedFlowId,
                })
            }
        }
    })
}
