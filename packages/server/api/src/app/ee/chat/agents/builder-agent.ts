import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { generateText, LanguageModel, Output, stepCountIs, ToolLoopAgent, ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { chatToolCategories } from '../tools/chat-tool-categories'

const BUILDER_MAX_STEPS = 30
const FIX_MAX_STEPS = 8

const BUILDER_SYSTEM_PROMPT = readFileSync(
    path.resolve('packages/server/api/src/assets/prompts/chat-builder-prompt.md'),
    'utf8',
)

const EVAL_SYSTEM_PROMPT = readFileSync(
    path.resolve('packages/server/api/src/assets/prompts/chat-builder-eval-prompt.md'),
    'utf8',
)

const FIX_SYSTEM_PROMPT = readFileSync(
    path.resolve('packages/server/api/src/assets/prompts/chat-builder-fix-prompt.md'),
    'utf8',
)

const flowEvaluationSchema = z.object({
    allStepsPresent: z.boolean(),
    missingSteps: z.array(z.string()),
    misconfiguredSteps: z.array(z.object({
        stepName: z.string(),
        issue: z.string(),
        fixable: z.boolean(),
    })),
    overallVerdict: z.enum(['pass', 'fixable', 'needs_user_input']),
})

const TEST_TOOL_NAMES = new Set(['ap_test_step', 'ap_test_flow'])

function filterBuildTools({ allTools, rawMcpTools }: { allTools: ToolSet, rawMcpTools: Record<string, unknown> }): ToolSet {
    const gatedBuildTools = chatToolCategories.filterTools({ allTools, predicate: chatToolCategories.isBuildTool })
    // Use ungated test tools so the builder can test without user approval
    const ungatedTestTools = chatToolCategories.filterTools({ allTools: rawMcpTools, predicate: (name) => TEST_TOOL_NAMES.has(name) })
    return Object.assign({}, gatedBuildTools, ungatedTestTools)
}

function builderPrepareStep({ steps }: { steps: ReadonlyArray<BuilderStepInfo> }): BuilderPrepareStepReturn {
    if (steps.length === 0) return undefined

    const lastStep = steps[steps.length - 1]
    const lastToolCalls = lastStep.toolCalls

    const lastWasMutation = lastToolCalls.some(
        (tc) => chatToolCategories.isMutationTool(tc.toolName),
    )
    const validationCall = lastToolCalls.find(
        (tc) => tc.toolName === 'ap_validate_step_config',
    )

    if (lastWasMutation && !validationCall) {
        return {
            activeTools: ['ap_validate_step_config', 'ap_get_piece_props'],
        }
    }

    if (validationCall && didValidationFail({ steps: [lastStep], validationCall })) {
        return {
            activeTools: chatToolCategories.FIX_TOOL_LIST,
        }
    }

    return undefined
}

function didValidationFail({ steps, validationCall }: {
    steps: ReadonlyArray<BuilderStepInfo>
    validationCall: { toolCallId: string }
}): boolean {
    for (const step of steps) {
        const result = step.toolResults.find(
            (tr) => tr.toolCallId === validationCall.toolCallId,
        )
        if (!result) continue

        const output = result.output
        if (typeof output === 'string') {
            const lower = output.toLowerCase()
            return lower.includes('invalid') || lower.includes('error') || lower.includes('missing')
        }
        if (typeof output === 'object' && output !== null) {
            if (hasBooleanProp(output, 'valid') && !output.valid) return true
            if (hasArrayProp(output, 'errors') && output.errors.length > 0) return true
            if (hasArrayProp(output, 'missing') && output.missing.length > 0) return true
        }
    }
    return false
}

function getProp(obj: unknown, key: string): unknown {
    if (typeof obj !== 'object' || obj === null || !(key in obj)) return undefined
    return (obj as Record<string, unknown>)[key]
}

function hasBooleanProp<K extends string>(obj: unknown, key: K): obj is Record<K, boolean> {
    return typeof getProp(obj, key) === 'boolean'
}

function hasArrayProp<K extends string>(obj: unknown, key: K): obj is Record<K, unknown[]> {
    return Array.isArray(getProp(obj, key))
}

function hasStringProp<K extends string>(obj: unknown, key: K): obj is Record<K, string> {
    return typeof getProp(obj, key) === 'string'
}

function formatBuildPrompt({ flowName, projectId, steps }: BuildSpec): string {
    const stepsDescription = steps.map((step, i) => {
        const parts = [
            `${i + 1}. type: ${step.type}`,
            `   pieceName: ${step.pieceName}`,
        ]
        if (step.triggerName) parts.push(`   triggerName: ${step.triggerName}`)
        if (step.actionName) parts.push(`   actionName: ${step.actionName}`)
        if (step.connectionExternalId) parts.push(`   connectionExternalId: ${step.connectionExternalId}`)
        if (step.config) parts.push(`   config: ${JSON.stringify(step.config)}`)
        return parts.join('\n')
    }).join('\n\n')

    return `Build a flow named "${flowName}" in project ${projectId}.\n\nSteps:\n${stepsDescription}`
}

function determineSuccess({ steps }: { steps: ReadonlyArray<{ toolCalls: ReadonlyArray<{ toolName: string }> }> }): boolean {
    const allToolCalls = steps.flatMap((s) => s.toolCalls)
    const hasCreatedFlow = allToolCalls.some((tc) => tc.toolName === 'ap_create_flow')
    const hasValidatedFlow = allToolCalls.some((tc) => tc.toolName === 'ap_validate_flow')
    return hasCreatedFlow && hasValidatedFlow
}

function extractFlowId({ steps, flowCreation }: {
    steps: ReadonlyArray<{ toolResults: ReadonlyArray<{ toolCallId: string, output: unknown }> }>
    flowCreation: { toolCallId: string }
}): string | undefined {
    for (const step of steps) {
        const toolResult = step.toolResults.find(
            (tr) => tr.toolCallId === flowCreation.toolCallId,
        )
        if (!toolResult || typeof toolResult.output !== 'object' || toolResult.output === null) continue

        const output = toolResult.output
        if (hasStringProp(output, 'id')) return output.id
        if (hasStringProp(output, 'flowId')) return output.flowId

        if (hasArrayProp(output, 'content')) {
            for (const part of output.content) {
                if (hasStringProp(part, 'text')) {
                    // apId() generates 21-char nanoid strings (URL-safe alphabet: A-Za-z0-9_-)
                    const match = part.text.match(/[a-zA-Z0-9_-]{21,}/)
                    if (match) return match[0]
                }
            }
        }
    }
    return undefined
}

function extractToolResultByName({ steps, toolName }: {
    steps: ReadonlyArray<{ toolCalls: ReadonlyArray<{ toolName: string, toolCallId: string }>, toolResults: ReadonlyArray<{ toolCallId: string, output: unknown }> }>
    toolName: string
}): unknown {
    for (let i = steps.length - 1; i >= 0; i--) {
        const call = steps[i].toolCalls.find((tc) => tc.toolName === toolName)
        if (!call) continue
        const result = steps[i].toolResults.find((tr) => tr.toolCallId === call.toolCallId)
        if (result) return result.output
    }
    return undefined
}

async function evaluateBuild({ model, spec, builderSteps, log }: EvaluateBuildParams): Promise<FlowEvaluation | null> {
    const flowStructure = extractToolResultByName({ steps: builderSteps, toolName: 'ap_flow_structure' })
    const validationResult = extractToolResultByName({ steps: builderSteps, toolName: 'ap_validate_flow' })

    if (!flowStructure) {
        log.warn('No ap_flow_structure result found in builder steps, skipping evaluation')
        return null
    }

    const evalPrompt = [
        '## Build Specification',
        formatBuildPrompt(spec),
        '',
        '## Actual Flow Structure',
        JSON.stringify(flowStructure, null, 2),
        ...(validationResult ? ['', '## Validation Result', JSON.stringify(validationResult, null, 2)] : []),
    ].join('\n')

    const { output } = await generateText({
        model,
        system: EVAL_SYSTEM_PROMPT,
        prompt: evalPrompt,
        output: Output.object({ schema: flowEvaluationSchema }),
    })

    log.info({ verdict: output.overallVerdict, missingSteps: output.missingSteps.length, misconfigured: output.misconfiguredSteps.length }, 'Build evaluation complete')
    return output
}

async function executeBuild({ model, buildTools, providerOptions, spec, writer, log }: ExecuteBuildParams): Promise<BuildResult> {
    const prompt = formatBuildPrompt(spec)
    let completedStepCount = 0

    const agent = new ToolLoopAgent({
        model,
        instructions: BUILDER_SYSTEM_PROMPT,
        tools: buildTools,
        providerOptions,
        stopWhen: stepCountIs(BUILDER_MAX_STEPS),
        prepareStep: builderPrepareStep,
        onStepFinish: ({ stepNumber, finishReason, toolCalls }) => {
            log.debug({ stepNumber, finishReason }, 'Builder step finished')
            if (!writer) return

            for (const tc of toolCalls) {
                if (tc.toolName === 'ap_create_flow') {
                    emitBuildProgress({ writer, phase: 'building' })
                }
                else if (tc.toolName === 'ap_update_trigger') {
                    emitBuildProgress({ writer, phase: 'building', stepIndex: 0, status: 'ready' })
                    completedStepCount = 1
                }
                else if (tc.toolName === 'ap_add_step') {
                    emitBuildProgress({ writer, phase: 'building', stepIndex: completedStepCount, status: 'ready' })
                    completedStepCount++
                }
                else if (tc.toolName === 'ap_validate_flow') {
                    emitBuildProgress({ writer, phase: 'validating' })
                }
                else if (tc.toolName === 'ap_test_flow') {
                    emitBuildProgress({ writer, phase: 'testing' })
                }
            }
        },
    })

    const result = await agent.generate({ prompt })

    const allToolCalls = result.steps.flatMap((s) => s.toolCalls)
    const flowCreation = allToolCalls.find((tc) => tc.toolName === 'ap_create_flow')
    const flowId = flowCreation ? extractFlowId({ steps: result.steps, flowCreation }) : undefined

    const success = determineSuccess({ steps: result.steps })

    if (writer) {
        emitBuildProgress({ writer, phase: 'done', status: success ? 'ready' : 'error' })
    }

    return {
        success,
        flowId: flowId ?? null,
        summary: result.text,
        stepsUsed: result.steps.length,
        builderSteps: result.steps,
    }
}

async function executeFix({ model, buildTools, providerOptions, flowId, issues, log }: ExecuteFixParams): Promise<FixResult> {
    const issueList = issues.map((issue, i) =>
        `${i + 1}. Step "${issue.stepName}": ${issue.issue}`,
    ).join('\n')

    const prompt = `Fix these issues in flow ${flowId}:\n\n${issueList}\n\nUse ap_update_step or ap_update_trigger to fix each issue. Validate each fix with ap_validate_step_config.`

    const agent = new ToolLoopAgent({
        model,
        instructions: FIX_SYSTEM_PROMPT,
        tools: buildTools,
        providerOptions,
        stopWhen: stepCountIs(FIX_MAX_STEPS),
        prepareStep: builderPrepareStep,
        onStepFinish: ({ stepNumber, finishReason }) => {
            log.debug({ stepNumber, finishReason }, 'Fix step finished')
        },
    })

    const result = await agent.generate({ prompt })

    return {
        stepsUsed: result.steps.length,
        fixSteps: result.steps,
    }
}

function emitBuildProgress({ writer, phase, stepIndex, status }: {
    writer: StreamWriter
    phase: string
    stepIndex?: number
    status?: string
}) {
    writer.write({
        type: 'data-build-progress',
        data: { phase, stepIndex, status },
        transient: true,
    })
}

type BuildStepSpec = {
    type: 'trigger' | 'action'
    pieceName: string
    actionName?: string
    triggerName?: string
    connectionExternalId?: string
    config?: Record<string, unknown>
}

type BuildSpec = {
    flowName: string
    projectId: string
    steps: BuildStepSpec[]
}

type BuilderStepInfo = {
    readonly toolCalls: ReadonlyArray<{ readonly toolName: string, readonly toolCallId: string }>
    readonly toolResults: ReadonlyArray<{ readonly toolCallId: string, readonly output: unknown }>
}

type BuildResult = {
    success: boolean
    flowId: string | null
    summary: string
    stepsUsed: number
    builderSteps: ReadonlyArray<BuilderStepInfo>
}

type FlowEvaluation = z.infer<typeof flowEvaluationSchema>

type EvaluateBuildParams = {
    model: LanguageModel
    spec: BuildSpec
    builderSteps: ReadonlyArray<BuilderStepInfo>
    log: FastifyBaseLogger
}

type StreamWriter = {
    write(part: Record<string, unknown>): void
}

type ExecuteBuildParams = {
    model: LanguageModel
    buildTools: ToolSet
    providerOptions: SharedV3ProviderOptions
    spec: BuildSpec
    writer: StreamWriter | null
    log: FastifyBaseLogger
}

type ExecuteFixParams = {
    model: LanguageModel
    buildTools: ToolSet
    providerOptions: SharedV3ProviderOptions
    flowId: string
    issues: Array<{ stepName: string, issue: string }>
    log: FastifyBaseLogger
}

type FixResult = {
    stepsUsed: number
    fixSteps: ReadonlyArray<BuilderStepInfo>
}

type BuilderPrepareStepReturn = {
    activeTools?: string[]
} | undefined

export const builderAgent = {
    executeBuild,
    evaluateBuild,
    executeFix,
    filterBuildTools,
}

