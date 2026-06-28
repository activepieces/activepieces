import { beforeEach, describe, expect, it } from 'vitest'
import { jobAssignmentTracker } from '../../../../../src/app/workers/job-queue/job-assignment-tracker'

describe('jobAssignmentTracker', () => {
    beforeEach(() => {
        jobAssignmentTracker.reset()
    })

    it('returns a recorded job for its worker on takeByWorker', () => {
        jobAssignmentTracker.record({ workerId: 'w1', jobId: 'j1', token: 't1', queueName: 'q' })

        expect(jobAssignmentTracker.takeByWorker('w1')).toEqual([{ jobId: 'j1', token: 't1', queueName: 'q' }])
    })

    it('groups multiple in-flight jobs under the same worker', () => {
        jobAssignmentTracker.record({ workerId: 'w1', jobId: 'j1', token: 't1', queueName: 'q' })
        jobAssignmentTracker.record({ workerId: 'w1', jobId: 'j2', token: 't2', queueName: 'q' })

        const taken = jobAssignmentTracker.takeByWorker('w1')

        expect(taken).toHaveLength(2)
        expect(taken.map(t => t.jobId).sort()).toEqual(['j1', 'j2'])
    })

    it('does not return another worker\'s jobs', () => {
        jobAssignmentTracker.record({ workerId: 'w1', jobId: 'j1', token: 't1', queueName: 'q' })
        jobAssignmentTracker.record({ workerId: 'w2', jobId: 'j2', token: 't2', queueName: 'q' })

        expect(jobAssignmentTracker.takeByWorker('w1')).toEqual([{ jobId: 'j1', token: 't1', queueName: 'q' }])
        expect(jobAssignmentTracker.takeByWorker('w2')).toEqual([{ jobId: 'j2', token: 't2', queueName: 'q' }])
    })

    it('keeps the same job id in different queues separate (no token clobbering)', () => {
        jobAssignmentTracker.record({ workerId: 'w1', jobId: 'shared', token: 'tA', queueName: 'qA' })
        jobAssignmentTracker.record({ workerId: 'w2', jobId: 'shared', token: 'tB', queueName: 'qB' })

        // completing it in qA must not touch the qB assignment
        jobAssignmentTracker.clear({ jobId: 'shared', queueName: 'qA' })

        expect(jobAssignmentTracker.takeByWorker('w1')).toEqual([])
        expect(jobAssignmentTracker.takeByWorker('w2')).toEqual([{ jobId: 'shared', token: 'tB', queueName: 'qB' }])
    })

    it('cleared (completed) jobs are not returned on disconnect', () => {
        jobAssignmentTracker.record({ workerId: 'w1', jobId: 'j1', token: 't1', queueName: 'q' })
        jobAssignmentTracker.record({ workerId: 'w1', jobId: 'j2', token: 't2', queueName: 'q' })

        jobAssignmentTracker.clear({ jobId: 'j1', queueName: 'q' })

        expect(jobAssignmentTracker.takeByWorker('w1')).toEqual([{ jobId: 'j2', token: 't2', queueName: 'q' }])
    })

    it('takeByWorker is idempotent — a second call returns nothing', () => {
        jobAssignmentTracker.record({ workerId: 'w1', jobId: 'j1', token: 't1', queueName: 'q' })

        expect(jobAssignmentTracker.takeByWorker('w1')).toHaveLength(1)
        expect(jobAssignmentTracker.takeByWorker('w1')).toEqual([])
    })

    it('returns empty for an unknown worker', () => {
        expect(jobAssignmentTracker.takeByWorker('nope')).toEqual([])
    })

    it('clear on an unknown job is a no-op', () => {
        expect(() => jobAssignmentTracker.clear({ jobId: 'ghost', queueName: 'q' })).not.toThrow()
    })
})
