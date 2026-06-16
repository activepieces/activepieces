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

async function extractAiUsage({ steps, flowVersion, stepNameToTest, fetchSlice }: ExtractParams): Promise<AiUsage> {
    const aiStepsByName = buildAiStepsByName(flowVersion)
    // In single-step test mode the engine seeds every *other* step with its cached sample output (all
    // marked SUCCEEDED), so only the tested step actually ran this execution. Scope counting to it so
    // testing one AI step doesn't bill the other AI steps in the flow.
    const executedSteps = isNil(stepNameToTest) ? steps : pickStep({ steps, stepName: stepNameToTest })
    const usages = await collectStepAiUsages({ steps: executedSteps, aiStepsByName, fetchSlice })
    return summarize(usages)
}

function pickStep({ steps, stepName }: { steps: Record<string, StepOutput>, stepName: string }): Record<string, StepOutput> {
    const output = steps[stepName]
    return isNil(output) ? {} : { [stepName]: output }
}

function flowVersionHasAiStep(flowVersion: FlowVersion): boolean {
    return flowStructureUtil.getAllSteps(flowVersion.trigger).some(isAiPieceStep)
}

function isAiPieceStep(step: Step): boolean {
    return step.type === FlowActionType.PIECE && step.settings.pieceName === AI_PIECE_NAME
}

function buildAiStepsByName(flowVersion: FlowVersion): Map<string, AiStepConfig> {
    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .filter(isAiPieceStep)
        .reduce((map, step) => map.set(step.name, {
            actionName: step.type === FlowActionType.PIECE ? step.settings.actionName : undefined,
            input: step.type === FlowActionType.PIECE ? asRecord(step.settings.input) : undefined,
        }), new Map<string, AiStepConfig>())
}

async function collectStepAiUsages({ steps, aiStepsByName, fetchSlice }: CollectParams): Promise<AiStepUsage[]> {
    const usages: AiStepUsage[] = []
    for (const [name, output] of Object.entries(steps)) {
        const stepConfig = aiStepsByName.get(name)
        if (!isNil(stepConfig)) {
            const usage = await toStepAiUsage({ output, stepConfig, fetchSlice })
            if (!isNil(usage)) {
                usages.push(usage)
            }
        }
        if (output.type === FlowActionType.LOOP_ON_ITEMS) {
            const iterations = (output.output as LoopStepResult | undefined)?.iterations ?? []
            for (const iteration of iterations) {
                usages.push(...await collectStepAiUsages({ steps: iteration, aiStepsByName, fetchSlice }))
            }
        }
    }
    return usages
}

async function toStepAiUsage({ output, stepConfig, fetchSlice }: ToStepAiUsageParams): Promise<AiStepUsage | null> {
    const isAgent = stepConfig.actionName === RUN_AGENT_ACTION_NAME
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
    const { provider, model } = resolveProviderModel({ output, stepConfig })
    return { provider, model, toolCalls }
}

async function resolveAgentBlocks({ output, fetchSlice }: ResolveAgentBlocksParams): Promise<AgentStepBlock[]> {
    const raw = output.outputType === StepOutputType.SLICE
        ? await fetchSlice(output.output as LogSliceRef)
        : output.output
    return (raw as AgentResult | undefined)?.steps ?? []
}

function resolveProviderModel({ output, stepConfig }: ResolveProviderModelParams): { provider: string, model: string } {
    const fromLog = extractProviderModel(asRecord(output.input))
    const fromSettings = extractProviderModel(stepConfig.input)
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

function summarize(usages: AiStepUsage[]): AiUsage {
    const breakdown = usages.reduce((map, usage) => {
        const key = `${usage.provider}|${usage.model}`
        const entry = map.get(key) ?? { provider: usage.provider, model: usage.model, messages: 0, toolCalls: 0 }
        return map.set(key, {
            provider: entry.provider,
            model: entry.model,
            messages: entry.messages + 1,
            toolCalls: entry.toolCalls + usage.toolCalls,
        })
    }, new Map<string, AiUsageBreakdownEntry>())
    return {
        messages: usages.length,
        toolCalls: usages.reduce((sum, usage) => sum + usage.toolCalls, 0),
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
    stepNameToTest?: string
    fetchSlice: SliceFetcher
}

type CollectParams = {
    steps: Record<string, StepOutput>
    aiStepsByName: Map<string, AiStepConfig>
    fetchSlice: SliceFetcher
}

type ToStepAiUsageParams = {
    output: StepOutput
    stepConfig: AiStepConfig
    fetchSlice: SliceFetcher
}

type ResolveAgentBlocksParams = {
    output: StepOutput
    fetchSlice: SliceFetcher
}

type ResolveProviderModelParams = {
    output: StepOutput
    stepConfig: AiStepConfig
}

type AiStepConfig = {
    actionName: string | undefined
    input: Record<string, unknown> | undefined
}

type AiStepUsage = {
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
