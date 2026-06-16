import { system, WorkerSystemProp } from '../../config/configs'
import { logger } from '../../config/logger'
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
            case ExecutionRuntime.WORKER_POOL:
            default:
                return createWorkerPoolRuntime({ boxId: slot })
        }
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
}
