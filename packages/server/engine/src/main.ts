import { isNil } from '@activepieces/shared'
import { engineServer } from './lib/engine-server'
import { ssrfGuard } from './lib/network/ssrf-guard'

ssrfGuard.install()

const SANDBOX_ID = process.env.SANDBOX_ID
process.title = `sandbox-${SANDBOX_ID}`

if (!isNil(process.env.AP_ENGINE_PORT)) {
    void engineServer.start()
}

process.on('uncaughtException', (error) => {
    // eslint-disable-next-line no-console
    console.error('[engine] uncaughtException', error)
    process.exit(3)
})

process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[engine] unhandledRejection', reason)
    process.exit(4)
})
