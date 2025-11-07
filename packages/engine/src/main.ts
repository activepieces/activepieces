import { isNil } from '@activepieces/shared'
import { workerSocket } from './lib/worker-socket'

const WORKER_ID = process.env.WORKER_ID
process.title = `engine-${WORKER_ID}`

if (!isNil(WORKER_ID)) {
    workerSocket.init()
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
