import { isNil, isObject, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { FlowActionType, flowStructureUtil, FlowTrigger, FlowTriggerType, RouterActionSettingsWithValidation, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { flowValidation } from './flow-validation'
import { mcpUtils } from './mcp-utils'
import { propertyOptionMatch } from './property-chain-resolver'

async function resolveDropdownLabels({ pieceName, pieceVersion, componentName, componentType, stepName, input, fields, projectId, platformId, log }: {
    pieceName: string
    pieceVersion: string
    componentName: string
    componentType: 'action' | 'trigger'
    stepName: string
    input: Record<string, unknown>
    fields?: string[]
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<LabelResolution> {
    const component = await findComponent({ pieceName, pieceVersion, componentName, componentType, platformId, log })
    if (isNil(component)) {
        return { input, resolved: [], problems: [] }
    }
    let currentInput = input
    const resolved: string[] = []
    const problems: FlowProblem[] = []
    for (const [field, prop] of Object.entries(component.props)) {
        const labels = labelsToResolve(currentInput[field])
        if (!DROPDOWN_TYPES.has(prop.type) || labels.length === 0 || (!isNil(fields) && !fields.includes(field))) {
            continue
        }
        const options = await optionsFor({ prop, field, pieceName, pieceVersion, componentName, input: currentInput, projectId, platformId, log })
        if (isNil(options)) {
            continue
        }
        const outcomes = labels.map((label) => ({ label, ...pickOption({ options, label }) }))
        const picked = outcomes.filter((outcome) => outcome.changed)
        const unresolved = outcomes.filter((outcome) => !isNil(outcome.problem))
        resolved.push(...picked.map((outcome) => `${stepName}.${field}: "${outcome.label}" → ${JSON.stringify(outcome.value)}`))
        problems.push(...unresolved.map((outcome) => ({ step: stepName, field, message: outcome.problem ?? '' })))
        if (picked.length > 0) {
            const values = outcomes.map((outcome) => outcome.value)
            currentInput = { ...currentInput, [field]: Array.isArray(currentInput[field]) ? values : values[0] }
        }
    }
    return { input: currentInput, resolved, problems }
}

async function findProblems({ trigger, invalidReasons, labelProblems, platformId, log }: {
    trigger: FlowTrigger
    invalidReasons: Map<string, string[]>
    labelProblems: FlowProblem[]
    platformId: string
    log: FastifyBaseLogger
}): Promise<FlowProblem[]> {
    const steps = flowStructureUtil.getAllSteps(trigger)
    const stepProblems = await Promise.all(steps.map((step) => problemsOfStep({ step, invalidReasons: invalidReasons.get(step.name) ?? [], platformId, log })))
    const flowIssues = flowValidation.validateFlow({ trigger }).issues
        .filter((issue) => issue.severity !== 'info' && issue.category !== 'step_validity')
        .map((issue) => ({ step: issue.stepName, message: issue.message }))
    const all: FlowProblem[] = [...labelProblems, ...stepProblems.flat(), ...flowIssues]
    const seen = new Set<string>()
    return all.filter((problem) => {
        const key = isNil(problem.field) ? `${problem.step}:${problem.message}` : `${problem.step}.${problem.field}`
        if (seen.has(key)) {
            return false
        }
        seen.add(key)
        return true
    })
}

function flowStepStates({ trigger, problemStepNames, skippedDisplayNames = [] }: {
    trigger: FlowTrigger
    problemStepNames: Set<string>
    skippedDisplayNames?: string[]
}): FlowStepState[] {
    return [
        ...flowStructureUtil.getAllSteps(trigger).map((step) => ({ displayName: step.displayName, state: problemStepNames.has(step.name) ? 'problem' as const : 'ok' as const })),
        ...skippedDisplayNames.map((displayName) => ({ displayName, state: 'skipped' as const })),
    ]
}

function labelNotes(resolution: LabelResolution): string[] {
    return [...resolution.resolved.map((line) => `Replaced ${line}`), ...resolution.problems.map(formatProblem)]
}

function formatProblem(problem: FlowProblem): string {
    return isNil(problem.field) ? `${problem.step}: ${problem.message}` : `${problem.step}.${problem.field}: ${problem.message}`
}

function summarizeStep({ name, step, placement }: { name: string, step: Step, placement: string }): string {
    return `${name} "${step.displayName}": ${stepKind(step)}${placement.length > 0 ? `, ${placement}` : ''}`
}

async function problemsOfStep({ step, invalidReasons, platformId, log }: {
    step: Step
    invalidReasons: string[]
    platformId: string
    log: FastifyBaseLogger
}): Promise<FlowProblem[]> {
    if (step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE) {
        const componentName = step.type === FlowActionType.PIECE ? step.settings.actionName : step.settings.triggerName
        const componentType = step.type === FlowActionType.PIECE ? 'action' : 'trigger'
        const component = isNil(componentName) ? undefined : await findComponent({ pieceName: step.settings.pieceName, pieceVersion: step.settings.pieceVersion, componentName, componentType, platformId, log })
        const fieldProblems = isNil(component) ? [] : pieceFieldProblems({ stepName: step.name, props: component.props, input: step.settings.input ?? {} })
        return [...fieldProblems, ...invalidReasons.map((reason) => reasonToProblem({ stepName: step.name, reason }))]
    }
    if (step.valid) {
        return []
    }
    if (step.type === FlowActionType.LOOP_ON_ITEMS && step.settings.items.trim().length === 0) {
        return [{ step: step.name, field: 'loopItems', message: 'required' }]
    }
    if (step.type === FlowActionType.ROUTER) {
        const parsed = RouterActionSettingsWithValidation.safeParse(step.settings)
        if (!parsed.success) {
            return parsed.error.issues.map((issue) => ({ step: step.name, field: issue.path.join('.'), message: issue.message }))
        }
    }
    return [{ step: step.name, message: 'invalid configuration' }]
}

function pieceFieldProblems({ stepName, props, input }: { stepName: string, props: PiecePropertyMap, input: Record<string, unknown> }): FlowProblem[] {
    return Object.entries(props).flatMap(([field, prop]) => {
        const value = input[field]
        const provided = !isNil(value) && value !== ''
        const options = staticOptionsOf(prop)
        if (prop.required && !provided && DROPDOWN_TYPES.has(prop.type)) {
            const hint = isNil(options) ? 'pass the option label or value' : `one of ${formatOptions(options)}`
            return [{ step: stepName, field, message: `required (dropdown: ${hint})` }]
        }
        if (!provided || isNil(options)) {
            return []
        }
        const bad = (Array.isArray(value) ? value : [value]).filter((item) => !isReference(item) && !options.some((option) => option.value === item))
        return bad.length === 0 ? [] : [{ step: stepName, field, message: `${bad.map((item) => JSON.stringify(item)).join(', ')} is not an option; use one of ${formatOptions(options)}` }]
    })
}

function reasonToProblem({ stepName, reason }: { stepName: string, reason: string }): FlowProblem {
    const match = REASON_PATTERN.exec(reason)
    if (isNil(match)) {
        return { step: stepName, message: reason }
    }
    const field = match[1] === 'connection' ? 'auth' : match[1]
    const message = match[2] === 'is missing' ? (field === 'auth' ? 'connection required' : 'required') : 'invalid value'
    return { step: stepName, field, message }
}

async function findComponent({ pieceName, pieceVersion, componentName, componentType, platformId, log }: {
    pieceName: string
    pieceVersion: string
    componentName: string
    componentType: 'action' | 'trigger'
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ props: PiecePropertyMap } | undefined> {
    const { data: piece } = await tryCatch(() => pieceMetadataService(log).getOrThrow({ platformId, name: pieceName, version: pieceVersion }))
    if (isNil(piece)) {
        return undefined
    }
    return componentType === 'action' ? piece.actions[componentName] : piece.triggers[componentName]
}

async function optionsFor({ prop, field, pieceName, pieceVersion, componentName, input, projectId, platformId, log }: {
    prop: PieceProperty
    field: string
    pieceName: string
    pieceVersion: string
    componentName: string
    input: Record<string, unknown>
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<DropdownOption[] | undefined> {
    const staticOptions = staticOptionsOf(prop)
    if (!isNil(staticOptions)) {
        return staticOptions
    }
    const { data: result } = await tryCatch(() => mcpUtils.executePropertyResolution({ pieceName, pieceVersion, actionOrTriggerName: componentName, propertyName: field, input, projectId, platformId, log }))
    return result?.status === 'options' && result.options.length > 0 ? result.options : undefined
}

function pickOption({ options, label }: { options: DropdownOption[], label: string }): { value: unknown, changed: boolean, problem?: string } {
    if (options.some((option) => option.value === label)) {
        return { value: label, changed: false }
    }
    const byKey = optionByObjectKey({ options, label })
    if (!isNil(byKey)) {
        return { value: byKey.value, changed: true }
    }
    const choice = propertyOptionMatch.choose({ options: options.length === 1 ? [...options, UNMATCHABLE_OPTION] : options, match: label })
    if (!isNil(choice.picked)) {
        return { value: choice.picked.value, changed: true }
    }
    const isAmbiguous = choice.candidates.length > 1
    const shown = isAmbiguous ? choice.candidates : options
    const problem = isAmbiguous
        ? `"${label}" matches several options; pick one value: ${formatOptions(shown)}`
        : `"${label}" matches no option; options: ${formatOptions(shown)}`
    return { value: label, changed: false, problem }
}

function optionByObjectKey({ options, label }: { options: DropdownOption[], label: string }): DropdownOption | undefined {
    const objectOptions = options.filter((option) => isObject(option.value))
    if (objectOptions.length === 0) {
        return undefined
    }
    const { data: parsed } = tryCatchSync((): unknown => JSON.parse(label))
    const wanted = isObject(parsed) ? [parsed['id'], parsed['key'], parsed['value'], parsed['name']] : [label]
    const keys = wanted.filter((key): key is string | number => typeof key === 'string' || typeof key === 'number').map(String)
    const matches = objectOptions.filter((option) => isObject(option.value) && OBJECT_KEY_FIELDS.some((field) => {
        const candidate = isObject(option.value) ? option.value[field] : undefined
        return (typeof candidate === 'string' || typeof candidate === 'number') && keys.includes(String(candidate))
    }))
    return matches.length === 1 ? matches[0] : undefined
}

function labelsToResolve(value: unknown): string[] {
    const items = Array.isArray(value) ? value : [value]
    const labels = items.filter((item): item is string => typeof item === 'string' && item.trim().length > 0 && !isReference(item))
    return labels.length === items.length ? labels : []
}

function isReference(value: unknown): boolean {
    return typeof value === 'string' && (value.includes('{{') || value.includes('ap-formula-v'))
}

function staticOptionsOf(prop: PieceProperty): DropdownOption[] | undefined {
    if (prop.type === PropertyType.STATIC_DROPDOWN || prop.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN) {
        return prop.options.options.map((option) => ({ label: String(option.label), value: option.value }))
    }
    return undefined
}

function formatOptions(options: DropdownOption[]): string {
    const shown = options.slice(0, MAX_SHOWN_OPTIONS).map((option) => `"${option.label}"=${JSON.stringify(shortValue(option.value))}`).join(', ')
    return options.length > MAX_SHOWN_OPTIONS ? `${shown}, … (${options.length - MAX_SHOWN_OPTIONS} more)` : shown
}

function shortValue(value: unknown): unknown {
    if (!isObject(value)) {
        return value
    }
    const key = OBJECT_KEY_FIELDS.map((field) => value[field]).find((candidate) => typeof candidate === 'string' || typeof candidate === 'number')
    return isNil(key) ? value : { id: key }
}

function stepKind(step: Step): string {
    switch (step.type) {
        case FlowActionType.PIECE:
            return `${shortPieceName(step.settings.pieceName)}/${step.settings.actionName ?? ''}`
        case FlowTriggerType.PIECE:
            return `${shortPieceName(step.settings.pieceName)}/${step.settings.triggerName ?? ''}`
        case FlowActionType.ROUTER:
            return `router [${step.settings.branches.map((branch) => branch.branchName).join(' | ')}]`
        case FlowActionType.LOOP_ON_ITEMS:
            return 'loop'
        case FlowActionType.CODE:
            return 'code'
        default:
            return step.type
    }
}

function shortPieceName(pieceName: string): string {
    return pieceName.replace(/^@activepieces\/piece-/, '')
}

export const buildFlowReview = {
    resolveDropdownLabels,
    flowStepStates,
    labelNotes,
    findProblems,
    formatProblem,
    summarizeStep,
}

const DROPDOWN_TYPES = new Set<PropertyType>([
    PropertyType.DROPDOWN,
    PropertyType.MULTI_SELECT_DROPDOWN,
    PropertyType.STATIC_DROPDOWN,
    PropertyType.STATIC_MULTI_SELECT_DROPDOWN,
])
const MAX_SHOWN_OPTIONS = 15
const OBJECT_KEY_FIELDS = ['id', 'key', 'value']
const UNMATCHABLE_OPTION = { label: '', value: undefined }
const REASON_PATTERN = /^(\S+) (is missing|has an invalid value)$/

type PieceProperty = PiecePropertyMap[string]

type DropdownOption = { label: string, value: unknown }

type LabelResolution = {
    input: Record<string, unknown>
    resolved: string[]
    problems: FlowProblem[]
}

export type FlowStepState = {
    displayName: string
    state: 'ok' | 'problem' | 'skipped'
}

export type FlowProblem = {
    step: string
    field?: string
    message: string
}
