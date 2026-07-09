import { WorkerGroupScope } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { getPollQueueName, parseWorkerQueueValue, QueueName } from '../../../../../src/app/workers/job'

describe('parseWorkerQueueValue', () => {
    it('returns the sync queue for syncJobs', () => {
        expect(parseWorkerQueueValue({ value: 'syncJobs' })).toEqual({ queue: QueueName.SYNC_JOBS, invalidValue: null })
    })

    it('treats workerJobs as the default (no dedicated queue)', () => {
        expect(parseWorkerQueueValue({ value: 'workerJobs' })).toEqual({ queue: null, invalidValue: null })
    })

    it('treats undefined and empty values as the default', () => {
        expect(parseWorkerQueueValue({ value: undefined })).toEqual({ queue: null, invalidValue: null })
        expect(parseWorkerQueueValue({ value: '' })).toEqual({ queue: null, invalidValue: null })
    })

    it('rejects the internal runsMetadata queue', () => {
        expect(parseWorkerQueueValue({ value: 'runsMetadata' })).toEqual({ queue: null, invalidValue: 'runsMetadata' })
    })

    it('surfaces typos as invalid instead of subscribing to a dead queue', () => {
        expect(parseWorkerQueueValue({ value: 'sync-jobs' })).toEqual({ queue: null, invalidValue: 'sync-jobs' })
        expect(parseWorkerQueueValue({ value: 'platform-foo-jobs' })).toEqual({ queue: null, invalidValue: 'platform-foo-jobs' })
    })
})

describe('getPollQueueName', () => {
    it('polls the shared queue by default', () => {
        expect(getPollQueueName({ assignment: null, workerQueue: null })).toBe(QueueName.WORKER_JOBS)
    })

    it('polls the sync queue when the worker subscribed to it', () => {
        expect(getPollQueueName({ assignment: null, workerQueue: QueueName.SYNC_JOBS })).toBe(QueueName.SYNC_JOBS)
    })

    it('prefers the worker group queue over the class queue', () => {
        expect(getPollQueueName({
            assignment: { scope: WorkerGroupScope.PROJECT, id: 'pool-a' },
            workerQueue: QueueName.SYNC_JOBS,
        })).toBe('project-pool-a-jobs')
        expect(getPollQueueName({
            assignment: { scope: WorkerGroupScope.PLATFORM, id: 'plat-1' },
            workerQueue: null,
        })).toBe('platform-plat-1-jobs')
    })
})
