import { isNil } from '@activepieces/core-utils'
import { flowRunProgressReporter } from './lib/helper/flow-run-progress-reporter'
import { ssrfGuard } from './lib/network/ssrf-guard'
import { workerHttp } from './lib/worker-http'

ssrfGuard.install()

const SANDBOX_ID = process.env.SANDBOX_ID
process.title = `sandbox-${SANDBOX_ID}`

if (!isNil(SANDBOX_ID)) {
    workerHttp.init(SANDBOX_ID)
    flowRunProgressReporter.init()
}

process.on('uncaughtException', (error) => {
    workerHttp.sendError(error)
    process.exit(3)
})

process.on('unhandledRejection', (reason) => {
    workerHttp.sendError(reason)
    process.exit(4)
})
