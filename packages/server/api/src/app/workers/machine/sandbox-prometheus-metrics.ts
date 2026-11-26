import { isNil } from '@activepieces/core-utils'
import { WorkerMachineWithStatus } from '@activepieces/shared'

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
        help: 'Resident memory of the sandbox process tree',
        collect: (worker) => (worker.information.sandboxes ?? []).map((sandbox) => ({
            labels: { ...workerLabels(worker), box_id: String(sandbox.boxId) },
            value: sandbox.memoryUsageBytes,
        })),
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
        help: 'Estimated live JS heap held by each piece loaded in the sandbox',
        collect: (worker) => (worker.information.sandboxes ?? []).flatMap((sandbox) => (sandbox.sandboxPiecesUsage ?? []).map((piece) => ({
            labels: { ...workerLabels(worker), box_id: String(sandbox.boxId), piece: piece.pieceName, version: piece.pieceVersion },
            value: piece.memoryUsageBytes,
        }))),
    },
    {
        name: 'activepieces_sandbox_memory_limit_bytes',
        help: 'V8 heap limit configured for each sandbox on the worker',
        collect: (worker) => {
            const limitKb = Number(worker.information.workerProps.SANDBOX_MEMORY_LIMIT)
            if (isNil(worker.information.workerProps.SANDBOX_MEMORY_LIMIT) || !Number.isFinite(limitKb)) {
                return []
            }
            return [{ labels: workerLabels(worker), value: limitKb * BYTES_PER_KB }]
        },
    },
    {
        name: 'activepieces_worker_cpu_usage_percent',
        help: 'CPU usage of the worker process itself, excluding its sandbox processes',
        collect: (worker) => [{ labels: workerLabels(worker), value: worker.information.cpuUsagePercentage }],
    },
    {
        name: 'activepieces_worker_memory_usage_percent',
        help: 'RAM usage of the worker container',
        collect: (worker) => [{ labels: workerLabels(worker), value: worker.information.ramUsagePercentage }],
    },
    {
        name: 'activepieces_worker_memory_total_bytes',
        help: 'RAM available to the worker container',
        collect: (worker) => [{ labels: workerLabels(worker), value: worker.information.totalAvailableRamInBytes }],
    },
    {
        name: 'activepieces_worker_disk_usage_percent',
        help: 'Disk usage of the worker machine',
        collect: (worker) => [{ labels: workerLabels(worker), value: worker.information.diskInfo.percentage }],
    },
]

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

type Sample = {
    labels: Record<string, string>
    value: number
}

type Metric = {
    name: string
    help: string
    collect: (worker: WorkerMachineWithStatus) => Sample[]
}
