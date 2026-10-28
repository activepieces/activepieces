import { isNil, isObject, tryCatch, unique } from '@activepieces/core-utils'
import { AGENT_SKILLS, AgentSkill, agentToolSkills, chatBilling, GET_TOOL_SCHEMA_NAME, LAZY_TOOL_NAME, LOAD_SKILL_NAME, MAX_CORE_TOOLS, SkillSurface } from '@activepieces/shared'
import { asSchema, jsonSchema, JSONValue, Schema, tool, ToolExecutionOptions, ToolResultPart, ToolSet } from 'ai'
import { z } from 'zod'
import { cardTitleFields, plainJsonSchema, stableStringify } from './tool-primitives'

export function buildSkillSurface({ tools: registry, surface, guides, onSkillLoaded, canAffordPaidTool, wasRerouted = (): boolean => false }: {
    tools: ToolSet
    surface: SkillSurface
    guides: Record<string, string>
    onSkillLoaded: (skill: AgentSkill) => void
    canAffordPaidTool: () => boolean
    wasRerouted?: (toolCallId: string) => boolean
}): SkillSurfaceResult {
    const loadedSkills = new Set<string>()
    const skillTools = createSkillTools({ registry, surface, guides, loadedSkills, onSkillLoaded, canAffordPaidTool, wasRerouted })
    const surfaceTools = { ...registry, ...skillTools }
    const allToolNames = Object.keys(surfaceTools)
    const directToolNames = allToolNames.length <= MAX_CORE_TOOLS
        ? allToolNames
        : agentToolSkills.coreToolNames({ surface }).filter((name) => allToolNames.includes(name))
    const coreToolNames = directToolNames.filter((name) => !chatBilling.isPaidTool(name))
    const uncatalogued = agentToolSkills.uncataloguedToolNames({ surface, allToolNames }).filter((name) => !coreToolNames.includes(name))
    return {
        tools: surfaceTools,
        coreToolNames,
        attachedToolNames: () => unique([...coreToolNames, ...[...loadedSkills].flatMap((name) => attachableToolNames({ skill: agentToolSkills.findSkill({ name }), registry }))]),
        catalogNote: uncatalogued.length === 0
            ? ''
            : `\n\n${OTHER_TOOLS_HEADING}\nThese are not attached to you, so calling one by its own name fails. Fetch its schema with \`${GET_TOOL_SCHEMA_NAME}\`, then call \`${LAZY_TOOL_NAME}\` with the name as \`tool\` and the arguments as \`input\`.\n${agentToolSkills.renderToolCatalog({ tools: uncatalogued.map((name) => ({ name, description: descriptionOf(registry[name]) })) })}`,
    }
}

export function unwrapLazyToolChunk({ chunk, heldStarts }: {
    chunk: unknown
    heldStarts: ReadonlyMap<string, Record<string, unknown>>
}): LazyToolChunkResult {
    if (!isObject(chunk) || typeof chunk['toolCallId'] !== 'string') {
        return { emit: [chunk] }
    }
    const callId = chunk['toolCallId']
    const type = chunk['type']
    if (type === 'tool-input-start' && chunk['toolName'] === LAZY_TOOL_NAME) {
        return { emit: [], hold: { callId, chunk } }
    }
    const heldStart = heldStarts.get(callId)
    if (heldStart === undefined) {
        return { emit: [chunk] }
    }
    if (type === 'tool-input-delta') {
        return { emit: [] }
    }
    if (type === 'tool-input-available' || type === 'tool-input-error') {
        const inner = agentToolSkills.effectiveToolCall({ toolName: LAZY_TOOL_NAME, input: chunk['input'] })
        return {
            emit: [{ ...heldStart, toolName: inner.toolName }, { ...chunk, toolName: inner.toolName, input: inner.input }],
            release: callId,
        }
    }
    return { emit: [chunk] }
}

function createSkillTools({ registry, surface, guides, loadedSkills, onSkillLoaded, canAffordPaidTool, wasRerouted }: {
    registry: ToolSet
    surface: SkillSurface
    guides: Record<string, string>
    loadedSkills: Set<string>
    onSkillLoaded: (skill: AgentSkill) => void
    canAffordPaidTool: () => boolean
    wasRerouted: (toolCallId: string) => boolean
}): ToolSet {
    const core = new Set(agentToolSkills.coreToolNames({ surface }))
    const loadableSkills = AGENT_SKILLS.filter((skill) => skill.toolNames.some((name) => name in registry) || (skill.guideTopic !== undefined && skill.guideTopic in guides))
    const [firstSkill, ...otherSkills] = loadableSkills.map((skill) => skill.name)

    const loadSkillTool: ToolSet = firstSkill === undefined ? {} : {
        [LOAD_SKILL_NAME]: tool({
            description: 'Load skills before that kind of work (silent, internal). A loaded playbook stays in the conversation and is re-read on every later step, so load only the skills the work in front of you needs right now, together in one call, and load another when the work reaches it. Returns each playbook and attaches its tools to you, so you call them by their own name from the next step on.',
            inputSchema: z.object({
                skills: z.array(z.enum([firstSkill, ...otherSkills])).min(1).describe('The skills the work in front of you needs now, loaded together'),
            }),
            execute: async ({ skills: skillNames }) => {
                const playbooks = await Promise.all([...new Set(skillNames)].map(async (skillName) => {
                    const skill = agentToolSkills.findSkill({ name: skillName })
                    if (skill === undefined) {
                        return `No skill named "${skillName}".`
                    }
                    if (loadedSkills.has(skill.name)) {
                        return `You already loaded "${skill.name}" earlier in this turn — re-read it from the conversation above instead of loading it again.`
                    }
                    loadedSkills.add(skill.name)
                    onSkillLoaded(skill)
                    return renderSkill({ skill, guide: skill.guideTopic === undefined ? undefined : guides[skill.guideTopic], registry, core, canAffordPaidTool })
                }))
                return playbooks.join('\n\n')
            },
        }),
    }

    return {
        ...loadSkillTool,
        [GET_TOOL_SCHEMA_NAME]: tool({
            description: 'Get one tool\'s description and input schema (silent, internal). Use it for a tool outside the skills you loaded.',
            inputSchema: z.object({
                tool: z.string().describe('The tool name, e.g. "ap_add_step"'),
            }),
            execute: async ({ tool: toolName }) => {
                const target = registry[toolName]
                if (target === undefined || agentToolSkills.isMetaTool(toolName)) {
                    return { error: `There is no tool named "${toolName}".` }
                }
                if (chatBilling.isPaidTool(toolName) && !canAffordPaidTool()) {
                    return { error: paidToolRefusal(toolName) }
                }
                return { tool: toolName, description: descriptionOf(target), inputSchema: await jsonSchemaOf(target) }
            },
        }),
        [LAZY_TOOL_NAME]: tool({
            description: 'Run any tool by name. `tool` is the tool name and `input` is that tool\'s arguments, shaped exactly by its input schema, both at the top level: {"tool": "ap_validate_flow", "input": {"flowId": "..."}}. Never wrap them in another object. Numbers, booleans and lists keep their JSON types. Always set title, activeTitle and doneTitle on this call: they are the step label the user sees, so name their thing in plain words, never the tool.',
            inputSchema: lazyToolInputSchema({ registry, canAffordPaidTool }),
            execute: async ({ tool: toolName, input }, options: ToolExecutionOptions<undefined>) => {
                const target = registry[toolName]
                if (target?.execute === undefined) {
                    return { error: `There is no tool named "${toolName}".` }
                }
                return target.execute(input, options)
            },
            toModelOutput: async ({ toolCallId, input, output }) => lazyToolModelOutput({
                output: await registry[input.tool]?.toModelOutput?.({ toolCallId, input: input.input, output }) ?? asModelOutput(output),
                reroutedTool: wasRerouted(toolCallId) ? input.tool : undefined,
            }),
        }),
    }
}

function asModelOutput(output: JSONValue | undefined): ToolResultPart['output'] {
    return typeof output === 'string' ? { type: 'text', value: output } : { type: 'json', value: output ?? null }
}

function lazyToolModelOutput({ output, reroutedTool }: { output: ToolResultPart['output'], reroutedTool: string | undefined }): ToolResultPart['output'] {
    if (isNil(reroutedTool)) {
        return output
    }
    const note = `Note: "${reroutedTool}" is not attached to you, so calling it by its own name does not work. It ran this time; next time call ${LAZY_TOOL_NAME} with tool: "${reroutedTool}" and its arguments as input.`
    if (output.type === 'text') {
        return { type: 'text', value: `${output.value}\n\n${note}` }
    }
    if (output.type === 'json') {
        const value = output.value
        return { type: 'json', value: isObject(value) && !Array.isArray(value) ? { ...value, note } : { result: value, note } }
    }
    return output
}

function lazyToolInputSchema({ registry, canAffordPaidTool }: { registry: ToolSet, canAffordPaidTool: () => boolean }): Schema<LazyToolInput> {
    const advertised = asSchema(LAZY_TOOL_ADVERTISED_SCHEMA)
    return jsonSchema<LazyToolInput>(async () => plainJsonSchema(await advertised.jsonSchema), {
        validate: async (value) => {
            const parsed = LAZY_TOOL_OUTER_SCHEMA.safeParse(value)
            if (!parsed.success) {
                return { success: false, error: new Error(`Pass the tool name as \`tool\` and its arguments as an \`input\` object: ${parsed.error.message}`) }
            }
            const { tool: toolName, input } = parsed.data
            const target = registry[toolName]
            if (target?.execute === undefined || agentToolSkills.isMetaTool(toolName)) {
                return { success: false, error: new Error(`There is no tool named "${toolName}". Use a name from a loaded skill or from your instructions.`) }
            }
            if (chatBilling.isPaidTool(toolName) && !canAffordPaidTool()) {
                return { success: false, error: new Error(paidToolRefusal(toolName)) }
            }
            const inner = await validateToolInput({ target, input: await withOuterLabels({ target, outer: parsed.data, input }) })
            if (!inner.success) {
                return { success: false, error: new Error(`Invalid input for "${toolName}": ${inner.error.message}\nInput schema: ${JSON.stringify(await jsonSchemaOf(target))}`) }
            }
            return { success: true, value: { ...toolCallLabels.withFallbackLabels({ input: parsed.data, toolName }), tool: toolName, input: inner.value } }
        },
    })
}

async function validateToolInput({ target, input }: { target: ToolSet[string], input: Record<string, unknown> }): Promise<ToolInputCheck> {
    const schema = asSchema(target.inputSchema)
    if (schema.validate !== undefined) {
        const result = await schema.validate(input)
        return result.success ? { success: true, value: isObject(result.value) ? result.value : input } : result
    }
    const jsonSchema = plainJsonSchema<z.core.JSONSchema.JSONSchema>(await schema.jsonSchema)
    const declaredInput = withoutUndeclaredKeys({ schema: jsonSchema, input })
    const { data: zodSchema } = await tryCatch(async () => z.fromJSONSchema(jsonSchema))
    if (isNil(zodSchema)) {
        return { success: true, value: declaredInput }
    }
    const result = zodSchema.safeParse(declaredInput)
    return result.success ? { success: true, value: declaredInput } : { success: false, error: new Error(result.error.message) }
}

function withoutUndeclaredKeys({ schema, input }: { schema: unknown, input: Record<string, unknown> }): Record<string, unknown> {
    if (!isObject(schema) || !isObject(schema['properties']) || schema['additionalProperties'] !== false) {
        return input
    }
    const declared = schema['properties']
    return Object.fromEntries(Object.entries(input).filter(([key]) => key in declared))
}

async function withOuterLabels({ target, outer, input }: { target: ToolSet[string], outer: Record<string, unknown>, input: Record<string, unknown> }): Promise<Record<string, unknown>> {
    const labelKeys = await workerLabelKeys(plainJsonSchema(await asSchema(target.inputSchema).jsonSchema))
    const labels = Object.fromEntries([...labelKeys]
        .filter((key) => input[key] === undefined && typeof outer[key] === 'string')
        .map((key) => [key, outer[key]]))
    return { ...input, ...labels }
}

async function renderSkill({ skill, guide, registry, core, canAffordPaidTool }: {
    skill: AgentSkill
    guide: string | undefined
    registry: ToolSet
    core: Set<string>
    canAffordPaidTool: () => boolean
}): Promise<string> {
    const attached = attachableToolNames({ skill, registry }).filter((name) => !core.has(name))
    const available = skill.toolNames.filter((name) => name in registry && !core.has(name) && chatBilling.isPaidTool(name))
    const unaffordable = canAffordPaidTool() ? [] : available.filter((name) => chatBilling.isPaidTool(name))
    const toolNames = available.filter((name) => !unaffordable.includes(name))
    const sections = await Promise.all(toolNames.map(async (name) => {
        const target = registry[name]
        return `### ${name}\n${descriptionOf(target)}\nCall: ${LAZY_TOOL_NAME} with tool: "${name}" and input matching this schema: ${JSON.stringify(target === undefined ? {} : await jsonSchemaOf(target))}`
    }))
    return [
        `# Skill: ${skill.name}`,
        ...(guide === undefined ? [] : [guide]),
        ...(attached.length === 0 ? [] : [`## Tools now attached to you: call them by their own name, not through ${LAZY_TOOL_NAME}\n${attached.join(', ')}`]),
        ...(sections.length === 0 ? [] : [`## Tools: call each one through ${LAZY_TOOL_NAME}, never by its own name`, ...sections]),
        ...(unaffordable.length === 0 ? [] : [`Not available, the balance cannot cover these paid tools: ${unaffordable.join(', ')}. Tell the user if the task needs them.`]),
    ].join('\n\n')
}

function attachableToolNames({ skill, registry }: { skill: AgentSkill | undefined, registry: ToolSet }): string[] {
    return (skill?.toolNames ?? []).filter((name) => name in registry && !chatBilling.isPaidTool(name))
}

function descriptionOf(target: ToolSet[string] | undefined): string {
    return typeof target?.description === 'string' ? target.description : ''
}

async function jsonSchemaOf(target: ToolSet[string]): Promise<unknown> {
    return withoutNoise(plainJsonSchema(await asSchema(target.inputSchema).jsonSchema))
}

async function withoutNoise(schema: unknown): Promise<unknown> {
    if (!isObject(schema)) {
        return schema
    }
    const labelKeys = await workerLabelKeys(schema)
    const properties = isObject(schema['properties'])
        ? Object.fromEntries(Object.entries(schema['properties']).filter(([key]) => !labelKeys.has(key)))
        : undefined
    return Object.fromEntries(Object.entries({ ...schema, properties }).filter(([key, value]) => value !== undefined && !SCHEMA_NOISE_KEYS.has(key)))
}

async function workerLabelKeys(schema: unknown): Promise<Set<string>> {
    if (!isObject(schema) || !isObject(schema['properties'])) {
        return new Set()
    }
    const properties = schema['properties']
    const required = Array.isArray(schema['required']) ? schema['required'] : []
    const labelSchema = plainJsonSchema(await LABEL_SCHEMA.jsonSchema)
    const labelProperties = isObject(labelSchema.properties) ? labelSchema.properties : {}
    return new Set([...LABEL_FIELDS].filter((key) => key in properties
        && !required.includes(key)
        && stableStringify(properties[key]) === stableStringify(labelProperties[key])))
}

function paidToolRefusal(toolName: string): string {
    return `"${toolName}" needs credits and the balance cannot cover it. Tell the user instead of retrying.`
}

function withFallbackLabels<T extends Record<string, unknown>>({ input, toolName }: { input: T, toolName: string }): T & ToolCallLabelSet {
    const fallback = fallbackLabelsFor(toolName)
    return {
        ...input,
        title: labelOr({ value: input['title'], fallback: fallback.title }),
        activeTitle: labelOr({ value: input['activeTitle'], fallback: fallback.activeTitle }),
        doneTitle: labelOr({ value: input['doneTitle'], fallback: fallback.doneTitle }),
    }
}

function labelOr({ value, fallback }: { value: unknown, fallback: string }): string {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function fallbackLabelsFor(toolName: string): ToolCallLabelSet {
    const words = toolName.replace(/^mcp__[^_]+__/, '').replace(/^ap_/, '').split(/[_\s-]+/).filter((word) => word.length > 0)
    const [verb = '', ...rest] = words
    const subject = rest.join(' ')
    const forms = VERB_FORMS[verb.toLowerCase()]
    const title = capitalize([verb, subject].filter((word) => word.length > 0).join(' '))
    if (isNil(forms)) {
        return { title, activeTitle: title, doneTitle: title }
    }
    return {
        title,
        activeTitle: capitalize([forms.active, subject].filter((word) => word.length > 0).join(' ')),
        doneTitle: capitalize([forms.done, subject].filter((word) => word.length > 0).join(' ')),
    }
}

function capitalize(text: string): string {
    return text.length === 0 ? 'Working on it' : `${text[0].toUpperCase()}${text.slice(1)}`
}

const OTHER_TOOLS_HEADING = '## Other tools you have'

const LAZY_TOOL_OUTER_SCHEMA = z.object({
    tool: z.string().describe('The tool name, e.g. "ap_add_step"'),
    input: z.record(z.string(), z.unknown()).describe('The tool\'s arguments, matching its input schema'),
    ...cardTitleFields,
})

const LAZY_TOOL_ADVERTISED_SCHEMA = LAZY_TOOL_OUTER_SCHEMA.extend({
    title: z.string().min(1).describe('The 2-4 word label the user sees for this step, about their thing, e.g. "Your Gmail inbox".'),
    activeTitle: z.string().min(1).describe('The label while it runs, -ing form, e.g. "Reading your Gmail inbox".'),
    doneTitle: z.string().min(1).describe('The same label in past tense, e.g. "Read your Gmail inbox".'),
})

const LABEL_FIELDS = new Set(Object.keys(cardTitleFields))
const LABEL_SCHEMA = asSchema(z.object(cardTitleFields))
const SCHEMA_NOISE_KEYS = new Set(['$schema', 'additionalProperties'])

const VERB_FORMS: Record<string, { active: string, done: string }> = {
    add: { active: 'adding', done: 'added' },
    build: { active: 'building', done: 'built' },
    change: { active: 'changing', done: 'changed' },
    create: { active: 'creating', done: 'created' },
    delete: { active: 'deleting', done: 'deleted' },
    execute: { active: 'running', done: 'ran' },
    explore: { active: 'exploring', done: 'explored' },
    fetch: { active: 'fetching', done: 'fetched' },
    find: { active: 'finding', done: 'found' },
    generate: { active: 'generating', done: 'generated' },
    get: { active: 'getting', done: 'got' },
    insert: { active: 'adding', done: 'added' },
    list: { active: 'listing', done: 'listed' },
    manage: { active: 'updating', done: 'updated' },
    move: { active: 'moving', done: 'moved' },
    read: { active: 'reading', done: 'read' },
    remove: { active: 'removing', done: 'removed' },
    rename: { active: 'renaming', done: 'renamed' },
    research: { active: 'researching', done: 'researched' },
    resolve: { active: 'resolving', done: 'resolved' },
    retry: { active: 'retrying', done: 'retried' },
    run: { active: 'running', done: 'ran' },
    search: { active: 'searching', done: 'searched' },
    send: { active: 'sending', done: 'sent' },
    test: { active: 'testing', done: 'tested' },
    update: { active: 'updating', done: 'updated' },
    validate: { active: 'checking', done: 'checked' },
}

export const toolCallLabels = {
    withFallbackLabels,
}

export type LazyToolChunkResult = {
    emit: unknown[]
    hold?: { callId: string, chunk: Record<string, unknown> }
    release?: string
}

type ToolInputCheck = { success: true, value: Record<string, unknown> } | { success: false, error: Error }

type LazyToolInput = z.infer<typeof LAZY_TOOL_OUTER_SCHEMA>

export type SkillSurfaceResult = {
    tools: ToolSet
    coreToolNames: string[]
    attachedToolNames: () => string[]
    catalogNote: string
}

type ToolCallLabelSet = {
    title: string
    activeTitle: string
    doneTitle: string
}
