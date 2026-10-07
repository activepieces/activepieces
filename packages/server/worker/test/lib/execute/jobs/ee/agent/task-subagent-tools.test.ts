import { AIProviderName } from '@activepieces/core-utils'
import { PersistedAgentPartType, PersistedToolCallStatus, TASK_COMPLETION_TOOL_NAME } from '@activepieces/shared'
import { tool, ToolExecutionOptions, ToolSet } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const runAgentTurn = vi.fn()
vi.mock('../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn', () => ({
    runAgentTurn: (...args: unknown[]) => runAgentTurn(...args),
}))

import { RunAgentTurnParams } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'
import { createTaskSubagentTools } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/task-subagent-tools'
import { taskContext } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/task-context'

describe('createTaskSubagentTools', () => {
    beforeEach(() => {
        runAgentTurn.mockReset()
        emitSubagentProgress.mockReset()
        beginTask.mockReset()
        finishTask.mockReset()
        beginTask.mockResolvedValue({ taskId: 'task-1', claimId: 'claim-1', messages: [] })
        finishTask.mockResolvedValue(undefined)
    })

    it('runs the goal with every tool except the user-facing ones, inside the task context', async () => {
        let titleDuringRun: string | undefined
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            titleDuringRun = taskContext.currentTitle()
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Built it.', artifacts: [{ type: 'flow', id: 'f1', name: 'Save order' }] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow', 'ap_web_search', 'ap_execute_action', 'ap_show_questions', 'ap_show_quick_replies', 'ap_remember', 'ap_set_build_plan', 'ap_test_flow', 'ap_lock_and_publish']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Build Save order', brief: 'Build the Save order flow' }, EXECUTION_OPTIONS)

        const params = runAgentTurn.mock.calls[0][0]
        expect(Object.keys(params.tools).sort()).toEqual(['ap_build_flow', 'ap_execute_action', 'ap_set_phase', 'ap_web_search', TASK_COMPLETION_TOOL_NAME].sort())
        expect(params.allToolNames).toContain(TASK_COMPLETION_TOOL_NAME)
        expect(params.systemPrompt).toBe('TASK PROMPT')
        expect(params.phaseState).toEqual({ phase: 'build' })
        expect(params.messages).toEqual([{ role: 'user', content: 'Build the Save order flow' }])
        expect(titleDuringRun).toBe('Build Save order')
        expect(result).toMatchObject({ taskId: 'task-1', status: 'done', summary: 'Built it.', artifacts: [{ type: 'flow', id: 'f1', name: 'Save order' }], billedToolCalls: [{ toolName: 'ap_web_search', output: {} }] })
        expect(finishTask).toHaveBeenCalledWith(expect.objectContaining({ taskId: 'task-1', claimId: 'claim-1', status: 'DONE', summary: 'Built it.', messages: [{ role: 'user', content: 'Build the Save order flow' }, { role: 'assistant', content: 'ok' }] }))
    })

    it('resumes an earlier task with its history, and shows its own status line live', async () => {
        beginTask.mockResolvedValue({ taskId: 'task-1', claimId: 'claim-1', messages: [{ role: 'user', content: 'first brief' }, { role: 'assistant', content: 'blocked' }] })
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet, sinks: { onProgress: (progress: { uiParts: unknown[] }) => void } }) => {
            params.sinks.onProgress({ uiParts: [{ type: PersistedAgentPartType.THINKING_STATUS, text: 'Checking the Gmail connection' }] })
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'blocked', summary: 'Gmail is not connected.', artifacts: [], needs: 'A Gmail connection' }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Build Save order', brief: 'Gmail is connected now', taskId: 'task-1' }, EXECUTION_OPTIONS)

        expect(beginTask).toHaveBeenCalledWith({ title: 'Build Save order', taskId: 'task-1' })
        expect(runAgentTurn.mock.calls[0][0].messages).toEqual([{ role: 'user', content: 'first brief' }, { role: 'assistant', content: 'blocked' }, { role: 'user', content: 'Gmail is connected now' }])
        expect(emitSubagentProgress.mock.calls.map(([event]) => event.data.statusLine)).toContain('Checking the Gmail connection')
        expect(result).toMatchObject({ status: 'blocked', needs: 'A Gmail connection' })
        expect(finishTask).toHaveBeenCalledWith(expect.objectContaining({ status: 'BLOCKED' }))
    })

    it('switches its own phase, never the main chat\'s', async () => {
        const mainPhase = { phase: 'build' }
        const mainSetPhase = tool({ description: 'main', inputSchema: z.object({ phase: z.string() }), execute: async ({ phase }) => {
            mainPhase.phase = phase
            return 'ok'
        } })
        let taskPhase: string | undefined
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet, phaseState: { phase: string } }) => {
            await params.tools['ap_set_phase'].execute?.({ phase: 'discovery' }, EXECUTION_OPTIONS)
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Built.', artifacts: [] }, EXECUTION_OPTIONS)
            taskPhase = params.phaseState.phase
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: { ...toolSet(['ap_build_flow']), ap_set_phase: mainSetPhase } })

        await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        expect(taskPhase).toBe('discovery')
        expect(mainPhase.phase).toBe('build')
    })

    it('sends the growing timeline with every live update', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet, sinks: { onProgress: (progress: { uiParts: unknown[] }) => void } }) => {
            const first = { type: PersistedAgentPartType.THINKING_STATUS, text: 'Looking at your Leads table' }
            params.sinks.onProgress({ uiParts: [first] })
            params.sinks.onProgress({ uiParts: [first, { type: PersistedAgentPartType.THINKING_STATUS, text: 'Checking the flow works' }] })
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Built.', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        const running = emitSubagentProgress.mock.calls.map(([event]) => event.data).filter((data) => data.status === 'running' && (data.timeline ?? []).length > 0)
        expect(running.map((data) => data.timeline)).toEqual([
            [{ kind: 'status', text: 'Looking at your Leads table' }],
            [{ kind: 'status', text: 'Looking at your Leads table' }, { kind: 'status', text: 'Checking the flow works' }],
        ])
    })

    it('streams its searches and page reads in order', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Found it.', artifacts: [] }, EXECUTION_OPTIONS)
            return reportedTurn()
        })
        const reportedTurn = (): Record<string, unknown> => ({
            ...turnResult(),
            uiParts: [
                { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 's1', toolName: 'ap_web_search', input: { query: 'blue bottle' }, status: PersistedToolCallStatus.COMPLETED, output: { results: [{ title: 'Blue Bottle plans', url: 'https://bluebottle.com/plans' }, { title: 'Reddit thread', url: 'https://reddit.com/r/coffee/1' }] } },
                { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'f1', toolName: 'ap_fetch_url', input: { url: 'https://bluebottle.com/plans' }, status: PersistedToolCallStatus.COMPLETED, output: { url: 'https://bluebottle.com/plans', content: 'Plans and pricing' } },
            ],
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ activity: { timeline: [
            { kind: 'search', query: 'blue bottle', results: [{ url: 'https://bluebottle.com/plans', title: 'Blue Bottle plans' }, { url: 'https://reddit.com/r/coffee/1', title: 'Reddit thread' }] },
            { kind: 'read', url: 'https://bluebottle.com/plans', title: 'Blue Bottle plans' },
        ] } })
    })

    it('keeps the links of a search too large to return in full', async () => {
        const truncated = JSON.stringify({ query: 'pricing', results: [{ title: 'Plans', url: 'https://ok.com/plans' }] })
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Found it.', artifacts: [] }, EXECUTION_OPTIONS)
            return {
                ...turnResult(),
                uiParts: [
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 's1', toolName: 'ap_web_search', input: { query: 'pricing' }, status: PersistedToolCallStatus.COMPLETED, output: { content: [{ type: 'text', text: `[LARGE RESPONSE — long values were truncated to fit, structure preserved] The full response was 80KB.\n\n${truncated}` }] } },
                ],
            }
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ activity: { timeline: [{ kind: 'search', query: 'pricing', results: [{ url: 'https://ok.com/plans', title: 'Plans' }] }] } })
    })

    it('keeps reporting progress when a search or page read failed with no output', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet, sinks: { onProgress: (progress: { uiParts: unknown[] }) => void } }) => {
            const failed = [
                { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 's1', toolName: 'ap_web_search', input: { query: 'pricing' }, status: PersistedToolCallStatus.ERROR, output: undefined },
                { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'f1', toolName: 'ap_fetch_url', input: { url: 'https://down.com' }, status: PersistedToolCallStatus.COMPLETED, output: undefined },
            ]
            params.sinks.onProgress({ uiParts: failed })
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Recovered.', artifacts: [] }, EXECUTION_OPTIONS)
            return { ...turnResult(), uiParts: failed }
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ status: 'done', activity: { timeline: [{ kind: 'search', query: 'pricing', results: [] }] } })
    })

    it('counts only pages that were actually read', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Found it.', artifacts: [] }, EXECUTION_OPTIONS)
            return {
                ...turnResult(),
                uiParts: [
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'f1', toolName: 'ap_fetch_url', input: { url: 'https://ok.com' }, status: PersistedToolCallStatus.COMPLETED, output: { url: 'https://ok.com', content: 'Pricing' } },
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'f2', toolName: 'ap_fetch_url', input: { url: 'https://down.com' }, status: PersistedToolCallStatus.COMPLETED, output: { content: [{ type: 'text', text: 'Failed to fetch https://down.com: timeout' }] } },
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'f3', toolName: 'ap_scrape_url', input: { url: 'https://broken.com' }, status: PersistedToolCallStatus.ERROR, output: null },
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'f4', toolName: 'ap_scrape_url', input: { url: 'https://big.com' }, status: PersistedToolCallStatus.COMPLETED, output: { content: [{ type: 'text', text: '[LARGE RESPONSE — long values were truncated to fit, structure preserved] {}' }] } },
                ],
            }
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ activity: { timeline: [{ kind: 'read', url: 'https://ok.com' }, { kind: 'read', url: 'https://big.com' }] } })
    })

    it('keeps the card details out of what the main model reads', async () => {
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        const view = await tasks['ap_run_task'].toModelOutput?.({ toolCallId: 'call-1', input: { title: 't', brief: 'b' }, output: { taskId: 'task-1', status: 'done', summary: 'ok', artifacts: [], activity: { steps: [] }, billedToolCalls: [] } })

        expect(view).toEqual({ type: 'text', value: JSON.stringify({ taskId: 'task-1', status: 'done', summary: 'ok', artifacts: [] }) })
    })

    it('asks a task that stopped without reporting for its result, with only the report tool', async () => {
        runAgentTurn
            .mockResolvedValueOnce(turnResult())
            .mockImplementationOnce(async (params: { tools: ToolSet }) => {
                await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Asana costs $13.49 a seat.', artifacts: [] }, EXECUTION_OPTIONS)
                return turnResult()
            })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research Asana', brief: 'Find pricing' }, EXECUTION_OPTIONS)

        const reportParams = runAgentTurn.mock.calls[1][0]
        expect(Object.keys(reportParams.tools)).toEqual([TASK_COMPLETION_TOOL_NAME])
        expect(reportParams.stepCeiling).toBe(1)
        expect(result).toMatchObject({ status: 'done', summary: 'Asana costs $13.49 a seat.' })
    })

    it('picks up where it was cut off and finishes in the same task', async () => {
        runAgentTurn
            .mockResolvedValueOnce({ ...turnResult(), streamError: new Error('stream dropped') })
            .mockImplementationOnce(async (params: { tools: ToolSet }) => {
                await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Done after the drop.', artifacts: [] }, EXECUTION_OPTIONS)
                return turnResult()
            })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(runAgentTurn).toHaveBeenCalledTimes(2)
        expect(runAgentTurn.mock.calls[1][0].messages.at(-1)).toMatchObject({ role: 'user' })
        expect(result).toMatchObject({ status: 'done', summary: 'Done after the drop.' })
    })

    it('carries the paid calls made before a cut-off into the continued turn', async () => {
        runAgentTurn
            .mockResolvedValueOnce({ ...turnResult(), streamError: new Error('stream dropped') })
            .mockImplementationOnce(async (params: { tools: ToolSet }) => {
                await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
                return turnResult()
            })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(runAgentTurn.mock.calls[1][0].priorToolCalls).toEqual([{ toolName: 'ap_web_search', output: {} }])
    })

    it('keeps the steps from before a cut-off in its live progress', async () => {
        runAgentTurn
            .mockResolvedValueOnce({ ...turnResult(), streamError: new Error('stream dropped') })
            .mockImplementationOnce(async (params: { tools: ToolSet, sinks: { onProgress: (progress: { uiParts: unknown[] }) => void } }) => {
                params.sinks.onProgress({ uiParts: [{ type: PersistedAgentPartType.THINKING_STATUS, text: 'Writing the summary' }] })
                await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
                return turnResult()
            })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        const lines = emitSubagentProgress.mock.calls.map(([event]) => event.data.statusLine)
        expect(lines).toContain('Writing the summary')
        const continued = emitSubagentProgress.mock.calls.find(([event]) => event.data.statusLine === 'Writing the summary')
        expect(continued?.[0].data.stepCount).toBe(1)
    })

    it('stops retrying an interrupted task after its budget of continuations', async () => {
        runAgentTurn.mockResolvedValue({ ...turnResult(), streamError: new Error('stream dropped') })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(runAgentTurn).toHaveBeenCalledTimes(3)
        expect(result).toMatchObject({ status: 'failed' })
    })

    it('marks a task that stopped without reporting as failed', async () => {
        runAgentTurn.mockResolvedValue(turnResult())
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ status: 'failed' })
        expect(finishTask).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }))
    })

    it('reports a task that could not start, such as one still running', async () => {
        beginTask.mockRejectedValue(new Error('Task task-1 does not exist in this conversation or is still running'))
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Again', taskId: 'task-1' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ status: 'failed', summary: expect.stringContaining('still running') })
        expect(runAgentTurn).not.toHaveBeenCalled()
    })

    it('researches every subject in its own task, in parallel, with its own live card', async () => {
        beginTask.mockImplementation(async ({ title }: { title: string }) => ({ taskId: `task-${title}`, claimId: `claim-${title}`, messages: [] }))
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet, messages: { content: string }[] }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: `Brief for ${params.messages[0].content.split('Subject: ')[1]}`, artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_deep_research'].execute?.({ question: 'Pricing for 12 seats', subjects: ['Asana', 'ClickUp'] }, EXECUTION_OPTIONS)

        expect(runAgentTurn).toHaveBeenCalledTimes(2)
        expect(Object.keys(runAgentTurn.mock.calls[0][0].tools)).not.toContain('ap_deep_research')
        expect(new Set(emitSubagentProgress.mock.calls.map(([event]) => event.toolCallId))).toEqual(new Set(['call-1:0', 'call-1:1']))
        expect(result).toMatchObject({ tasks: [{ taskId: 'task-Asana', status: 'done', summary: 'Brief for Asana' }, { taskId: 'task-ClickUp', status: 'done', summary: 'Brief for ClickUp' }] })
        expect(result).toMatchObject({ billedToolCalls: [{ toolName: 'ap_web_search' }, { toolName: 'ap_web_search' }] })
    })

    it('runs a long list of subjects a few at a time', async () => {
        const inFlight = { now: 0, peak: 0 }
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            inFlight.now += 1
            inFlight.peak = Math.max(inFlight.peak, inFlight.now)
            await new Promise((resolve) => setTimeout(resolve, 5))
            inFlight.now -= 1
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_deep_research'].execute?.({ question: 'Compare', subjects: ['a', 'b', 'c', 'd', 'e', 'f'] }, EXECUTION_OPTIONS)

        expect(inFlight.peak).toBe(4)
        expect(result).toMatchObject({ tasks: [{}, {}, {}, {}, {}, {}] })
    })

    it('starts no more researchers once the run is stopped', async () => {
        const controller = new AbortController()
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            controller.abort()
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, abortSignal: controller.signal, tools: toolSet(['ap_web_search']) })

        await tasks['ap_deep_research'].execute?.({ question: 'Compare', subjects: ['a', 'b', 'c', 'd', 'e', 'f'] }, EXECUTION_OPTIONS)

        expect(beginTask).toHaveBeenCalledTimes(4)
    })

    it('keeps the result when saving it fails once', async () => {
        finishTask.mockRejectedValueOnce(new Error('api restarting'))
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Saved on retry.', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(finishTask).toHaveBeenCalledTimes(2)
        expect(result).toMatchObject({ status: 'done', summary: 'Saved on retry.' })
    })

    it('gives every task its own guides, so a guide the main chat loaded still reaches the task', async () => {
        const guideResults: unknown[] = []
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            guideResults.push(await params.tools['ap_load_guide'].execute?.({ topic: 'build_flow' }, EXECUTION_OPTIONS))
            guideResults.push(await params.tools['ap_load_guide'].execute?.({ topic: 'build_flow' }, EXECUTION_OPTIONS))
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const mainGuide = tool({ description: 'Load a guide', inputSchema: z.object({ topic: z.string() }), execute: async () => 'You already loaded the "build_flow" guide earlier in this turn' })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: { ...toolSet(['ap_build_flow']), ap_load_guide: mainGuide } })

        await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        expect(guideResults[0]).toBe('BUILD FLOW GUIDE')
        expect(guideResults[1]).toEqual(expect.stringContaining('earlier in this task'))
    })

    it('never gives a task the tools that create, change or publish saved agents', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow', 'ap_create_agent', 'ap_update_agent', 'ap_add_agent_tool']) })

        await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        expect(Object.keys(runAgentTurn.mock.calls[0][0].tools)).not.toEqual(expect.arrayContaining(['ap_create_agent']))
        expect(Object.keys(runAgentTurn.mock.calls[0][0].tools).filter((name) => name.includes('agent'))).toEqual([])
    })

    it('offers research only when web search is available', () => {
        expect(createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })).not.toHaveProperty('ap_deep_research')
    })

    it('offers no task tool without a task prompt', () => {
        expect(createTaskSubagentTools({ ...BASE_PARAMS, taskPrompt: undefined, tools: toolSet(['ap_build_flow']) })).toEqual({})
    })
})

function toolSet(names: string[]): ToolSet {
    return Object.fromEntries(names.map((name) => [name, tool({ description: name, inputSchema: z.object({}), execute: async () => 'ok' })]))
}

function turnResult(): Record<string, unknown> {
    return {
        uiParts: [
            { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 't1', toolName: 'ap_web_search', input: {}, status: PersistedToolCallStatus.COMPLETED, output: { content: [{ type: 'text', text: 'results' }] } },
        ],
        accumulatedResponseMessages: [{ role: 'assistant', content: 'ok' }],
        toolCalls: [],
        streamError: null,
        creditsExhausted: false,
        budgetExceeded: false,
        truncatedAfterRetries: false,
    }
}

const emitSubagentProgress = vi.fn()
const beginTask = vi.fn()
const finishTask = vi.fn()

const MODELS: RunAgentTurnParams['models'] = [{ model: 'test-model', provider: AIProviderName.OPENAI, modelId: 'm', thinkingBudget: 0 }]

const BASE_PARAMS = {
    guides: { build_flow: 'BUILD FLOW GUIDE' },
    models: MODELS,
    tier: { id: 'smart', thinkingBudget: 0, modelId: 'm' },
    taskPrompt: 'TASK PROMPT',
    creditsLeftFor: () => undefined,
    beginTask,
    finishTask,
    eventEmitter: { emitToolProgress: vi.fn(), emitActionPreview: vi.fn(), emitActionReceipt: vi.fn(), emitImageGenerated: vi.fn(), emitFileProduced: vi.fn(), emitBuildPlan: vi.fn(), emitSubagentProgress },
    abortSignal: new AbortController().signal,
    log: { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined },
}

const EXECUTION_OPTIONS: ToolExecutionOptions = { toolCallId: 'call-1', messages: [] }
