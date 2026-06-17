import { RunEnvironment } from '../../../src/lib/automation/flow-run/flow-run'
import { getDefaultJobPriority, WorkerJobType } from '../../../src/lib/automation/workers/job-data'

const executeFlowJob = (priority?: 'critical' | 'lowest') => ({
    jobType: WorkerJobType.EXECUTE_FLOW,
    environment: RunEnvironment.PRODUCTION,
    synchronousHandlerId: null,
    priority,
}) as Parameters<typeof getDefaultJobPriority>[0]

const triggerHookJob = { jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK } as Parameters<typeof getDefaultJobPriority>[0]

describe('getDefaultJobPriority', () => {
    it('uses the priority carried in the job payload for flow execution jobs', () => {
        expect(getDefaultJobPriority(executeFlowJob('critical'))).toBe('critical')
        expect(getDefaultJobPriority(executeFlowJob('lowest'))).toBe('lowest')
    })

    it('falls back to the type-based default when no priority is set on the payload', () => {
        expect(getDefaultJobPriority(executeFlowJob())).toBe('medium')
    })

    it('keeps the type-based default for non-flow-execution jobs', () => {
        expect(getDefaultJobPriority(triggerHookJob)).toBe('critical')
    })
})
