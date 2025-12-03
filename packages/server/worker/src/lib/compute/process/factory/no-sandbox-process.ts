import { fork } from 'child_process'
import { FastifyBaseLogger } from 'fastify'
import { ENGINE_PATH, GLOBAL_CODE_CACHE_PATH } from '../../../cache/worker-cache'
import { EngineProcess } from './engine-factory-types'

export const noSandboxProcess = (_log: FastifyBaseLogger): EngineProcess => ({
    create: async (params) => {
        return fork(ENGINE_PATH, [], {
            ...params.options,
            execArgv: [
                // IMPORTANT DO NOT REMOVE THIS ARGUMENT: https://github.com/laverdet/isolated-vm/issues/424
                '--no-node-snapshot',
                `--max-old-space-size=${params.options.resourceLimits.maxOldGenerationSizeMb}`,
                `--max-semi-space-size=${params.options.resourceLimits.maxYoungGenerationSizeMb}`,
            ],
            env: {
                ...params.options.env,
                AP_BASE_CODE_DIRECTORY: GLOBAL_CODE_CACHE_PATH,
                WORKER_ID: params.workerId,
            },
        })
    },
})