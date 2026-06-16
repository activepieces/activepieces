import {
    AgentResult,
    AgentStepBlock,
    AI_PIECE_NAME,
    ContentBlockType,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    isNil,
    LogSliceRef,
    LoopStepResult,
    Step,
    StepOutput,
    StepOutputStatus,
    StepOutputType,
} from '@activepieces/shared'

async function extractAiUsage({ steps, flowVersion, fetchSlice }: ExtractParams): Promise<AiUsage> {
    const stepMeta = buildStepMeta(flowVersion)
    const contributions = await collectContributions({ steps, stepMeta, fetchSlice })
    return summarize(contributions)
}

function flowVersionHasAiStep(flowVersion: FlowVersion): boolean {
    return flowStructureUtil.getAllSteps(flowVersion.trigger).some(isAiPieceStep)
}

function isAiPieceStep(step: Step): boolean {
    return step.type === FlowActionType.PIECE && step.settings.pieceName === AI_PIECE_NAME
}

function buildStepMeta(flowVersion: FlowVersion): Map<string, StepMeta> {
    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .filter(isAiPieceStep)
        .reduce((map, step) => map.set(step.name, {
            actionName: step.type === FlowActionType.PIECE ? step.settings.actionName : undefined,
            input: step.type === FlowActionType.PIECE ? asRecord(step.settings.input) : undefined,
        }), new Map<string, StepMeta>())
}

async function collectContributions({ steps, stepMeta, fetchSlice }: CollectParams): Promise<AiContribution[]> {
    const contributions: AiContribution[] = []
    for (const [name, output] of Object.entries(steps)) {
        const meta = stepMeta.get(name)
        if (!isNil(meta)) {
            const contribution = await toContribution({ output, meta, fetchSlice })
            if (!isNil(contribution)) {
                contributions.push(contribution)
            }
        }
        if (output.type === FlowActionType.LOOP_ON_ITEMS) {
            const iterations = (output.output as LoopStepResult | undefined)?.iterations ?? []
            for (const iteration of iterations) {
                contributions.push(...await collectContributions({ steps: iteration, stepMeta, fetchSlice }))
            }
        }
    }
    return contributions
}

async function toContribution({ output, meta, fetchSlice }: ToContributionParams): Promise<AiContribution | null> {
    const isAgent = meta.actionName === RUN_AGENT_ACTION_NAME
    let toolCalls = 0
    if (isAgent) {
        const blocks = await resolveAgentBlocks({ output, fetchSlice })
        if (blocks.length === 0) {
            return null
        }
        toolCalls = blocks.filter((block) => block.type === ContentBlockType.TOOL_CALL).length
    }
    else if (output.status !== StepOutputStatus.SUCCEEDED) {
        return null
    }
    const { provider, model } = resolveProviderModel({ output, meta })
    return { provider, model, toolCalls }
}

async function resolveAgentBlocks({ output, fetchSlice }: ResolveAgentBlocksParams): Promise<AgentStepBlock[]> {
    const raw = output.outputType === StepOutputType.SLICE
        ? await fetchSlice(output.output as LogSliceRef)
        : output.output
    return (raw as AgentResult | undefined)?.steps ?? []
}

function resolveProviderModel({ output, meta }: ResolveProviderModelParams): { provider: string, model: string } {
    const fromLog = extractProviderModel(asRecord(output.input))
    const fromSettings = extractProviderModel(meta.input)
    return {
        provider: fromLog.provider ?? fromSettings.provider ?? UNKNOWN,
        model: fromLog.model ?? fromSettings.model ?? UNKNOWN,
    }
}

function extractProviderModel(input: Record<string, unknown> | undefined): { provider?: string, model?: string } {
    if (isNil(input)) {
        return {}
    }
    const aiProviderModel = asRecord(input.aiProviderModel)
    return {
        provider: cleanString(aiProviderModel?.provider ?? input.provider),
        model: cleanString(aiProviderModel?.model ?? input.model),
    }
}

function summarize(contributions: AiContribution[]): AiUsage {
    const breakdown = contributions.reduce((map, contribution) => {
        const key = `${contribution.provider}|${contribution.model}`
        const entry = map.get(key) ?? { provider: contribution.provider, model: contribution.model, messages: 0, toolCalls: 0 }
        return map.set(key, {
            provider: entry.provider,
            model: entry.model,
            messages: entry.messages + 1,
            toolCalls: entry.toolCalls + contribution.toolCalls,
        })
    }, new Map<string, AiUsageBreakdownEntry>())
    return {
        messages: contributions.length,
        toolCalls: contributions.reduce((sum, contribution) => sum + contribution.toolCalls, 0),
        breakdown: [...breakdown.values()],
    }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
    if (typeof value === 'object' && !isNil(value) && !Array.isArray(value)) {
        return value as Record<string, unknown>
    }
    return undefined
}

function cleanString(value: unknown): string | undefined {
    if (typeof value !== 'string' || value.length === 0 || value === REDACTED_MARKER) {
        return undefined
    }
    return value
}

const RUN_AGENT_ACTION_NAME = 'run_agent'
const UNKNOWN = 'unknown'
const REDACTED_MARKER = '**REDACTED**'

export const aiUsageExtractor = { extractAiUsage, flowVersionHasAiStep }

export type SliceFetcher = (ref: LogSliceRef) => Promise<unknown>

export type AiUsage = {
    messages: number
    toolCalls: number
    breakdown: AiUsageBreakdownEntry[]
}

type ExtractParams = {
    steps: Record<string, StepOutput>
    flowVersion: FlowVersion
    fetchSlice: SliceFetcher
}

type CollectParams = {
    steps: Record<string, StepOutput>
    stepMeta: Map<string, StepMeta>
    fetchSlice: SliceFetcher
}

type ToContributionParams = {
    output: StepOutput
    meta: StepMeta
    fetchSlice: SliceFetcher
}

type ResolveAgentBlocksParams = {
    output: StepOutput
    fetchSlice: SliceFetcher
}

type ResolveProviderModelParams = {
    output: StepOutput
    meta: StepMeta
}

type StepMeta = {
    actionName: string | undefined
    input: Record<string, unknown> | undefined
}

type AiContribution = {
    provider: string
    model: string
    toolCalls: number
}

type AiUsageBreakdownEntry = {
    provider: string
    model: string
    messages: number
    toolCalls: number
}
