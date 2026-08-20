import { AgentRunSource, WorkerJobType } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { UNATTENDED_WEB_TOOLS } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-tool-policy'
import { stepResultFrom } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-step-result'
import { executeAgentRunJob } from '../../../../../../src/lib/execute/jobs/ee/agent/execute-agent-run'
import { decideLoopAction, runAgentTurn, shouldRetryStream } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

vi.mock('../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn')>()
    return { ...actual, runAgentTurn: vi.fn() }
})

vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...actual,
        agentAiUtils: {
            ...actual.agentAiUtils,
            createChatModel: vi.fn(() => ({}) as never),
            supportsWebSearch: () => false,
        },
    }
})

describe('decideLoopAction', () => {
    it('finishes when a normal step produced visible output', () => {
        expect(decideLoopAction({ finishReason: 'stop', producedVisibleOutput: true, continuations: 0, emptyContinuations: 0 })).toBe('finish')
        expect(decideLoopAction({ finishReason: 'tool-calls', producedVisibleOutput: true, continuations: 0, emptyContinuations: 0 })).toBe('finish')
    })

    it('nudges (continue_empty) when a step produced no visible output, within the cap', () => {
        expect(decideLoopAction({ finishReason: 'stop', producedVisibleOutput: false, continuations: 0, emptyContinuations: 0 })).toBe('continue_empty')
        expect(decideLoopAction({ finishReason: 'stop', producedVisibleOutput: false, continuations: 0, emptyContinuations: 1 })).toBe('continue_empty')
    })

    it('stops nudging empty steps once the empty cap is reached', () => {
        expect(decideLoopAction({ finishReason: 'stop', producedVisibleOutput: false, continuations: 0, emptyContinuations: 2 })).toBe('finish')
    })

    it('auto-continues on truncation until the truncation cap', () => {
        expect(decideLoopAction({ finishReason: 'length', producedVisibleOutput: false, continuations: 0, emptyContinuations: 0 })).toBe('continue_truncation')
        expect(decideLoopAction({ finishReason: 'length', producedVisibleOutput: true, continuations: 2, emptyContinuations: 0 })).toBe('continue_truncation')
    })

    it('finishes once the truncation cap is reached', () => {
        expect(decideLoopAction({ finishReason: 'length', producedVisibleOutput: false, continuations: 3, emptyContinuations: 0 })).toBe('finish')
    })

    it('treats truncation as higher priority than emptiness', () => {
        expect(decideLoopAction({ finishReason: 'length', producedVisibleOutput: false, continuations: 0, emptyContinuations: 2 })).toBe('continue_truncation')
    })
})

describe('shouldRetryStream', () => {
    it('retries once when the stream fails before any visible output', () => {
        expect(shouldRetryStream({ producedVisibleOutput: false, streamRetries: 0 })).toBe(true)
    })

    it('does not retry after the single retry has been used', () => {
        expect(shouldRetryStream({ producedVisibleOutput: false, streamRetries: 1 })).toBe(false)
    })

    it('never retries once visible output was already streamed (avoids duplicate content)', () => {
        expect(shouldRetryStream({ producedVisibleOutput: true, streamRetries: 0 })).toBe(false)
    })
})

describe('stepResultFrom', () => {
    const text = (value: string) => ({ type: 'text' as const, text: value })
    const at = '2026-08-05T00:00:00.000Z'

    it('projects the transcript into the step blocks the run viewer reads', () => {
        const result = stepResultFrom({ tools: [], prompt: 'do it', uiParts: [text('done')], timestamp: at })

        expect(result.status).toBe('COMPLETED')
        expect(result.prompt).toBe('do it')
        expect(result.steps).toEqual([{ type: 'MARKDOWN', markdown: 'done' }])
    })

    it('keeps the partial answer when the turn did not finish, and says it failed', () => {
        const result = stepResultFrom({ tools: [], prompt: 'do it', uiParts: [text('half')], timestamp: at, failure: 'ran out of room' })

        expect(result.status).toBe('FAILED')
        expect(result.steps).toHaveLength(2)
    })

    it('drops empty text so a blank block never reaches the flow', () => {
        const result = stepResultFrom({ tools: [], prompt: 'do it', uiParts: [text('   ')], timestamp: at })

        expect(result.steps).toEqual([])
    })

    it('drops the steps that would push the result past what a resume payload should carry', () => {
        const many = Array.from({ length: 40 }, () => text('x'.repeat(10_000)))

        const result = stepResultFrom({ tools: [], prompt: 'do it', uiParts: many, timestamp: at })

        expect(result.steps.length).toBeLessThan(many.length)
        expect(JSON.stringify(result.steps.at(-1))).toContain('not shown here')
    })
})

describe('stepResultFrom — token usage reaches the persisted output', () => {
    const text = (value: string) => ({ type: 'text' as const, text: value })
    const at = '2026-08-05T00:00:00.000Z'
    const usage = {
        version: 1 as const,
        calls: [{ provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', inputTokens: 100, outputTokens: 20 }],
        totals: { inputTokens: 100, outputTokens: 20 },
    }

    it('embeds the usage report on a completed run', () => {
        const result = stepResultFrom({ tools: [], prompt: 'do it', uiParts: [text('done')], timestamp: at, usage })
        expect(result.usage).toEqual(usage)
    })

    it('embeds the usage report on a failed run — those tokens were billed too', () => {
        const result = stepResultFrom({ tools: [], prompt: 'do it', uiParts: [text('half')], timestamp: at, failure: 'ran out of room', usage })
        expect(result.usage).toEqual(usage)
    })

    it('omits the field entirely when no usage was collected', () => {
        const result = stepResultFrom({ tools: [], prompt: 'do it', uiParts: [text('done')], timestamp: at })
        expect('usage' in result).toBe(false)
    })
})

describe('stepResultFrom — a failed tool call must not read as success', () => {
    const at = '2026-08-05T00:00:00.000Z'
    const failedCall = {
        type: 'tool-call' as const,
        toolCallId: 'call-1',
        toolName: 'send_email',
        input: { to: 'a@b.c' },
        status: 'error' as const,
        errorText: 'mailbox full',
    }

    it('marks the whole result failed when any tool call errored', () => {
        const result = stepResultFrom({ tools: [], prompt: 'send it', uiParts: [failedCall], timestamp: at })

        expect(result.status).toBe('FAILED')
    })

    it('carries the error text so a later step can see what went wrong', () => {
        const result = stepResultFrom({ tools: [], prompt: 'send it', uiParts: [failedCall], timestamp: at })

        expect(JSON.stringify(result.steps[0])).toContain('mailbox full')
    })
})

describe('stepResultFrom — a configured action keeps its identity in the run viewer', () => {
    const at = '2026-08-06T00:00:00.000Z'
    const call = {
        type: 'tool-call' as const,
        toolCallId: 'call-1',
        toolName: 'send_email',
        input: {},
        status: 'completed' as const,
    }
    const tools = [{
        type: 'PIECE' as const,
        toolName: 'send_email',
        pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' },
    }]

    it('projects a configured call as a piece, so the timeline shows the action not a bare name', () => {
        const result = stepResultFrom({ prompt: 'send it', uiParts: [call], timestamp: at, tools })

        expect(result.steps[0]).toMatchObject({ toolCallType: 'PIECE', pieceName: '@activepieces/piece-gmail', actionName: 'send_email' })
    })

    it('falls back to unknown for a call that was not one of the configured tools', () => {
        const result = stepResultFrom({ prompt: 'send it', uiParts: [{ ...call, toolName: 'ap_web_search' }], timestamp: at, tools })

        expect(result.steps[0]).toMatchObject({ toolCallType: 'UNKNOWN' })
    })
})

describe('stepResultFrom — structured output reaches the flow', () => {
    const at = '2026-08-07T00:00:00.000Z'

    it('carries the structured result the agent reported', () => {
        const result = stepResultFrom({ prompt: 'summarise', uiParts: [], timestamp: at, tools: [], structuredOutput: { sentiment: 'positive', score: 8 } })

        expect(result.structuredOutput).toEqual({ sentiment: 'positive', score: 8 })
    })

    it('carries it even when the run failed, so a later step is not left guessing', () => {
        const result = stepResultFrom({ prompt: 'summarise', uiParts: [], timestamp: at, tools: [], structuredOutput: { score: 1 }, failure: 'ran out of room' })

        expect(result.structuredOutput).toEqual({ score: 1 })
        expect(result.status).toBe('FAILED')
    })

    it('omits the key entirely when the step configured no fields', () => {
        const result = stepResultFrom({ prompt: 'summarise', uiParts: [], timestamp: at, tools: [] })

        expect(result).not.toHaveProperty('structuredOutput')
    })
})

describe('stepResultFrom — a partial transcript is not a finished one', () => {
    it('reports in progress while the run is still going, so the timeline does not say Done', () => {
        const result = stepResultFrom({ tools: [], prompt: 'do it', uiParts: [], timestamp: '2026-08-07T00:00:00.000Z', stillRunning: true })

        expect(result.status).toBe('IN_PROGRESS')
    })
})

describe('executeAgentRunJob — a stream error must not drop the billed usage', () => {
    const expectedUsage = {
        version: 1 as const,
        calls: [{ provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', inputTokens: 100, outputTokens: 20 }],
        totals: { inputTokens: 100, outputTokens: 20 },
        incomplete: true,
    }

    const makeCtx = () => {
        const log: Record<string, ReturnType<typeof vi.fn>> = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
        log.child = vi.fn(() => log)
        const apiClient = {
            getAgentConfig: vi.fn().mockResolvedValue({
                provider: 'anthropic',
                auth: {},
                providerConfig: {},
                modelId: 'claude-sonnet-4-5-20250929',
                fastModelId: 'claude-haiku-4-5',
                systemPrompt: 'system',
                messages: [],
                allMessages: [],
                previousUiMessages: [],
                tier: { id: 'standard', thinkingBudget: 0, modelId: 'claude-sonnet-4-5-20250929' },
                mcpCredentials: null,
                projects: [],
                guides: {},
                aiTools: {},
                emailEnabled: false,
                userEmail: 'user@example.com',
                source: AgentRunSource.FLOW_STEP,
            }),
            sendAgentEvent: vi.fn().mockResolvedValue(undefined),
            heartbeatAgentConversation: vi.fn().mockResolvedValue(undefined),
            executeAgentTool: vi.fn().mockResolvedValue({ result: null }),
            saveAgentMessages: vi.fn().mockResolvedValue(undefined),
            updateAgentProgress: vi.fn().mockResolvedValue(undefined),
            updateFlowStepProgress: vi.fn().mockResolvedValue(undefined),
            resumeFlowStep: vi.fn().mockResolvedValue(undefined),
            updateProjectContext: vi.fn().mockResolvedValue(undefined),
        }
        const ctx = { apiClient, log } as unknown as Parameters<typeof executeAgentRunJob.execute>[0]
        return { ctx, apiClient }
    }

    const jobData = {
        schemaVersion: 1,
        jobType: WorkerJobType.EXECUTE_AGENT_RUN,
        conversationId: 'conv-1',
        runId: 'run-1',
        projectId: null,
        platformId: 'platform-1',
        userId: 'user-1',
        userMessage: 'do the thing',
        source: AgentRunSource.FLOW_STEP,
        flowRunId: 'flow-run-1',
        waitpointId: 'waitpoint-1',
        modelName: null,
    } as Parameters<typeof executeAgentRunJob.execute>[1]

    it('embeds the collected usage in the failed step output handed back to the flow', async () => {
        vi.mocked(runAgentTurn).mockImplementation(async (params) => {
            params.usageCollector.record({
                provider: 'anthropic',
                model: 'claude-sonnet-4-5-20250929',
                usage: { inputTokens: 100, outputTokens: 20 },
            })
            params.usageCollector.markIncomplete()
            return {
                accumulatedResponseMessages: [],
                uiParts: [],
                usage: undefined,
                finishReason: 'error',
                truncatedAfterRetries: false,
                budgetExceeded: false,
                streamError: new Error('the provider dropped the stream'),
                continuations: 0,
                totalInputTokens: 100,
                totalOutputTokens: 20,
                toolCalls: [],
            }
        })
        const { ctx, apiClient } = makeCtx()

        await expect(executeAgentRunJob.execute(ctx, jobData)).rejects.toThrow('the provider dropped the stream')

        expect(apiClient.resumeFlowStep).toHaveBeenCalledTimes(1)
        const { output } = apiClient.resumeFlowStep.mock.calls[0][0] as { output: { status: string, usage?: unknown } }
        expect(output.status).toBe('FAILED')
        expect(output.usage).toEqual(expectedUsage)
    })

    it('keeps usage recorded before runAgentTurn threw, flagged incomplete (the collector outlives the turn)', async () => {
        vi.mocked(runAgentTurn).mockImplementation(async (params) => {
            params.usageCollector.record({
                provider: 'anthropic',
                model: 'claude-sonnet-4-5-20250929',
                usage: { inputTokens: 100, outputTokens: 20 },
            })
            throw new Error('drainStream exploded mid-step')
        })
        const { ctx, apiClient } = makeCtx()

        await expect(executeAgentRunJob.execute(ctx, jobData)).rejects.toThrow('drainStream exploded mid-step')

        expect(apiClient.resumeFlowStep).toHaveBeenCalledTimes(1)
        const { output } = apiClient.resumeFlowStep.mock.calls[0][0] as { output: { status: string, usage?: { totals: unknown, incomplete?: boolean } } }
        expect(output.status).toBe('FAILED')
        expect(output.usage).toEqual({
            version: 1,
            calls: [{ provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', inputTokens: 100, outputTokens: 20 }],
            totals: { inputTokens: 100, outputTokens: 20 },
            incomplete: true,
        })
    })
})

describe('UNATTENDED_WEB_TOOLS — the unattended set is listed, not subtracted', () => {
    it('names only tools that need nobody present', () => {
        expect(UNATTENDED_WEB_TOOLS).toEqual(['ap_fetch_url', 'ap_web_search', 'ap_scrape_url'])
    })

    it('excludes every tool that asks the user something', () => {
        for (const chatTool of ['ap_show_connection_picker', 'ap_show_quick_replies', 'ap_discover_action_auth', 'ap_load_guide', 'ap_execute_action', 'ap_run_code', 'ap_explore_data', 'ap_list_across_projects']) {
            expect(UNATTENDED_WEB_TOOLS).not.toContain(chatTool)
        }
    })
})
