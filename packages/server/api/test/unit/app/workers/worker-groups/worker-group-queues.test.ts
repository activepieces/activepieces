import { WorkerGroupScope } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { workerGroupQueues } from '../../../../../src/app/workers/worker-groups/worker-group-queues'

describe('workerGroupQueues.parseWorkerGroupValue', () => {
    it('returns null when no group id is set', () => {
        expect(workerGroupQueues.parseWorkerGroupValue({ value: undefined, projectWorker: true, scope: undefined })).toBeNull()
        expect(workerGroupQueues.parseWorkerGroupValue({ value: '', projectWorker: false, scope: 'flow' })).toBeNull()
    })

    it('uses the explicit scope when valid', () => {
        expect(workerGroupQueues.parseWorkerGroupValue({ value: 'g1', projectWorker: true, scope: 'flow' })).toEqual({ scope: WorkerGroupScope.FLOW, id: 'g1' })
        expect(workerGroupQueues.parseWorkerGroupValue({ value: 'g1', projectWorker: true, scope: 'platform' })).toEqual({ scope: WorkerGroupScope.PLATFORM, id: 'g1' })
        expect(workerGroupQueues.parseWorkerGroupValue({ value: 'g1', projectWorker: false, scope: 'project' })).toEqual({ scope: WorkerGroupScope.PROJECT, id: 'g1' })
    })

    it('falls back to the projectWorker flag when the scope is missing or invalid', () => {
        expect(workerGroupQueues.parseWorkerGroupValue({ value: 'g1', projectWorker: true, scope: undefined })).toEqual({ scope: WorkerGroupScope.PROJECT, id: 'g1' })
        expect(workerGroupQueues.parseWorkerGroupValue({ value: 'g1', projectWorker: false, scope: undefined })).toEqual({ scope: WorkerGroupScope.PLATFORM, id: 'g1' })
        expect(workerGroupQueues.parseWorkerGroupValue({ value: 'g1', projectWorker: true, scope: 'bogus' })).toEqual({ scope: WorkerGroupScope.PROJECT, id: 'g1' })
    })
})
