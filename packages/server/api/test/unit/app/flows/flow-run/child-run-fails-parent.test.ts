import { FlowRunStatus } from '@activepieces/shared'
import { childRunFailsParent } from '../../../../../src/app/flows/flow-run/flow-runs-queue'

describe('childRunFailsParent', () => {
    it('does not fail the parent while the child job still owes an attempt', () => {
        expect(childRunFailsParent({
            status: FlowRunStatus.INTERNAL_ERROR,
            failParentOnFailure: true,
            willRetry: true,
        })).toBe(false)
    })

    it('fails the parent once the child job has exhausted its attempts', () => {
        expect(childRunFailsParent({
            status: FlowRunStatus.INTERNAL_ERROR,
            failParentOnFailure: true,
            willRetry: false,
        })).toBe(true)
    })

    it('fails the parent when the report carries no retry information', () => {
        expect(childRunFailsParent({
            status: FlowRunStatus.INTERNAL_ERROR,
            failParentOnFailure: true,
        })).toBe(true)
    })

    it.each([
        FlowRunStatus.FAILED,
        FlowRunStatus.CANCELED,
    ])('fails the parent on terminal %s even if a stale retry flag is set', (status) => {
        expect(childRunFailsParent({ status, failParentOnFailure: true, willRetry: true })).toBe(true)
    })

    it.each([
        FlowRunStatus.SUCCEEDED,
        FlowRunStatus.RUNNING,
        FlowRunStatus.PAUSED,
        FlowRunStatus.QUEUED,
    ])('leaves the parent alone while the child is %s', (status) => {
        expect(childRunFailsParent({ status, failParentOnFailure: true, willRetry: false })).toBe(false)
    })

    it('leaves the parent alone when the child is not linked to it', () => {
        expect(childRunFailsParent({
            status: FlowRunStatus.INTERNAL_ERROR,
            failParentOnFailure: false,
            willRetry: false,
        })).toBe(false)
    })
})
