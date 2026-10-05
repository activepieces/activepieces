import { AIProviderName } from '@activepieces/core-utils'
import { AiModelCandidate, AiStepAction, ExecuteAiJobData, ReportAiKeyOutcomeRequest } from '@activepieces/shared'
import { APICallError } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const generateCalls: { modelId: string, maxRetries: number | undefined }[] = []
const failuresByModel = new Map<string, () => unknown>()

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    aiUtils: {
        createModel: (args: Record<string, unknown>) => ({ modelId: args['modelId'] }),
        buildWebSearchToolsOrThrow: () => ({}),
    },
}))

vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    generateText: async ({ model, maxRetries, onStepFinish }: { model: { modelId: string }, maxRetries?: number, onStepFinish?: () => void }) => {
        generateCalls.push({ modelId: model.modelId, maxRetries })
        const failure = failuresByModel.get(model.modelId)
        if (failure !== undefined) {
            const thrown = failure()
            if (thrown === STEP_THEN_FAIL) {
                onStepFinish?.()
                throw providerError(429)
            }
            throw thrown
        }
        return { text: 'positive', toolCalls: [{ input: { total: 42 } }], response: { body: {} } }
    },
}))

const { executeAiJob } = await import('../../../../../src/lib/execute/jobs/ai/execute-ai')

const STEP_THEN_FAIL = Symbol('step-then-fail')

function providerError(statusCode: number, responseBody = '{"error":"x"}'): APICallError {
    return new APICallError({ message: `HTTP ${statusCode}`, url: 'https://llm.example/v1', requestBodyValues: {}, statusCode, responseBody, isRetryable: statusCode >= 429 })
}

function candidate(modelId: string, status: AiModelCandidate['status'] = 'active'): AiModelCandidate {
    return { provider: AIProviderName.OPENAI, providerConfigId: `key-${modelId}`, auth: { apiKey: 'k' }, config: {}, modelId, status }
}

function tierJob(overrides: Partial<ExecuteAiJobData> = {}): ExecuteAiJobData {
    return {
        requestId: 'request-1',
        projectId: 'project-1',
        platformId: 'platform-1',
        flowId: 'flow-1',
        flowRunId: 'run-1',
        action: AiStepAction.CLASSIFY_TEXT,
        text: 'great product',
        categories: ['positive', 'negative'],
        provider: AIProviderName.OPENAI,
        modelId: 'main',
        modelTierId: 'tier-1',
        ...overrides,
    } as ExecuteAiJobData
}

function contextWith(candidates: AiModelCandidate[]): { ctx: Parameters<typeof executeAiJob.execute>[0], reports: ReportAiKeyOutcomeRequest[] } {
    const reports: ReportAiKeyOutcomeRequest[] = []
    const ctx = {
        apiClient: {
            resolveAiModelCandidates: async () => ({ tierName: 'Expert', candidates }),
            reportAiKeyOutcome: async (input: ReportAiKeyOutcomeRequest) => {
                reports.push(input)
            },
            resolveAiProvider: async () => {
                throw new Error('a tier step must not resolve a specific key')
            },
        },
        log: { info: () => undefined, warn: () => undefined, error: () => undefined },
    } as unknown as Parameters<typeof executeAiJob.execute>[0]
    return { ctx, reports }
}

async function run(candidates: AiModelCandidate[], overrides: Partial<ExecuteAiJobData> = {}): Promise<{ response: unknown, reports: ReportAiKeyOutcomeRequest[] }> {
    const { ctx, reports } = contextWith(candidates)
    const result = await executeAiJob.execute(ctx, tierJob(overrides))
    return { response: 'response' in result ? result.response : undefined, reports }
}

describe('a tier step falls back on provider failures', () => {
    beforeEach(() => {
        generateCalls.length = 0
        failuresByModel.clear()
    })

    it('answers from the next model when the main one is rate limited', async () => {
        failuresByModel.set('main', () => providerError(429))
        const { response, reports } = await run([candidate('main'), candidate('backup')])

        expect(response).toEqual({ output: { answer: 'positive' } })
        expect(generateCalls).toEqual([{ modelId: 'main', maxRetries: 1 }, { modelId: 'backup', maxRetries: undefined }])
        expect(reports).toEqual([expect.objectContaining({ providerConfigId: 'key-main', signal: expect.objectContaining({ statusCode: 429 }) })])
    })

    it('stops on a bad request, since every model would get the same one', async () => {
        failuresByModel.set('main', () => providerError(400))
        const { response } = await run([candidate('main'), candidate('backup')])

        expect(response).toEqual({ failure: 'HTTP 400' })
        expect(generateCalls.map((call) => call.modelId)).toEqual(['main'])
    })

    it('stops on its own errors and never reports them against the key', async () => {
        failuresByModel.set('main', () => new Error('Unable to classify the text into the provided categories.'))
        const { response, reports } = await run([candidate('main'), candidate('backup')])

        expect(response).toEqual({ failure: 'Unable to classify the text into the provided categories.' })
        expect(generateCalls.map((call) => call.modelId)).toEqual(['main'])
        expect(reports).toEqual([])
    })

    it('names the tier and every model when all of them fail, never the keys', async () => {
        failuresByModel.set('main', () => providerError(503))
        failuresByModel.set('backup', () => providerError(429))
        const { response } = await run([candidate('main'), candidate('backup')])

        expect(response).toEqual({ failure: 'All 2 models in tier Expert failed (main, backup). Last error: HTTP 429' })
    })

    it('does not fall back once a web search step already ran', async () => {
        failuresByModel.set('main', () => STEP_THEN_FAIL)
        const { response } = await run([candidate('main'), candidate('backup')], { action: AiStepAction.ASK_AI, prompt: 'news?' })

        expect(response).toEqual({ failure: 'HTTP 429' })
        expect(generateCalls.map((call) => call.modelId)).toEqual(['main'])
    })

    it('reports a success only for a key that was not healthy', async () => {
        const { reports } = await run([candidate('main', 'unreachable'), candidate('backup')])
        expect(reports).toEqual([{ platformId: 'platform-1', providerConfigId: 'key-main', signal: { statusCode: 200 } }])

        const healthy = await run([candidate('main')])
        expect(healthy.reports).toEqual([])
    })

    it('keeps the provider status through the extract wrapper', async () => {
        failuresByModel.set('main', () => providerError(503))
        const { response } = await run([candidate('main'), candidate('backup')], {
            action: AiStepAction.EXTRACT_STRUCTURED_DATA,
            text: 'total 42',
            schema: { mode: 'simple', fields: [{ name: 'total', type: 'number', isRequired: true }] },
        })

        expect(response).toEqual({ output: { answer: { total: 42 } } })
        expect(generateCalls.map((call) => call.modelId)).toEqual(['main', 'backup'])
    })
})
