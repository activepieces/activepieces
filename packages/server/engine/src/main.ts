import { isNil } from '@activepieces/shared'
import { flowRunProgressReporter } from './lib/helper/flow-run-progress-reporter'
import { ssrfGuard } from './lib/network/ssrf-guard'
import { workerSocket } from './lib/worker-socket'

ssrfGuard.install()

const SANDBOX_ID = process.env.SANDBOX_ID
process.title = `sandbox-${SANDBOX_ID}`

if (!isNil(SANDBOX_ID)) {
    workerSocket.init(SANDBOX_ID)
    flowRunProgressReporter.init()
}

process.on('uncaughtException', (error) => {
    workerSocket.sendError(error)
    process.exit(3)
})

process.on('unhandledRejection', (reason) => {
    workerSocket.sendError(reason)
    process.exit(4)
})
