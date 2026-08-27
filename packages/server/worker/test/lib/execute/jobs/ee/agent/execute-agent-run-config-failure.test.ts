import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { AgentEvent, AgentEventType, AgentRunSource, EngineResponseStatus, ExecuteAgentRunJobData, LATEST_JOB_DATA_SCHEMA_VERSION, WorkerJobType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { executeAgentRunJob } from '../../../../../../src/lib/execute/jobs/ee/agent/execute-agent-run'
import { JobContext } from '../../../../../../src/lib/execute/types'

const noopLogger = {
    child: () => noopLogger,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    trace: () => undefined,
    fatal: () => undefined,
}

function buildContext(configError?: Error) {
    const events: AgentEvent[] = []
    const resumed: { flowRunId: string, waitpointId: string, output: unknown }[] = []
    const apiClient = {
        getAgentConfig: () => Promise.reject(configError ?? new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: 'OPENAI', entityType: 'AIProvider' },
        })),
        resumeFlowStep: (input: { flowRunId: string, waitpointId: string, output: unknown }) => {
            resumed.push(input)
            return Promise.resolve()
        },
        saveAgentMessages: () => Promise.resolve(),
        sendAgentEvent: (input: { event: AgentEvent }) => {
            events.push(input.event)
            return Promise.resolve()
        },
    }
    const ctx = { apiClient, log: noopLogger } as unknown as JobContext
    return { ctx, events, resumed }
}

function buildJobData(overrides: Partial<ExecuteAgentRunJobData>): ExecuteAgentRunJobData {
    return {
        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
        jobType: WorkerJobType.EXECUTE_AGENT_RUN,
        conversationId: 'conv-1',
        runId: 'run-1',
        projectId: 'project-1',
        platformId: 'platform-1',
        userId: 'user-1',
        userMessage: 'do it',
        modelName: null,
        ...overrides,
    }
}

describe('executeAgentRunJob — a config failure must not swallow the turn', () => {
    it('releases the waiting flow step with the failure instead of leaving the run paused', async () => {
        const { ctx, resumed } = buildContext()
        const data = buildJobData({
            source: AgentRunSource.FLOW_STEP,
            flowRunId: 'flow-run-1',
            waitpointId: 'waitpoint-1',
        })

        const result = await executeAgentRunJob.execute(ctx, data)

        expect(result.status).toBe(EngineResponseStatus.USER_FAILURE)
        expect(resumed).toHaveLength(1)
        expect(resumed[0].waitpointId).toBe('waitpoint-1')
        expect(JSON.stringify(resumed[0].output)).toContain('FAILED')
        expect(resumed[0].output).toMatchObject({ failure: expect.stringContaining('ENTITY_NOT_FOUND') })
    })

    it('tells the chat client the turn failed instead of leaving it streaming', async () => {
        const { ctx, events } = buildContext()

        const result = await executeAgentRunJob.execute(ctx, buildJobData({ source: AgentRunSource.CHAT }))

        expect(result.status).toBe(EngineResponseStatus.USER_FAILURE)
        expect(events.map((event) => event.type)).toEqual([AgentEventType.ERROR, AgentEventType.FINISHED])
    })

    it('tells the client it was a billing failure, so the UI can offer a top-up', async () => {
        const { ctx, events } = buildContext(new Error('You have run out of AI credits'))

        const result = await executeAgentRunJob.execute(ctx, buildJobData({ source: AgentRunSource.CHAT }))

        expect(result.status).toBe(EngineResponseStatus.USER_FAILURE)
        expect(events[0]).toMatchObject({ type: AgentEventType.ERROR, data: { code: ErrorCode.QUOTA_EXCEEDED } })
    })

    it('still fails the job on an unrecognised error, so our own bugs are not laundered', async () => {
        const { ctx, events } = buildContext(new Error('Cannot read properties of undefined'))

        await expect(executeAgentRunJob.execute(ctx, buildJobData({ source: AgentRunSource.CHAT }))).rejects.toThrow('Cannot read properties of undefined')

        expect(events.map((event) => event.type)).toEqual([AgentEventType.ERROR, AgentEventType.FINISHED])
    })
})
