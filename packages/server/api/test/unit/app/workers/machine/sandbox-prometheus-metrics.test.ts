import { WorkerMachineStatus, WorkerMachineType, WorkerMachineWithStatus } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { sandboxPrometheusMetrics } from '../../../../../src/app/workers/machine/sandbox-prometheus-metrics'

function fakeWorker({ workerId, sandboxes, memoryLimitKb }: FakeWorkerParams): WorkerMachineWithStatus {
    return {
        id: workerId,
        created: '2026-01-01T00:00:00.000Z',
        updated: '2026-01-01T00:00:00.000Z',
        status: WorkerMachineStatus.ONLINE,
        type: WorkerMachineType.SHARED,
        information: {
            workerId,
            cpuUsagePercentage: 12.5,
            ramUsagePercentage: 40,
            totalAvailableRamInBytes: 2048,
            totalCpuCores: 2,
            ip: 'worker-"a"',
            diskInfo: { total: 100, free: 25, used: 75, percentage: 75 },
            workerProps: { SANDBOX_MEMORY_LIMIT: memoryLimitKb },
            sandboxes,
        },
    }
}

describe('sandboxPrometheusMetrics.format', () => {
    it('emits one sample per sandbox and per worker in Prometheus text format', () => {
        const output = sandboxPrometheusMetrics.format({
            workers: [fakeWorker({
                workerId: 'w1',
                memoryLimitKb: '1048576',
                sandboxes: [
                    {
                        sandboxId: 'sb-a',
                        boxId: 1,
                        busy: true,
                        memoryUsageBytes: 500,
                        sandboxPiecesUsage: [{ pieceName: '@activepieces/piece-slack', pieceVersion: '0.9.1', memoryUsageBytes: 120 }],
                    },
                    { sandboxId: 'sb-b', boxId: 2, busy: false, memoryUsageBytes: 300, sandboxPiecesUsage: [] },
                ],
            })],
        })

        expect(output).toBe([
            '# HELP activepieces_sandbox_memory_usage_bytes Resident memory of the sandbox process tree',
            '# TYPE activepieces_sandbox_memory_usage_bytes gauge',
            'activepieces_sandbox_memory_usage_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="1"} 500',
            'activepieces_sandbox_memory_usage_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="2"} 300',
            '# HELP activepieces_sandbox_busy Whether the sandbox is running a job (1) or idle (0)',
            '# TYPE activepieces_sandbox_busy gauge',
            'activepieces_sandbox_busy{worker_id="w1",host="worker-\\"a\\"",box_id="1"} 1',
            'activepieces_sandbox_busy{worker_id="w1",host="worker-\\"a\\"",box_id="2"} 0',
            '# HELP activepieces_sandbox_piece_memory_usage_bytes Estimated live JS heap held by each piece loaded in the sandbox',
            '# TYPE activepieces_sandbox_piece_memory_usage_bytes gauge',
            'activepieces_sandbox_piece_memory_usage_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="1",piece="@activepieces/piece-slack",version="0.9.1"} 120',
            '# HELP activepieces_sandbox_memory_limit_bytes V8 heap limit configured for each sandbox on the worker',
            '# TYPE activepieces_sandbox_memory_limit_bytes gauge',
            'activepieces_sandbox_memory_limit_bytes{worker_id="w1",host="worker-\\"a\\""} 1073741824',
            '# HELP activepieces_worker_cpu_usage_percent CPU usage of the worker process itself, excluding its sandbox processes',
            '# TYPE activepieces_worker_cpu_usage_percent gauge',
            'activepieces_worker_cpu_usage_percent{worker_id="w1",host="worker-\\"a\\""} 12.5',
            '# HELP activepieces_worker_memory_usage_percent RAM usage of the worker container',
            '# TYPE activepieces_worker_memory_usage_percent gauge',
            'activepieces_worker_memory_usage_percent{worker_id="w1",host="worker-\\"a\\""} 40',
            '# HELP activepieces_worker_memory_total_bytes RAM available to the worker container',
            '# TYPE activepieces_worker_memory_total_bytes gauge',
            'activepieces_worker_memory_total_bytes{worker_id="w1",host="worker-\\"a\\""} 2048',
            '# HELP activepieces_worker_disk_usage_percent Disk usage of the worker machine',
            '# TYPE activepieces_worker_disk_usage_percent gauge',
            'activepieces_worker_disk_usage_percent{worker_id="w1",host="worker-\\"a\\""} 75',
            '',
        ].join('\n'))
    })

    it('omits metrics that have no samples', () => {
        const output = sandboxPrometheusMetrics.format({
            workers: [fakeWorker({ workerId: 'w1', memoryLimitKb: undefined, sandboxes: [] })],
        })

        expect(output).not.toContain('activepieces_sandbox_')
        expect(output).toContain('activepieces_worker_cpu_usage_percent{worker_id="w1"')
    })

    it('returns an empty body when no workers are online', () => {
        expect(sandboxPrometheusMetrics.format({ workers: [] })).toBe('\n')
    })
})

type FakeWorkerParams = {
    workerId: string
    memoryLimitKb: string | undefined
    sandboxes: WorkerMachineWithStatus['information']['sandboxes']
}
