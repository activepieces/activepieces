import { isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { FlowActionType, FlowTriggerType } from '@activepieces/shared'
import { z } from 'zod'
import { agentWorkerTools } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { evalToolSet, McpTools } from './tool-set'

async function onlyMissesConnection({ mcp, flowId, stepName, declined }: { mcp: McpTools, flowId: string, stepName: string, declined: Set<string> }): Promise<boolean> {
    if (declined.size === 0) {
        return false
    }
    const step = await readStep({ mcp, flowId, stepName })
    if (isNil(step) || !declined.has(agentWorkerTools.normalizePieceName(step.pieceName))) {
        return false
    }
    const { auth, ...input } = step.input
    if (typeof auth === 'string' && auth.trim().length > 0) {
        return false
    }
    const props = await readProps({ mcp, step })
    if (isNil(props) || configProblems({ props, input }).length > 0) {
        return false
    }
    const { data: checked } = await tryCatch(() => evalToolSet.call({
        mcp,
        toolName: VALIDATE_STEP_CONFIG_TOOL,
        input: { stepType: step.kind === 'action' ? 'PIECE_ACTION' : 'PIECE_TRIGGER', pieceName: step.pieceName, ...(step.kind === 'action' ? { actionName: step.componentName } : { triggerName: step.componentName }), input, auth: STAND_IN_AUTH },
    }))
    return evalToolSet.readResult(checked).structured['valid'] === true
}

function configProblems({ props, input }: { props: PropSummary[], input: Record<string, unknown> }): string[] {
    const known = new Set(props.map((prop) => prop.name))
    const unknown = Object.keys(input).filter((key) => !known.has(key)).map((key) => `unknown property ${key}`)
    const wrongType = props.filter((prop) => isProvided(input[prop.name]) && !matchesType({ prop, value: input[prop.name] })).map((prop) => `${prop.name} is not a valid ${prop.type}`)
    const missing = props.filter((prop) => prop.required && !isProvided(input[prop.name]) && !EXCUSED_WHEN_MISSING.has(prop.type)).map((prop) => `missing required ${prop.name}`)
    return [...unknown, ...wrongType, ...missing]
}

async function readStep({ mcp, flowId, stepName }: { mcp: McpTools, flowId: string, stepName: string }): Promise<PieceStep | null> {
    const { data } = await tryCatch(() => evalToolSet.call({ mcp, toolName: READ_STEP_SETTINGS_TOOL, input: { flowId, stepName } }))
    const parsed = StoredStep.safeParse(evalToolSet.readResult(data).structured)
    if (!parsed.success) {
        return null
    }
    const stored = parsed.data
    return stored.type === FlowActionType.PIECE
        ? { kind: 'action', pieceName: stored.settings.pieceName, componentName: stored.settings.actionName, input: stored.settings.input }
        : { kind: 'trigger', pieceName: stored.settings.pieceName, componentName: stored.settings.triggerName, input: stored.settings.input }
}

async function readProps({ mcp, step }: { mcp: McpTools, step: PieceStep }): Promise<PropSummary[] | null> {
    const { data } = await tryCatch(() => evalToolSet.call({ mcp, toolName: GET_PIECE_PROPS_TOOL, input: { pieceName: step.pieceName, actionOrTriggerName: step.componentName, type: step.kind } }))
    const parsed = PieceProps.safeParse(evalToolSet.readResult(data).structured)
    return parsed.success ? parsed.data.props : null
}

function matchesType({ prop, value }: { prop: PropSummary, value: unknown }): boolean {
    if (isTemplate(value)) {
        return true
    }
    const allowed = (prop.options ?? []).map((option) => JSON.stringify(option.value))
    const isOption = (candidate: unknown): boolean => allowed.includes(JSON.stringify(candidate))
    switch (prop.type) {
        case 'NUMBER': return typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Number(value)))
        case 'CHECKBOX': return typeof value === 'boolean'
        case 'ARRAY':
        case 'MULTI_SELECT_DROPDOWN': return Array.isArray(value)
        case 'STATIC_MULTI_SELECT_DROPDOWN': return Array.isArray(value) && value.every((item) => isTemplate(item) || isOption(item))
        case 'STATIC_DROPDOWN': return isOption(value)
        case 'OBJECT':
        case 'DYNAMIC': return isObject(value)
        case 'SHORT_TEXT':
        case 'LONG_TEXT':
        case 'RICH_TEXT':
        case 'DATE_TIME':
        case 'COLOR': return typeof value === 'string' || typeof value === 'number'
        default: return true
    }
}

function isTemplate(value: unknown): boolean {
    return typeof value === 'string' && TEMPLATE_MARKS.some((mark) => value.includes(mark))
}

function isProvided(value: unknown): boolean {
    return !isNil(value) && value !== '' && !(Array.isArray(value) && value.length === 0)
}

const READ_STEP_SETTINGS_TOOL = 'ap_read_step_settings'
const GET_PIECE_PROPS_TOOL = 'ap_get_piece_props'
const VALIDATE_STEP_CONFIG_TOOL = 'ap_validate_step_config'
const STAND_IN_AUTH = 'eval-declined-connection'
const TEMPLATE_MARKS = ['{{', 'ap-formula-v1::']
const EXCUSED_WHEN_MISSING = new Set(['DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'DYNAMIC'])
const StoredInput = z.record(z.string(), z.unknown()).default({})
const StoredStep = z.discriminatedUnion('type', [
    z.object({ type: z.literal(FlowActionType.PIECE), settings: z.object({ pieceName: z.string(), actionName: z.string(), input: StoredInput }) }),
    z.object({ type: z.literal(FlowTriggerType.PIECE), settings: z.object({ pieceName: z.string(), triggerName: z.string(), input: StoredInput }) }),
])
const PropSummary = z.object({ name: z.string(), type: z.string(), required: z.boolean(), options: z.array(z.object({ value: z.unknown() })).optional() })
const PieceProps = z.object({ props: z.array(PropSummary) })

export const declinedSteps = {
    onlyMissesConnection,
    configProblems,
}

type PropSummary = z.infer<typeof PropSummary>

type PieceStep = {
    kind: 'action' | 'trigger'
    pieceName: string
    componentName: string
    input: Record<string, unknown>
}
