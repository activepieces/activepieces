import { describe, expect, it } from 'vitest'
import { ExecutionType } from '../../src/lib/flow-run/execution/execution-output'
import { RunEnvironment } from '../../src/lib/flow-run/flow-run'
import { getDefaultJobPriority, JOB_PRIORITY, WorkerJobType } from '../../src/lib/workers/job-data'
import { ResumeReason, StreamStepProgress } from '../../src/lib/engine'

const baseJob = {
    projectId: 'project-id',
    platformId: 'platform-id',
    jobType: WorkerJobType.EXECUTE_FLOW as const,
    environment: RunEnvironment.PRODUCTION,
    schemaVersion: 1,
    flowId: 'flow-id',
    flowVersionId: 'flow-version-id',
    runId: 'run-id',
    payload: { type: 'inline' as const, value: {} },
    streamStepProgress: StreamStepProgress.NONE,
    logsFileId: 'logs-file-id',
    executionType: ExecutionType.BEGIN as const,
}

describe('getDefaultJobPriority', () => {
    it('demotes a fan-in child below an ordinary async run', () => {
        const child = getDefaultJobPriority({ ...baseJob, parentWaitpointId: 'waitpoint-id' })
        const ordinary = getDefaultJobPriority(baseJob)

        expect(JOB_PRIORITY[child]).toBeGreaterThan(JOB_PRIORITY[ordinary])
    })

    it('keeps a fan-in child above polling so triggers cannot starve', () => {
        const child = getDefaultJobPriority({ ...baseJob, parentWaitpointId: 'waitpoint-id' })

        expect(JOB_PRIORITY[child]).toBeLessThan(JOB_PRIORITY.veryLow)
    })

    it('leaves a resumed parent in the ordinary lane, ahead of its children', () => {
        const parentResume = getDefaultJobPriority({ ...baseJob, executionType: ExecutionType.RESUME, resumeReason: ResumeReason.WAITPOINT})
        const child = getDefaultJobPriority({ ...baseJob, parentWaitpointId: 'waitpoint-id' })

        expect(JOB_PRIORITY[parentResume]).toBeLessThan(JOB_PRIORITY[child])
    })
})
