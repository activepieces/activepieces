import { ExecutionMode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { isolateEngineRunner } from './isolate/isolate-engine-runner'
import { threadEngineRunner } from './threads/thread-engine-runner'
import { machine } from '../utils/machine'

const engineToRunner = {
    [ExecutionMode.UNSANDBOXED]: threadEngineRunner,
    [ExecutionMode.SANDBOXED]: isolateEngineRunner,
    [ExecutionMode.SANDBOX_CODE_ONLY]: threadEngineRunner,
}

export const engineRunner = (log: FastifyBaseLogger) => {
    const executionMode = machine.getSettings().EXECUTION_MODE as ExecutionMode
    const runner = engineToRunner[executionMode](log)
    return runner
}