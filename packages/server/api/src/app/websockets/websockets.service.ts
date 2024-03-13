import { Socket } from 'socket.io'
import { logger } from 'server-shared'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowResponseWatcher } from '../flows/flow-run/flow-response-watcher'
import { stepRunService } from '../flows/step-run/step-run-service'
import { CreateStepRunRequestBody, StepRunResponse, TestFlowRunRequestBody } from '@activepieces/shared'
import { accessTokenManager } from '../authentication/lib/access-token-manager'

export const websocketService = {
    init(socket: Socket): void {
        this.registerEventListeners(socket)
    },

    registerEventListeners(socket: Socket): void {
        socket.on('testFlowRun', async (data: TestFlowRunRequestBody) => {
            const principal = await accessTokenManager.extractPrincipal(socket.handshake.auth.token)
            const flowRun = await flowRunService.test({
                projectId: principal.projectId,
                flowVersionId: data.flowVersionId,
            })
            socket.emit('flowRunStarted', flowRun)

            await flowResponseWatcher.listen(flowRun.id, false)
            socket.emit('flowRunFinished', flowRun)
        })

        socket.on('testStepRun', async (data: CreateStepRunRequestBody) => {
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
            socket.emit('stepRunFinished', response)
        })
    },
}
