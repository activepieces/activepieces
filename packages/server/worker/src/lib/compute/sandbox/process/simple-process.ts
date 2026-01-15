import { fork } from 'child_process'
import { FastifyBaseLogger } from 'fastify'
import { ENGINE_PATH, GLOBAL_CODE_CACHE_PATH } from '../../../cache/worker-cache'
import { ProcessMaker } from './types'

export const simpleProcess = (_log: FastifyBaseLogger): ProcessMaker => ({
    create: async (params) => {
        const { env, memoryLimitMb, sandboxId } = params
        return fork(ENGINE_PATH, [], {
            execArgv: [
                // IMPORTANT DO NOT REMOVE THIS ARGUMENT: https://github.com/laverdet/isolated-vm/issues/424
                '--no-node-snapshot',
                `--max-old-space-size=${memoryLimitMb}`,
                `--max-semi-space-size=${memoryLimitMb}`,
            ],
            env: {
                ...env,
                AP_BASE_CODE_DIRECTORY: GLOBAL_CODE_CACHE_PATH,
                SANDBOX_ID: sandboxId,
            },
        })
    },
})

