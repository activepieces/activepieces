import { WorkerGroupScope } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { workerGroupQueues } from '../../../../../src/app/workers/worker-groups/worker-group-queues'

describe('workerGroupQueues.parseWorkerGroupValue', () => {
    it('returns null when no group id is set', () => {
        expect(workerGroupQueues.parseWorkerGroupValue({ value: undefined, scope: WorkerGroupScope.PROJECT })).toBeNull()
        expect(workerGroupQueues.parseWorkerGroupValue({ value: '', scope: WorkerGroupScope.FLOW })).toBeNull()
    })

    it('returns an assignment carrying the given scope', () => {
        expect(workerGroupQueues.parseWorkerGroupValue({ value: 'g1', scope: WorkerGroupScope.FLOW })).toEqual({ scope: WorkerGroupScope.FLOW, id: 'g1' })
        expect(workerGroupQueues.parseWorkerGroupValue({ value: 'g1', scope: WorkerGroupScope.PLATFORM })).toEqual({ scope: WorkerGroupScope.PLATFORM, id: 'g1' })
    })
})

describe('workerGroupQueues.resolveScope', () => {
    it('uses the explicit scope when valid', () => {
        expect(workerGroupQueues.resolveScope({ projectWorker: true, scope: 'flow' })).toBe(WorkerGroupScope.FLOW)
        expect(workerGroupQueues.resolveScope({ projectWorker: true, scope: 'platform' })).toBe(WorkerGroupScope.PLATFORM)
        expect(workerGroupQueues.resolveScope({ projectWorker: false, scope: 'project' })).toBe(WorkerGroupScope.PROJECT)
    })

    it('falls back to the projectWorker flag when the scope is missing or invalid', () => {
        expect(workerGroupQueues.resolveScope({ projectWorker: true, scope: undefined })).toBe(WorkerGroupScope.PROJECT)
        expect(workerGroupQueues.resolveScope({ projectWorker: false, scope: undefined })).toBe(WorkerGroupScope.PLATFORM)
        expect(workerGroupQueues.resolveScope({ projectWorker: true, scope: 'bogus' })).toBe(WorkerGroupScope.PROJECT)
    })
})

describe('workerGroupQueues.isRoutableWorkerGroupId', () => {
    it('rejects values no worker can ever claim', () => {
        expect(workerGroupQueues.isRoutableWorkerGroupId('')).toBe(false)
        expect(workerGroupQueues.isRoutableWorkerGroupId('__none__')).toBe(false)
    })

    it('accepts ordinary labels', () => {
        expect(workerGroupQueues.isRoutableWorkerGroupId('g1')).toBe(true)
        expect(workerGroupQueues.isRoutableWorkerGroupId('canary')).toBe(true)
    })
})
