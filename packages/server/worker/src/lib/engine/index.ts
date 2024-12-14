import { SharedSystemProp, system } from '@activepieces/server-shared'
import { ExecutionMode } from '@activepieces/shared'
import { isolateEngineRunner } from './isolate/isolate-engine-runner'
import { threadEngineRunner } from './threads/thread-engine-runner'
import { FastifyBaseLogger } from 'fastify'

const executionMode = system.getOrThrow<ExecutionMode>(SharedSystemProp.EXECUTION_MODE)

const engineToRunner = {
    [ExecutionMode.UNSANDBOXED]: threadEngineRunner,
    [ExecutionMode.SANDBOXED]: isolateEngineRunner,
    [ExecutionMode.SANDBOX_CODE_ONLY]: threadEngineRunner,
}

export const engineRunner = (log: FastifyBaseLogger) => engineToRunner[executionMode](log)