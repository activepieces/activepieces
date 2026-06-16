import { system, WorkerSystemProp } from '../../config/configs'
import { logger } from '../../config/logger'
import { createCloudFunctionRuntime } from './cloud-function/cloud-function-runtime'
import { ExecutionRuntime, FlowExecutionRuntime } from './types'
import { createWorkerPoolRuntime } from './worker-pool/worker-pool-runtime'

export const runtimeFactory = {
    selected(): ExecutionRuntime {
        const raw = system.get(WorkerSystemProp.EXECUTION_RUNTIME)
        if (isExecutionRuntime(raw)) {
            return raw
        }
        logger.warn({ raw }, `Invalid AP_EXECUTION_RUNTIME value, falling back to ${ExecutionRuntime.WORKER_POOL}`)
        return ExecutionRuntime.WORKER_POOL
    },
    createRuntime({ slot }: { slot: number }): FlowExecutionRuntime {
        switch (runtimeFactory.selected()) {
            case ExecutionRuntime.CLOUD_FUNCTION:
                return createCloudFunctionRuntime({ slot })
            case ExecutionRuntime.WORKER_POOL:
            default:
                return createWorkerPoolRuntime({ boxId: slot })
        }
    },
    // Piece-scoped and trigger-hook operations always run on the local worker pool, even under a
    // remote runtime: they need the local piece cache and have no per-project deploy unit to
    // invoke (ADR-0002 §4). Only EXECUTE_FLOW routes to the selected runtime.
    createLocalRuntime({ slot }: { slot: number }): FlowExecutionRuntime {
        return createWorkerPoolRuntime({ boxId: slot })
    },
    concurrencyFor(runtime: ExecutionRuntime): number {
        const runtimeDefault = RUNTIME_DEFAULT_CONCURRENCY[runtime]
        const raw = system.get(WorkerSystemProp.WORKER_CONCURRENCY)
        if (raw === undefined) {
            return runtimeDefault
        }
        const parsed = Number(raw)
        if (Number.isInteger(parsed) && parsed > 0) {
            return parsed
        }
        logger.warn({ rawConcurrency: raw }, 'Invalid AP_WORKER_CONCURRENCY value, falling back to 1')
        return 1
    },
}

function isExecutionRuntime(value: string | undefined): value is ExecutionRuntime {
    return Object.values(ExecutionRuntime).some((runtime) => runtime === value)
}

const RUNTIME_DEFAULT_CONCURRENCY: Record<ExecutionRuntime, number> = {
    [ExecutionRuntime.WORKER_POOL]: 5,
    // Remote functions hold no local process, so a worker can fan out many concurrent
    // in-flight HTTP executions without consuming a sandbox slot per run.
    [ExecutionRuntime.CLOUD_FUNCTION]: 50,
}
