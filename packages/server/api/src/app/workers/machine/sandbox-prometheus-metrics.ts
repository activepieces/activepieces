import { isNil } from '@activepieces/core-utils'
import { SandboxHeapUsage, WorkerMachineWithStatus } from '@activepieces/shared'

export const sandboxPrometheusMetrics = {
    format: ({ workers }: FormatParams): string => {
        return METRICS
            .map((metric) => ({ metric, samples: workers.flatMap(metric.collect) }))
            .filter(({ samples }) => samples.length > 0)
            .map(({ metric, samples }) => [
                `# HELP ${metric.name} ${metric.help}`,
                `# TYPE ${metric.name} gauge`,
                ...samples.map((sample) => `${metric.name}{${formatLabels(sample.labels)}} ${sample.value}`),
            ].join('\n'))
            .join('\n')
            .concat('\n')
    },
}

const BYTES_PER_KB = 1024

const METRICS: Metric[] = [
    {
        name: 'activepieces_sandbox_memory_usage_bytes',
        help: 'Total resident memory of the sandbox process and its children: V8 heap plus buffers, native memory and the Node runtime. This is what counts against the container memory limit',
        collect: (worker) => (worker.information.sandboxes ?? []).map((sandbox) => ({
            labels: { ...workerLabels(worker), box_id: String(sandbox.boxId) },
            value: sandbox.memoryUsageBytes,
        })),
    },
    {
        name: 'activepieces_sandbox_heap_used_bytes',
        help: 'V8 JS heap in use in the sandbox engine process. This is the only part capped by AP_SANDBOX_MEMORY_LIMIT, and the sandbox is killed when it reaches activepieces_sandbox_heap_limit_bytes',
        collect: (worker) => heapSamples({ worker, read: (heap) => heap.usedBytes }),
    },
    {
        name: 'activepieces_sandbox_heap_limit_bytes',
        help: 'V8 heap limit enforced in the sandbox engine process, as reported by V8. Compare with activepieces_sandbox_heap_used_bytes',
        collect: (worker) => heapSamples({ worker, read: (heap) => heap.limitBytes }),
    },
    {
        name: 'activepieces_sandbox_external_memory_bytes',
        help: 'Memory held outside the V8 heap by JS objects in the sandbox engine process, mostly Buffer data. Not capped by AP_SANDBOX_MEMORY_LIMIT, included in activepieces_sandbox_memory_usage_bytes',
        collect: (worker) => heapSamples({ worker, read: (heap) => heap.externalBytes }),
    },
    {
        name: 'activepieces_sandbox_busy',
        help: 'Whether the sandbox is running a job (1) or idle (0)',
        collect: (worker) => (worker.information.sandboxes ?? []).map((sandbox) => ({
            labels: { ...workerLabels(worker), box_id: String(sandbox.boxId) },
            value: sandbox.busy ? 1 : 0,
        })),
    },
    {
        name: 'activepieces_sandbox_piece_memory_usage_bytes',
        help: 'Estimated live JS heap held by each piece loaded in the sandbox. Each sandbox refreshes it every 60 seconds, the other sandbox metrics every 15',
        collect: (worker) => (worker.information.sandboxes ?? []).flatMap((sandbox) => (sandbox.sandboxPiecesUsage ?? []).map((piece) => ({
            labels: { ...workerLabels(worker), box_id: String(sandbox.boxId), piece: piece.pieceName, version: piece.pieceVersion },
            value: piece.memoryUsageBytes,
        }))),
    },
    {
        name: 'activepieces_sandbox_memory_limit_bytes',
        help: 'Configured AP_SANDBOX_MEMORY_LIMIT for each sandbox on the worker. It caps the V8 heap only, not activepieces_sandbox_memory_usage_bytes',
        collect: (worker) => {
            const limitKb = Number(worker.information.workerProps.SANDBOX_MEMORY_LIMIT)
            if (isNil(worker.information.workerProps.SANDBOX_MEMORY_LIMIT) || !Number.isFinite(limitKb)) {
                return []
            }
            return [{ labels: workerLabels(worker), value: limitKb * BYTES_PER_KB }]
        },
    },
]

function heapSamples({ worker, read }: HeapSamplesParams): Sample[] {
    return (worker.information.sandboxes ?? []).flatMap((sandbox) => isNil(sandbox.heapUsage) ? [] : [{
        labels: { ...workerLabels(worker), box_id: String(sandbox.boxId) },
        value: read(sandbox.heapUsage),
    }])
}

function workerLabels(worker: WorkerMachineWithStatus): Record<string, string> {
    return {
        worker_id: worker.information.workerId,
        host: worker.information.ip,
    }
}

function formatLabels(labels: Record<string, string>): string {
    return Object.entries(labels)
        .map(([key, value]) => `${key}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`)
        .join(',')
}

type FormatParams = {
    workers: WorkerMachineWithStatus[]
}

type HeapSamplesParams = {
    worker: WorkerMachineWithStatus
    read: (heap: SandboxHeapUsage) => number
}

type Sample = {
    labels: Record<string, string>
    value: number
}

type Metric = {
    name: string
    help: string
    collect: (worker: WorkerMachineWithStatus) => Sample[]
}
