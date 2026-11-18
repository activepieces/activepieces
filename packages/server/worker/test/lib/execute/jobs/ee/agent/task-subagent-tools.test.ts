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
import { buildSkillSurface } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/skill-tools'
import { taskContext } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/task-context'
import { createTaskSubagentTools, taskTokensOf } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/task-subagent-tools'

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
        expect(Object.keys(params.tools).sort()).toEqual(['ap_build_flow', 'ap_execute_action', 'ap_web_search', TASK_COMPLETION_TOOL_NAME].sort())
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

    it('puts each titled tool step in the timeline and marks the failed ones, so a task without status updates still shows its steps', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Built.', artifacts: [] }, EXECUTION_OPTIONS)
            return {
                ...turnResult(),
                uiParts: [
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'b1', toolName: 'ap_build_flow', title: 'Building your intake flow', input: {}, status: PersistedToolCallStatus.COMPLETED },
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'v1', toolName: 'ap_validate_flow', input: {}, status: PersistedToolCallStatus.COMPLETED },
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 't1', toolName: 'ap_test_flow', title: 'Testing your intake flow', input: {}, status: PersistedToolCallStatus.ERROR },
                ],
            }
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ activity: { statusLine: 'Testing your intake flow', timeline: [{ kind: 'status', text: 'Building your intake flow', failed: false }, { kind: 'status', text: 'Testing your intake flow', failed: true }] } })
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

    it('labels a researcher with its latest search or page read', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Found it.', artifacts: [] }, EXECUTION_OPTIONS)
            return {
                ...turnResult(),
                uiParts: [
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 's1', toolName: 'ap_web_search', input: { query: 'asana pricing' }, status: PersistedToolCallStatus.COMPLETED, output: { results: [{ title: 'Asana plans', url: 'https://asana.com/pricing' }] } },
                    { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'f1', toolName: 'ap_fetch_url', input: { url: 'https://asana.com/pricing' }, status: PersistedToolCallStatus.COMPLETED, output: { url: 'https://asana.com/pricing', content: 'Plans' } },
                ],
            }
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ activity: { statusLine: 'Asana plans' } })
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

    it('asks a task that stopped without reporting for its result, keeping its tools so the cache holds', async () => {
        runAgentTurn
            .mockResolvedValueOnce(turnResult())
            .mockImplementationOnce(async (params: { tools: ToolSet }) => {
                await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Asana costs $13.49 a seat.', artifacts: [] }, EXECUTION_OPTIONS)
                return turnResult()
            })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research Asana', brief: 'Find pricing' }, EXECUTION_OPTIONS)

        const [workParams, reportParams] = runAgentTurn.mock.calls.map(([params]) => params)
        expect(Object.keys(reportParams.tools)).toEqual(Object.keys(workParams.tools))
        expect(reportParams.stepCeiling).toBe(2)
        expect(result).toMatchObject({ status: 'done', summary: 'Asana costs $13.49 a seat.' })
    })

    it('reports a task the user stopped as stopped, even after it filed a result', async () => {
        const controller = new AbortController()
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'Built.', artifacts: [] }, EXECUTION_OPTIONS)
            controller.abort()
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, abortSignal: controller.signal, tools: toolSet(['ap_build_flow']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ status: 'failed', activity: { status: 'failed' } })
        expect(finishTask).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }))
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

    it('loads its guides as skills and keeps them for the report turn', async () => {
        runAgentTurn
            .mockResolvedValueOnce(turnResult())
            .mockImplementationOnce(async (params: { tools: ToolSet }) => {
                await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
                return turnResult()
            })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        const [workTurn, reportTurn] = runAgentTurn.mock.calls.map(([params]) => params)
        expect(workTurn.skills).toEqual({ surface: 'CHAT', guides: BASE_PARAMS.guides })
        expect(reportTurn.skills).toEqual(workTurn.skills)
    })

    it('never gives a task the status tool or email to the user, which stay with the main chat', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow', 'ap_update_thinking_status', 'ap_send_email', 'ap_retry_run']) })

        await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        expect(Object.keys(runAgentTurn.mock.calls[0][0].tools)).not.toContain('ap_update_thinking_status')
        expect(Object.keys(runAgentTurn.mock.calls[0][0].tools)).not.toContain('ap_send_email')
        expect(Object.keys(runAgentTurn.mock.calls[0][0].tools)).not.toContain('ap_retry_run')
    })

    it('gives researchers only the search and page tools, on the research models, with no skills', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search', 'ap_fetch_url', 'ap_scrape_url', 'ap_build_flow', 'ap_execute_action']) })

        await tasks['ap_deep_research'].execute?.({ question: 'Pricing', subjects: ['Asana'] }, EXECUTION_OPTIONS)

        const params = runAgentTurn.mock.calls[0][0]
        expect(Object.keys(params.tools).sort()).toEqual(['ap_fetch_url', 'ap_scrape_url', 'ap_web_search', TASK_COMPLETION_TOOL_NAME].sort())
        expect(params.models).toBe(RESEARCH_MODELS)
        expect(params.skills).toBeUndefined()
    })

    it('cuts a page a researcher reads down to a small budget', async () => {
        let pageSize = 0
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            const page = await params.tools['ap_fetch_url'].execute?.({}, EXECUTION_OPTIONS)
            pageSize = JSON.stringify(page).length
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const bigPage = tool({ description: 'fetch', inputSchema: z.object({}), execute: async () => ({ url: 'https://big.com', content: 'x'.repeat(200 * 1024) }) })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: { ...toolSet(['ap_web_search']), ap_fetch_url: bigPage } })

        await tasks['ap_deep_research'].execute?.({ question: 'Pricing', subjects: ['Asana'] }, EXECUTION_OPTIONS)

        expect(pageSize).toBeGreaterThan(30_000)
        expect(pageSize).toBeLessThan(40 * 1024)
    })

    it('shows the latest step title on the card when the task sends no status', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet, sinks: { onProgress: (progress: { uiParts: unknown[] }) => void } }) => {
            params.sinks.onProgress({ uiParts: [{ type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'b1', toolName: 'ap_build_flow', title: 'Building your intake flow', input: {}, status: PersistedToolCallStatus.COMPLETED }] })
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        const lines = emitSubagentProgress.mock.calls.map(([event]) => event.data.statusLine)
        expect(lines).toContain('Building your intake flow')
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

    it('reports the tokens it used, adding up the turns it continued after a cut-off, and keeps them out of what the main model reads', async () => {
        runAgentTurn
            .mockResolvedValueOnce({ ...turnResult(), streamError: new Error('stream dropped') })
            .mockImplementationOnce(async (params: { tools: ToolSet }) => {
                await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
                return { ...turnResult(), totalInputTokens: 400, totalOutputTokens: 40 }
            })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search']) })

        const result = await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)
        const modelOutput = await tasks['ap_run_task'].toModelOutput?.({ toolCallId: 'call-1', input: {}, output: result })

        expect(result).toMatchObject({ tokens: { input: 1400, output: 140 } })
        expect(JSON.stringify(modelOutput)).not.toContain('tokens')
    })

    it('runs a task on the chat turn\'s own models, so its tokens bill through the same metered models as the chat', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_build_flow']) })

        await tasks['ap_run_task'].execute?.({ title: 'Build', brief: 'Build it' }, EXECUTION_OPTIONS)

        expect(runAgentTurn.mock.calls[0][0].models).toBe(MODELS)
    })

    it('adds up the tokens of every researcher in deep research', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search', 'ap_fetch_url']) })

        const result = await tasks['ap_deep_research'].execute?.({ question: 'Pricing', subjects: ['Asana', 'ClickUp', 'Monday'] }, EXECUTION_OPTIONS)

        expect(result).toMatchObject({ tokens: { input: 3000, output: 300 } })
    })

    it('adds up task and research tokens from a turn, ignoring other tools and calls without tokens', () => {
        const parts = [
            { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'a', toolName: 'ap_run_task', input: {}, status: PersistedToolCallStatus.COMPLETED, output: { tokens: { input: 1000, output: 100 } } },
            { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'b', toolName: 'ap_deep_research', input: {}, status: PersistedToolCallStatus.COMPLETED, output: { tokens: { input: 3000, output: 300 } } },
            { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'c', toolName: 'ap_web_search', input: {}, status: PersistedToolCallStatus.COMPLETED, output: { tokens: { input: 99, output: 9 } } },
            { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 'd', toolName: 'ap_run_task', input: {}, status: PersistedToolCallStatus.ERROR },
        ] as const

        expect(taskTokensOf({ parts: [...parts] })).toEqual({ input: 4000, output: 400 })
    })

    it('lets a task load a skill and use its tools, but never attaches a tool the task does not have', async () => {
        runAgentTurn.mockImplementation(async (params: { tools: ToolSet }) => {
            await params.tools[TASK_COMPLETION_TOOL_NAME].execute?.({ status: 'done', summary: 'ok', artifacts: [] }, EXECUTION_OPTIONS)
            return turnResult()
        })
        const tasks = createTaskSubagentTools({ ...BASE_PARAMS, tools: toolSet(['ap_web_search', 'ap_fetch_url', 'ap_scrape_url', 'ap_send_email', 'ap_build_flow', 'ap_add_step', 'ap_test_flow']) })
        await tasks['ap_run_task'].execute?.({ title: 'Research', brief: 'Find out' }, EXECUTION_OPTIONS)
        const params: RunAgentTurnParams = runAgentTurn.mock.calls[0][0]
        if (params.skills === undefined) {
            throw new Error('a task runs without skills')
        }
        const surface = buildSkillSurface({ tools: params.tools, surface: params.skills.surface, guides: params.skills.guides, onSkillLoaded: vi.fn(), canAffordPaidTool: () => true })

        await surface.tools['ap_load_skill']?.execute?.({ skills: ['web_and_media', 'flow_building'] }, EXECUTION_OPTIONS)

        expect(surface.attachedToolNames()).toEqual(expect.arrayContaining(['ap_fetch_url', 'ap_build_flow', 'ap_add_step']))
        expect(surface.attachedToolNames()).not.toContain('ap_send_email')
        expect(surface.attachedToolNames()).not.toContain('ap_deep_research')
        expect(surface.attachedToolNames()).not.toContain('ap_run_task')
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
        totalInputTokens: 1000,
        totalOutputTokens: 100,
    }
}

const emitSubagentProgress = vi.fn()
const beginTask = vi.fn()
const finishTask = vi.fn()

const MODELS: RunAgentTurnParams['models'] = [{ model: 'test-model', provider: AIProviderName.OPENAI, modelId: 'm', thinkingBudget: 0 }]

const RESEARCH_MODELS: RunAgentTurnParams['models'] = [{ model: 'fast-model', provider: AIProviderName.OPENAI, modelId: 'fast', thinkingBudget: 0 }]

const BASE_PARAMS = {
    guides: { build_flow: 'BUILD FLOW GUIDE' },
    models: MODELS,
    researchModels: RESEARCH_MODELS,
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
