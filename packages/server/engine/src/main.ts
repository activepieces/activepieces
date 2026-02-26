import { isNil } from '@activepieces/shared'
import { progressService } from './lib/services/progress.service'
import { workerSocket } from './lib/worker-socket'

const SANDBOX_ID = process.env.SANDBOX_ID
process.title = `sandbox-${SANDBOX_ID}`

if (!isNil(SANDBOX_ID)) {
    workerSocket.init(SANDBOX_ID)
    progressService.init()
}

process.on('uncaughtException', (error) => {
    void workerSocket.sendError(error).catch().finally(() => {
        process.exit(3)
    })
})

process.on('unhandledRejection', (reason) => {
    void workerSocket.sendError(reason).catch().finally(() => {
        process.exit(4)
    })
})
