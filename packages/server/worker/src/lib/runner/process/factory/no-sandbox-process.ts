import { fork } from 'child_process'
import { ENGINE_PATH, GLOBAL_CODE_CACHE_PATH } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineProcess } from './engine-factory-types'

export const noSandboxProcess = (_log: FastifyBaseLogger): EngineProcess => ({
    create: async (params) => {
        return fork(ENGINE_PATH, [], {
            ...params.options,
            env: {
                ...params.options.env,
                AP_BASE_CODE_DIRECTORY: GLOBAL_CODE_CACHE_PATH,
                WORKER_ID: params.workerId,
            },
        })
    },
})