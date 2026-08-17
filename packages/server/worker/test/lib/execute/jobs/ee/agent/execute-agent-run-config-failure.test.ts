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

        await expect(executeAgentRunJob.execute(ctx, data)).rejects.toThrow('ENTITY_NOT_FOUND')

        expect(resumed).toHaveLength(1)
        expect(resumed[0].waitpointId).toBe('waitpoint-1')
        expect(JSON.stringify(resumed[0].output)).toContain('FAILED')
    })

    it('tells the chat client the turn failed instead of leaving it streaming', async () => {
        const { ctx, events } = buildContext()

        await expect(executeAgentRunJob.execute(ctx, buildJobData({ source: AgentRunSource.CHAT }))).rejects.toThrow('ENTITY_NOT_FOUND')

        expect(events.map((event) => event.type)).toEqual([AgentEventType.ERROR, AgentEventType.FINISHED])
    })

    it('completes the job when the platform is out of credits, so it is not retried or paged', async () => {
        const { ctx, events } = buildContext(new Error('You have run out of AI credits'))

        const result = await executeAgentRunJob.execute(ctx, buildJobData({ source: AgentRunSource.CHAT }))

        expect(result.status).toBe(EngineResponseStatus.OK)
        expect(events.map((event) => event.type)).toEqual([AgentEventType.ERROR, AgentEventType.FINISHED])
    })
})
