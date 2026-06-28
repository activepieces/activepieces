import { beforeEach, describe, expect, it } from 'vitest'
import { jobAssignmentTracker } from '../../../../../src/app/workers/job-queue/job-assignment-tracker'

describe('jobAssignmentTracker', () => {
    beforeEach(() => {
        jobAssignmentTracker.reset()
    })

    it('returns a recorded job for its connection on takeByConnection', () => {
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'j1', token: 't1', queueName: 'q' })

        expect(jobAssignmentTracker.takeByConnection('c1')).toEqual([{ jobId: 'j1', token: 't1', queueName: 'q' }])
    })

    it('groups multiple in-flight jobs under the same connection', () => {
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'j1', token: 't1', queueName: 'q' })
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'j2', token: 't2', queueName: 'q' })

        const taken = jobAssignmentTracker.takeByConnection('c1')

        expect(taken).toHaveLength(2)
        expect(taken.map(t => t.jobId).sort()).toEqual(['j1', 'j2'])
    })

    it('does not return another connection\'s jobs', () => {
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'j1', token: 't1', queueName: 'q' })
        jobAssignmentTracker.record({ connectionId: 'c2', jobId: 'j2', token: 't2', queueName: 'q' })

        expect(jobAssignmentTracker.takeByConnection('c1')).toEqual([{ jobId: 'j1', token: 't1', queueName: 'q' }])
        expect(jobAssignmentTracker.takeByConnection('c2')).toEqual([{ jobId: 'j2', token: 't2', queueName: 'q' }])
    })

    it('a stale socket disconnect does NOT reclaim the reconnected socket\'s jobs (same worker, new connection)', () => {
        // old socket c1 polled j1; worker reconnects as c2 and polls j2 before c1's disconnect fires.
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'j1', token: 't1', queueName: 'q' })
        jobAssignmentTracker.record({ connectionId: 'c2', jobId: 'j2', token: 't2', queueName: 'q' })

        // c1's late disconnect reclaims only j1 — j2 stays with the live connection c2.
        expect(jobAssignmentTracker.takeByConnection('c1')).toEqual([{ jobId: 'j1', token: 't1', queueName: 'q' }])
        expect(jobAssignmentTracker.takeByConnection('c2')).toEqual([{ jobId: 'j2', token: 't2', queueName: 'q' }])
    })

    it('keeps the same job id in different queues separate (no token clobbering)', () => {
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'shared', token: 'tA', queueName: 'qA' })
        jobAssignmentTracker.record({ connectionId: 'c2', jobId: 'shared', token: 'tB', queueName: 'qB' })

        jobAssignmentTracker.clear({ jobId: 'shared', queueName: 'qA' })

        expect(jobAssignmentTracker.takeByConnection('c1')).toEqual([])
        expect(jobAssignmentTracker.takeByConnection('c2')).toEqual([{ jobId: 'shared', token: 'tB', queueName: 'qB' }])
    })

    it('cleared (completed) jobs are not returned on disconnect', () => {
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'j1', token: 't1', queueName: 'q' })
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'j2', token: 't2', queueName: 'q' })

        jobAssignmentTracker.clear({ jobId: 'j1', queueName: 'q' })

        expect(jobAssignmentTracker.takeByConnection('c1')).toEqual([{ jobId: 'j2', token: 't2', queueName: 'q' }])
    })

    it('takeByConnection is idempotent — a second call returns nothing', () => {
        jobAssignmentTracker.record({ connectionId: 'c1', jobId: 'j1', token: 't1', queueName: 'q' })

        expect(jobAssignmentTracker.takeByConnection('c1')).toHaveLength(1)
        expect(jobAssignmentTracker.takeByConnection('c1')).toEqual([])
    })

    it('returns empty for an unknown connection', () => {
        expect(jobAssignmentTracker.takeByConnection('nope')).toEqual([])
    })

    it('clear on an unknown job is a no-op', () => {
        expect(() => jobAssignmentTracker.clear({ jobId: 'ghost', queueName: 'q' })).not.toThrow()
    })
})
