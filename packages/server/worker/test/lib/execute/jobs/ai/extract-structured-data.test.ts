import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, AIProviderName } from '@activepieces/core-utils'
import { AiStepAction, ExtractStructuredDataJobData, ResolveAiProviderResponse, WorkerJobType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const generateCalls: Record<string, unknown>[] = []

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    aiUtils: {
        createModel: (args: Record<string, unknown>) => ({ modelId: args['modelId'] }),
    },
}))

vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    generateText: async (args: Record<string, unknown>) => {
        generateCalls.push(args)
        return { toolCalls: [{ input: { total: 42 } }] }
    },
}))

const { extractStructuredData } = await import('../../../../../src/lib/execute/jobs/ai/extract-structured-data')

describe('extract structured data tool choice', () => {
    beforeEach(() => {
        generateCalls.length = 0
    })

    for (const modelId of ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-1', 'anthropic/claude-opus-5.5', 'anthropic/claude-fable-5.1', 'us.anthropic.claude-sonnet-5-5-v1:0']) {
        it(`asks ${modelId} to call the tool instead of forcing it, since the model rejects forced tool choice`, async () => {
            const extracted = await extract({ modelId })

            expect(generateCalls[0]['toolChoice']).toBe('auto')
            expect(generateCalls[0]['instructions']).toContain('extractData')
            expect(extracted).toEqual({ total: 42 })
        })
    }

    for (const modelId of ['claude-opus-5', 'claude-sonnet-5', 'claude-fable-5', 'claude-haiku-5-5', 'anthropic/claude-haiku-4.5', 'gpt-5.6', 'mistral-large-latest']) {
        it(`keeps forcing the tool call on ${modelId}`, async () => {
            await extract({ modelId })

            expect(generateCalls[0]['toolChoice']).toBe('required')
            expect(generateCalls[0]).not.toHaveProperty('instructions')
        })
    }
})

function extract({ modelId }: { modelId: string }): Promise<unknown> {
    return extractStructuredData({
        data: JOB_DATA,
        resolved: RESOLVED,
        modelId,
        flowStep: FLOW_STEP,
        billing: BILLING,
        files: [],
    })
}

const FLOW_STEP = {
    projectId: 'project-1',
    platformId: 'platform-1',
    flowId: 'flow-1',
    runId: 'run-1',
}

const JOB_DATA: ExtractStructuredDataJobData = {
    schemaVersion: 1,
    jobType: WorkerJobType.EXECUTE_AI,
    requestId: 'request-1',
    projectId: FLOW_STEP.projectId,
    platformId: FLOW_STEP.platformId,
    flowId: FLOW_STEP.flowId,
    flowRunId: FLOW_STEP.runId,
    action: AiStepAction.EXTRACT_STRUCTURED_DATA,
    provider: AIProviderName.ANTHROPIC,
    modelId: 'claude-opus-5-5',
    text: 'an invoice total of 42',
    schema: { mode: 'simple', fields: [{ name: 'total', type: 'number', isRequired: true }] },
}

const BILLING: ActivepiecesAiBilling = {
    source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
    platformId: FLOW_STEP.platformId,
    projectId: FLOW_STEP.projectId,
    flowRun: { flowId: FLOW_STEP.flowId, flowRunId: FLOW_STEP.runId },
}

const RESOLVED: ResolveAiProviderResponse = {
    provider: AIProviderName.ANTHROPIC,
    providerConfigId: 'config-1',
    auth: { apiKey: 'key' },
    config: {},
}
