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
    it('emits one sample per sandbox in Prometheus text format', () => {
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
                        heapUsage: { usedBytes: 200, limitBytes: 1100, externalBytes: 50 },
                    },
                    { sandboxId: 'sb-b', boxId: 2, busy: false, memoryUsageBytes: 300, sandboxPiecesUsage: [] },
                ],
            })],
        })

        expect(output).toBe([
            '# HELP activepieces_sandbox_memory_usage_bytes Total resident memory of the sandbox process and its children: V8 heap plus buffers, native memory and the Node runtime. This is what counts against the container memory limit',
            '# TYPE activepieces_sandbox_memory_usage_bytes gauge',
            'activepieces_sandbox_memory_usage_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="1"} 500',
            'activepieces_sandbox_memory_usage_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="2"} 300',
            '# HELP activepieces_sandbox_heap_used_bytes V8 JS heap in use in the sandbox engine process. This is the only part capped by AP_SANDBOX_MEMORY_LIMIT, and the sandbox is killed when it reaches activepieces_sandbox_heap_limit_bytes',
            '# TYPE activepieces_sandbox_heap_used_bytes gauge',
            'activepieces_sandbox_heap_used_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="1"} 200',
            '# HELP activepieces_sandbox_heap_limit_bytes V8 heap limit enforced in the sandbox engine process, as reported by V8. Compare with activepieces_sandbox_heap_used_bytes',
            '# TYPE activepieces_sandbox_heap_limit_bytes gauge',
            'activepieces_sandbox_heap_limit_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="1"} 1100',
            '# HELP activepieces_sandbox_external_memory_bytes Memory held outside the V8 heap by JS objects in the sandbox engine process, mostly Buffer data. Not capped by AP_SANDBOX_MEMORY_LIMIT, included in activepieces_sandbox_memory_usage_bytes',
            '# TYPE activepieces_sandbox_external_memory_bytes gauge',
            'activepieces_sandbox_external_memory_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="1"} 50',
            '# HELP activepieces_sandbox_busy Whether the sandbox is running a job (1) or idle (0)',
            '# TYPE activepieces_sandbox_busy gauge',
            'activepieces_sandbox_busy{worker_id="w1",host="worker-\\"a\\"",box_id="1"} 1',
            'activepieces_sandbox_busy{worker_id="w1",host="worker-\\"a\\"",box_id="2"} 0',
            '# HELP activepieces_sandbox_piece_memory_usage_bytes Estimated live JS heap held by each piece loaded in the sandbox. Each sandbox refreshes it every 60 seconds, the other sandbox metrics every 15',
            '# TYPE activepieces_sandbox_piece_memory_usage_bytes gauge',
            'activepieces_sandbox_piece_memory_usage_bytes{worker_id="w1",host="worker-\\"a\\"",box_id="1",piece="@activepieces/piece-slack",version="0.9.1"} 120',
            '# HELP activepieces_sandbox_memory_limit_bytes Configured AP_SANDBOX_MEMORY_LIMIT for each sandbox on the worker. It caps the V8 heap only, not activepieces_sandbox_memory_usage_bytes',
            '# TYPE activepieces_sandbox_memory_limit_bytes gauge',
            'activepieces_sandbox_memory_limit_bytes{worker_id="w1",host="worker-\\"a\\""} 1073741824',
            '',
        ].join('\n'))
    })

    it('omits metrics that have no samples', () => {
        const output = sandboxPrometheusMetrics.format({
            workers: [fakeWorker({ workerId: 'w1', memoryLimitKb: undefined, sandboxes: [] })],
        })

        expect(output).toBe('\n')
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
