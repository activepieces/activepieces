import { tool, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { EvalCase, RecordedToolCall } from './eval-case'
import { toolChanges } from './tool-changes'

describe('toolChanges', () => {
    const listFlows = (description: string, schema: z.ZodObject): ToolSet => ({ ap_list_flows: tool({ description, inputSchema: schema }) })
    const evalCaseWith = ({ recordedToolCalls, targetTool }: { recordedToolCalls: RecordedToolCall[], targetTool?: string }): EvalCase => ({
        id: 'item', caseNumber: 1, title: 't', userMessage: 'u', checks: [], problemType: 'core', cutBeforeStep: 0, targetTool, messages: [], steps: [], preloadedSkills: [], recordedToolCalls,
    })

    it('flags a tool whose description or input schema changed, and added or removed tools', async () => {
        const before = await toolChanges.fingerprints({ tools: { ...listFlows('List flows', z.object({ limit: z.number() })), ap_old: tool({ inputSchema: z.object({}) }) } })
        const sameDefinition = await toolChanges.fingerprints({ tools: listFlows('List flows', z.object({ limit: z.number() })) })
        const newDescription = await toolChanges.fingerprints({ tools: listFlows('List the flows', z.object({ limit: z.number() })) })
        const newSchema = await toolChanges.fingerprints({ tools: { ...listFlows('List flows', z.object({ limit: z.number(), folderId: z.string() })), ap_new: tool({ inputSchema: z.object({}) }) } })

        expect(toolChanges.changed({ before, now: { ...sameDefinition, ap_old: before['ap_old'] } })).toEqual([])
        expect(toolChanges.changed({ before, now: { ...newDescription, ap_old: before['ap_old'] } })).toEqual(['ap_list_flows'])
        expect(toolChanges.changed({ before, now: newSchema })).toEqual(['ap_list_flows', 'ap_new', 'ap_old'])
    })

    it('lists changed tools a case answers from recordings, but not live tools', () => {
        const evalCase = evalCaseWith({ recordedToolCalls: [
            { toolName: 'ap_list_flows', input: {}, output: [] },
            { toolName: 'ap_web_search', input: { query: 'x' }, output: 'answer' },
        ] })

        expect(toolChanges.untested({ evalCase, changedTools: ['ap_list_flows', 'ap_web_search', 'ap_add_step'] })).toEqual(['ap_list_flows'])
    })

    it('counts a case as touched when it records a changed tool or targets it', () => {
        expect(toolChanges.touches({ evalCase: evalCaseWith({ recordedToolCalls: [], targetTool: 'ap_show_showcase' }), changedTools: ['ap_show_showcase'] })).toBe(true)
        expect(toolChanges.touches({ evalCase: evalCaseWith({ recordedToolCalls: [{ toolName: 'ap_list_flows', input: {}, output: [] }] }), changedTools: ['ap_add_step'] })).toBe(false)
    })
})
