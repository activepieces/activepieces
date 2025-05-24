import { ExecutionMode } from "@activepieces/shared"
import { noSandboxProcess } from "./no-sandbox-process"
import { workerMachine } from "../../../utils/machine"
import { isolateSandboxProcess } from "./isolate-sandbox-process"
import { EngineProcess } from "./engine-factory-types"
import { FastifyBaseLogger } from "fastify"


const factory = {
    [ExecutionMode.UNSANDBOXED]: noSandboxProcess,
    [ExecutionMode.SANDBOXED]: isolateSandboxProcess,
    [ExecutionMode.SANDBOX_CODE_ONLY]: noSandboxProcess,
}

export const engineProcessFactory = (log: FastifyBaseLogger): EngineProcess => {
    const executionMode = workerMachine.getSettings().EXECUTION_MODE as ExecutionMode
    return factory[executionMode](log)
}