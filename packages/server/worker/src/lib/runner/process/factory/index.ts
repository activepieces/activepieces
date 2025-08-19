import { ExecutionMode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../../../utils/machine'
import { EngineProcess } from './engine-factory-types'
import { isolateSandboxProcess } from './isolate-sandbox-process'
import { noSandboxProcess } from './no-sandbox-process'


const factory = {
    [ExecutionMode.UNSANDBOXED]: noSandboxProcess,
    [ExecutionMode.SANDBOXED]: isolateSandboxProcess,
    [ExecutionMode.SANDBOX_CODE_ONLY]: noSandboxProcess,
}

export const engineProcessFactory = (log: FastifyBaseLogger): EngineProcess => {
    const executionMode = workerMachine.getSettings().EXECUTION_MODE as ExecutionMode
    return factory[executionMode](log)
}