import { LAZY_TOOL_NAME, MAX_CORE_TOOLS } from '@activepieces/shared'
import { asSchema, jsonSchema, Schema, tool, ToolSet } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { buildSkillSurface, unwrapLazyToolChunk } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/skill-tools'
import { cardTitleFields } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/tool-primitives'

function stubTools(names: string[]): ToolSet {
    return Object.fromEntries(names.map((name) => [name, tool({
        description: `${name} does a thing.`,
        inputSchema: z.object({ value: z.string() }),
        execute: async ({ value }) => ({ ran: name, value }),
    })]))
}

const CHAT_TOOL_NAMES = [
    'ap_update_thinking_status', 'ap_show_quick_replies', 'ap_research_pieces', 'ap_web_search', 'ap_remember', 'ap_list_flows',
    'ap_add_step', 'ap_update_step', 'ap_build_flow', 'ap_test_flow', 'ap_list_connections', 'ap_list_runs', 'ap_set_phase', 'ap_load_guide',
    'mcp__gmail__send_email',
    'ap_rename_flow', 'ap_delete_flow', 'ap_list_tables', 'ap_create_table', 'ap_find_records', 'ap_insert_records',
]

function chatSurface({ canAfford = true }: { canAfford?: boolean } = {}) {
    return buildSkillSurface({
        tools: stubTools(CHAT_TOOL_NAMES),
        surface: 'CHAT',
        guides: { build_flow: 'BUILD GUIDE' },
        onSkillLoaded: vi.fn(),
        canAffordPaidTool: () => canAfford,
    })
}

const CALL_OPTIONS = { toolCallId: 'call_1', messages: [], abortSignal: new AbortController().signal, context: undefined }

async function validateWrapped({ surface, value }: { surface: ReturnType<typeof chatSurface>, value: unknown }): Promise<ValidationResult<unknown>> {
    const validate = asSchema(surface.tools[LAZY_TOOL_NAME]?.inputSchema).validate
    if (validate === undefined) {
        throw new Error('ap_lazy_tool schema has no validate')
    }
    return validate(value)
}

function errorMessageOf(result: ValidationResult<unknown>): string {
    return result.success ? '' : result.error.message
}

async function executeWrapped({ surface, toolName, input }: { surface: ReturnType<typeof chatSurface>, toolName: string, input: Record<string, unknown> }): Promise<unknown> {
    const execute = surface.tools[LAZY_TOOL_NAME]?.execute
    if (execute === undefined) {
        throw new Error('ap_lazy_tool has no execute')
    }
    return execute({ tool: toolName, input }, CALL_OPTIONS)
}

describe('buildSkillSurface', () => {
    it('shows the model at most the core cap and keeps every other tool reachable', () => {
        const surface = chatSurface()
        expect(surface.coreToolNames.length).toBeLessThanOrEqual(MAX_CORE_TOOLS)
        expect(surface.coreToolNames).not.toContain('ap_add_step')
        expect(surface.tools['ap_add_step']).toBeDefined()
        expect(surface.tools['ap_set_phase']).toBeUndefined()
        expect(surface.tools['ap_load_guide']).toBeUndefined()
    })

    it('lists tools no skill covers in the catalog note', () => {
        expect(chatSurface().catalogNote).toContain('mcp__gmail__send_email')
    })

    it('sends a small tool set directly and still installs the skill tools its prompt mentions', () => {
        const surface = buildSkillSurface({ tools: stubTools(['ap_web_search', 'ap_add_step']), surface: 'AGENT', guides: {}, onSkillLoaded: vi.fn(), canAffordPaidTool: () => true })
        expect(surface.coreToolNames).toEqual(expect.arrayContaining(['ap_web_search', 'ap_add_step', 'ap_load_skill', 'ap_get_tool_schema', LAZY_TOOL_NAME]))
        expect(Object.keys(surface.tools).sort()).toEqual([...surface.coreToolNames].sort())
        expect(surface.catalogNote).toBe('')
    })
})

describe('ap_lazy_tool', () => {
    function surfaceWithJsonSchemaTool(execute: (input: unknown) => Promise<unknown>) {
        return buildSkillSurface({
            tools: {
                ...stubTools(CHAT_TOOL_NAMES),
                ap_rename_flow: tool({
                    description: 'Rename a flow.',
                    inputSchema: jsonSchema<Record<string, unknown>>({ type: 'object', properties: { flowId: { type: 'string' } }, required: ['flowId'] }),
                    execute,
                }),
            },
            surface: 'CHAT',
            guides: {},
            onSkillLoaded: vi.fn(),
            canAffordPaidTool: () => true,
        })
    }

    it('checks a tool that only has a JSON schema, like an MCP tool, before running it', async () => {
        const surface = surfaceWithJsonSchemaTool(async () => ({ renamed: true }))
        const rejected = await validateWrapped({ surface, value: { tool: 'ap_rename_flow', input: {} } })
        expect(errorMessageOf(rejected)).toContain('Invalid input for "ap_rename_flow"')
        expect(errorMessageOf(rejected)).toContain('Input schema')
        expect((await validateWrapped({ surface, value: { tool: 'ap_rename_flow', input: { flowId: 'f1' } } })).success).toBe(true)
    })

    async function runThroughLazyTool({ targetSchema, outer, input }: { targetSchema: z.ZodType<Record<string, unknown>>, outer: Record<string, unknown>, input: Record<string, unknown> }): Promise<unknown> {
        const execute = vi.fn(async (received: unknown) => received)
        const surface = buildSkillSurface({
            tools: { ...stubTools(CHAT_TOOL_NAMES), ap_send_email: tool({ description: 'Send an email.', inputSchema: targetSchema, execute }) },
            surface: 'CHAT',
            guides: {},
            onSkillLoaded: vi.fn(),
            canAffordPaidTool: () => true,
        })
        const checked = await validateWrapped({ surface, value: { tool: 'ap_send_email', input, ...outer } })
        if (!checked.success) {
            throw checked.error
        }
        await surface.tools[LAZY_TOOL_NAME]?.execute?.(checked.value, CALL_OPTIONS)
        return execute.mock.calls[0]?.[0]
    }

    it('gives the target the pill labels set on the outer call, so its cards are named', async () => {
        const received = await runThroughLazyTool({
            targetSchema: z.object({ to: z.string(), ...cardTitleFields }),
            outer: { title: 'Email the team', doneTitle: 'Emailed the team' },
            input: { to: 'a@b.co' },
        })
        expect(received).toEqual({ to: 'a@b.co', title: 'Email the team', doneTitle: 'Emailed the team' })
    })

    it('keeps a label already set inside the input', async () => {
        const received = await runThroughLazyTool({
            targetSchema: z.object({ to: z.string(), ...cardTitleFields }),
            outer: { title: 'Outer label' },
            input: { to: 'a@b.co', title: 'Inner label' },
        })
        expect(received).toEqual({ to: 'a@b.co', title: 'Inner label' })
    })

    it('adds no labels to a tool whose schema has no label fields', async () => {
        const received = await runThroughLazyTool({
            targetSchema: z.object({ to: z.string() }).strict(),
            outer: { title: 'Email the team' },
            input: { to: 'a@b.co' },
        })
        expect(received).toEqual({ to: 'a@b.co' })
    })

    it('hands a JSON-schema tool its input unchanged', async () => {
        const execute = vi.fn(async () => ({ renamed: true }))
        await executeWrapped({ surface: surfaceWithJsonSchemaTool(execute), toolName: 'ap_rename_flow', input: { flowId: 'f1' } })
        expect(execute).toHaveBeenCalledWith({ flowId: 'f1' }, CALL_OPTIONS)
    })

    it('runs the inner tool with the original call options', async () => {
        await expect(executeWrapped({ surface: chatSurface(), toolName: 'ap_add_step', input: { value: 'x' } })).resolves.toEqual({ ran: 'ap_add_step', value: 'x' })
    })
})

describe('ap_lazy_tool input schema', () => {
    it('accepts a call whose input matches the real tool schema', async () => {
        await expect(validateWrapped({ surface: chatSurface(), value: { tool: 'ap_add_step', input: { value: 'x' } } })).resolves.toMatchObject({ success: true, value: { tool: 'ap_add_step', input: { value: 'x' } } })
    })

    it('rejects input that does not match the real tool schema, and shows that schema', async () => {
        const result = await validateWrapped({ surface: chatSurface(), value: { tool: 'ap_add_step', input: { value: 1 } } })
        expect(result.success).toBe(false)
        expect(errorMessageOf(result)).toContain('Invalid input for "ap_add_step"')
        expect(errorMessageOf(result)).toContain('"value"')
    })

    it('rejects a tool the surface does not have', async () => {
        const result = await validateWrapped({ surface: chatSurface(), value: { tool: 'ap_delete_table', input: {} } })
        expect(errorMessageOf(result)).toContain('no tool named')
    })

    it('rejects a paid tool when the turn cannot afford it', async () => {
        const result = await validateWrapped({ surface: chatSurface({ canAfford: false }), value: { tool: 'ap_web_search', input: { value: 'x' } } })
        expect(errorMessageOf(result)).toContain('credits')
    })

    it('rejects a call without an input object', async () => {
        const result = await validateWrapped({ surface: chatSurface(), value: { tool: 'ap_add_step', input: 'x' } })
        expect(errorMessageOf(result)).toContain('`input` object')
    })

    it('sends the provider a plain JSON schema', async () => {
        const schema = await asSchema(chatSurface().tools[LAZY_TOOL_NAME]?.inputSchema).jsonSchema
        expect(JSON.parse(JSON.stringify(schema))).toEqual(schema)
        expect(schema).toMatchObject({ type: 'object', properties: { tool: { type: 'string' }, input: { type: 'object' } } })
    })
})

describe('unwrapLazyToolChunk', () => {
    it('re-emits a wrapped call under the inner tool name and drops its deltas', () => {
        const start = { type: 'tool-input-start', toolCallId: 'c1', toolName: LAZY_TOOL_NAME }
        const held = unwrapLazyToolChunk({ chunk: start, heldStarts: new Map() })
        expect(held).toEqual({ emit: [], hold: { callId: 'c1', chunk: start } })
        const heldStarts = new Map([['c1', start]])
        expect(unwrapLazyToolChunk({ chunk: { type: 'tool-input-delta', toolCallId: 'c1', inputTextDelta: '{' }, heldStarts }).emit).toEqual([])
        const available = unwrapLazyToolChunk({ chunk: { type: 'tool-input-available', toolCallId: 'c1', toolName: LAZY_TOOL_NAME, input: { tool: 'ap_add_step', input: { value: 'x' } } }, heldStarts })
        expect(available.emit).toEqual([
            { type: 'tool-input-start', toolCallId: 'c1', toolName: 'ap_add_step' },
            { type: 'tool-input-available', toolCallId: 'c1', toolName: 'ap_add_step', input: { value: 'x' } },
        ])
        expect(available.release).toBe('c1')
    })

    it('passes other chunks through', () => {
        const chunk = { type: 'tool-input-start', toolCallId: 'c2', toolName: 'ap_web_search' }
        expect(unwrapLazyToolChunk({ chunk, heldStarts: new Map() }).emit).toEqual([chunk])
    })
})

type ValidationResult<T> = Awaited<ReturnType<NonNullable<Schema<T>['validate']>>>
