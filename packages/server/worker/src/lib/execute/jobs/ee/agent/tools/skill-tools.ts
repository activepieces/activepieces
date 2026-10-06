import { isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { AGENT_SKILLS, AgentSkill, agentToolSkills, chatBilling, GET_TOOL_SCHEMA_NAME, LAZY_TOOL_NAME, LOAD_SKILL_NAME, MAX_CORE_TOOLS, SkillSurface } from '@activepieces/shared'
import { asSchema, jsonSchema, Schema, tool, ToolExecutionOptions, ToolSet } from 'ai'
import { z } from 'zod'
import { cardTitleFields, plainJsonSchema, stableStringify } from './tool-primitives'

export function buildSkillSurface({ tools: registry, surface, guides, onSkillLoaded, canAffordPaidTool }: {
    tools: ToolSet
    surface: SkillSurface
    guides: Record<string, string>
    onSkillLoaded: (skill: AgentSkill) => void
    canAffordPaidTool: () => boolean
}): SkillSurfaceResult {
    const skillTools = createSkillTools({ registry, surface, guides, onSkillLoaded, canAffordPaidTool })
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
        catalogNote: uncatalogued.length === 0
            ? ''
            : `\n\n${OTHER_TOOLS_HEADING}\nRun these with \`${LAZY_TOOL_NAME}\`; fetch a schema with \`${GET_TOOL_SCHEMA_NAME}\` first.\n${agentToolSkills.renderToolCatalog({ tools: uncatalogued.map((name) => ({ name, description: descriptionOf(registry[name]) })) })}`,
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

function createSkillTools({ registry, surface, guides, onSkillLoaded, canAffordPaidTool }: {
    registry: ToolSet
    surface: SkillSurface
    guides: Record<string, string>
    onSkillLoaded: (skill: AgentSkill) => void
    canAffordPaidTool: () => boolean
}): ToolSet {
    const loadedSkills = new Set<string>()
    const core = new Set(agentToolSkills.coreToolNames({ surface }))
    const loadableSkills = AGENT_SKILLS.filter((skill) => skill.toolNames.some((name) => name in registry) || (skill.guideTopic !== undefined && skill.guideTopic in guides))
    const [firstSkill, ...otherSkills] = loadableSkills.map((skill) => skill.name)

    const loadSkillTool: ToolSet = firstSkill === undefined ? {} : {
        [LOAD_SKILL_NAME]: tool({
            description: 'Load a skill before that kind of work (silent, internal). Returns its playbook and the input schema of every tool in it, which you then run with ap_lazy_tool.',
            inputSchema: z.object({
                skill: z.enum([firstSkill, ...otherSkills]).describe('Which skill to load'),
            }),
            execute: async ({ skill: skillName }) => {
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
            description: 'Run any tool by name. Pass the tool name as `tool` and its arguments as `input`, shaped exactly by that tool\'s input schema. Put the pill labels (title, activeTitle, doneTitle) on this call.',
            inputSchema: lazyToolInputSchema({ registry, canAffordPaidTool }),
            execute: async ({ tool: toolName, input }, options: ToolExecutionOptions<undefined>) => {
                const target = registry[toolName]
                if (target?.execute === undefined) {
                    return { error: `There is no tool named "${toolName}".` }
                }
                return target.execute(input, options)
            },
        }),
    }
}

function lazyToolInputSchema({ registry, canAffordPaidTool }: { registry: ToolSet, canAffordPaidTool: () => boolean }): Schema<LazyToolInput> {
    const outer = asSchema(LAZY_TOOL_OUTER_SCHEMA)
    return jsonSchema<LazyToolInput>(async () => plainJsonSchema(await outer.jsonSchema), {
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
            return { success: true, value: { ...parsed.data, input: inner.value } }
        },
    })
}

async function validateToolInput({ target, input }: { target: ToolSet[string], input: Record<string, unknown> }): Promise<ToolInputCheck> {
    const schema = asSchema(target.inputSchema)
    if (schema.validate !== undefined) {
        const result = await schema.validate(input)
        return result.success ? { success: true, value: isObject(result.value) ? result.value : input } : result
    }
    const { data: zodSchema } = await tryCatch(async () => z.fromJSONSchema(plainJsonSchema<z.core.JSONSchema.JSONSchema>(await schema.jsonSchema)))
    if (isNil(zodSchema)) {
        return { success: true, value: input }
    }
    const result = zodSchema.safeParse(input)
    return result.success ? { success: true, value: input } : { success: false, error: new Error(result.error.message) }
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
    const available = skill.toolNames.filter((name) => name in registry && !core.has(name))
    const unaffordable = canAffordPaidTool() ? [] : available.filter((name) => chatBilling.isPaidTool(name))
    const toolNames = available.filter((name) => !unaffordable.includes(name))
    const sections = await Promise.all(toolNames.map(async (name) => {
        const target = registry[name]
        return `### ${name}\n${descriptionOf(target)}\nInput schema: ${JSON.stringify(target === undefined ? {} : await jsonSchemaOf(target))}`
    }))
    return [
        `# Skill: ${skill.name}`,
        ...(guide === undefined ? [] : [guide]),
        ...(sections.length === 0 ? [] : [`## Tools (run with ${LAZY_TOOL_NAME})`, ...sections]),
        ...(unaffordable.length === 0 ? [] : [`Not available, the balance cannot cover these paid tools: ${unaffordable.join(', ')}. Tell the user if the task needs them.`]),
    ].join('\n\n')
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

const OTHER_TOOLS_HEADING = '## Other tools you have'
const LAZY_TOOL_OUTER_SCHEMA = z.object({
    tool: z.string().describe('The tool name, e.g. "ap_add_step"'),
    input: z.record(z.string(), z.unknown()).describe('The tool\'s arguments, matching its input schema'),
    ...cardTitleFields,
})
const LABEL_FIELDS = new Set(Object.keys(cardTitleFields))
const LABEL_SCHEMA = asSchema(z.object(cardTitleFields))
const SCHEMA_NOISE_KEYS = new Set(['$schema', 'additionalProperties'])

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
    catalogNote: string
}
