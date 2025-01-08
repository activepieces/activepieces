import { ExecutionMode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'
import { isolateEngineRunner } from './isolate/isolate-engine-runner'
import { threadEngineRunner } from './threads/thread-engine-runner'

const engineToRunner = {
    [ExecutionMode.UNSANDBOXED]: threadEngineRunner,
    [ExecutionMode.SANDBOXED]: isolateEngineRunner,
    [ExecutionMode.SANDBOX_CODE_ONLY]: threadEngineRunner,
}

export const engineRunner = (log: FastifyBaseLogger) => {
    const executionMode = workerMachine.getSettings().EXECUTION_MODE as ExecutionMode
    const runner = engineToRunner[executionMode](log)
    return runner
}