import { Socket } from 'socket.io'
import { logger } from 'server-shared'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowResponseWatcher } from '../flows/flow-run/flow-response-watcher'

export const websocketService = {
    init(socket: Socket): void {
        this.registerEventListeners(socket)
    },

    registerEventListeners(socket: Socket): void {
        socket.on('testFlowRun', async (data) => {
            logger.debug({ data }, '[Socket#testFlowRun]')
            const flowRun = await flowRunService.test({
                projectId: data.projectId,
                flowVersionId: data.flowVersionId,
            })
            socket.emit('flowRunStarted', flowRun)

            await flowResponseWatcher.listen(flowRun.id)
            socket.emit('flowRunFinished', flowRun)
        })
    },
}
