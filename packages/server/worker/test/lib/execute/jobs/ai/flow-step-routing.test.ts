import { AIProviderName } from '@activepieces/core-utils'
import { AiStepAction, ExecuteAiJobData, ResolveAiProviderResponse } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createModelCalls: Record<string, unknown>[] = []

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    aiUtils: {
        createModel: (args: Record<string, unknown>) => {
            createModelCalls.push(args)
            return { modelId: args['modelId'] }
        },
        createModelForImages: () => undefined,
        buildWebSearchToolsOrThrow: () => ({}),
    },
}))

vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    generateText: async () => ({
        text: 'ok',
        toolCalls: [{ input: { total: 42 } }],
        response: { body: {} },
        files: [{ base64: Buffer.from('png').toString('base64'), uint8Array: new Uint8Array() }],
    }),
}))

const { extractStructuredData } = await import('../../../../../src/lib/execute/jobs/ai/extract-structured-data')
const { generateImageStep } = await import('../../../../../src/lib/execute/jobs/ai/generate-image')
const { executeAiJob } = await import('../../../../../src/lib/execute/jobs/ai/execute-ai')

const FLOW_STEP = {
    projectId: 'project-1',
    platformId: 'platform-1',
    flowId: 'flow-1',
    runId: 'run-1',
}

function jobData(action: AiStepAction, overrides: Partial<ExecuteAiJobData> = {}): ExecuteAiJobData {
    return {
        requestId: 'request-1',
        projectId: FLOW_STEP.projectId,
        platformId: FLOW_STEP.platformId,
        flowId: FLOW_STEP.flowId,
        flowRunId: FLOW_STEP.runId,
        waitpointId: 'waitpoint-1',
        action,
        provider: AIProviderName.MISTRAL,
        modelId: 'mistral-large-latest',
        ...overrides,
    } as ExecuteAiJobData
}

const RESOLVED: ResolveAiProviderResponse = {
    provider: AIProviderName.MISTRAL,
    providerConfigId: 'config-1',
    auth: { apiKey: 'key' },
    config: {},
}

describe('flowStep reaches every model built on the worker', () => {
    beforeEach(() => {
        createModelCalls.length = 0
    })

    it('extract structured data builds its model with the flow step, so Mistral is not re-routed through OpenRouter', async () => {
        await extractStructuredData({
            data: jobData(AiStepAction.EXTRACT_STRUCTURED_DATA, {
                text: 'an invoice total of 42',
                schema: { mode: 'simple', fields: [{ name: 'total', type: 'number', isRequired: true }] },
            }),
            resolved: RESOLVED,
            flowStep: FLOW_STEP,
        })

        expect(createModelCalls).toHaveLength(1)
        expect(createModelCalls[0]['flowStep']).toEqual(FLOW_STEP)
    })

    it('generate image builds its language fallback with the flow step, keeping gateway routing on submodel', async () => {
        const ctx = { apiClient: { saveFlowStepFile: async () => ({ fileId: 'file-1', url: 'https://files.example/file-1' }) } }

        await generateImageStep({
            ctx: ctx as unknown as Parameters<typeof generateImageStep>[0]['ctx'],
            data: jobData(AiStepAction.GENERATE_IMAGE, {
                prompt: 'a cat',
                provider: AIProviderName.GOOGLE,
                modelId: 'gemini-2.5-flash-image',
            }),
            resolved: { ...RESOLVED, provider: AIProviderName.GOOGLE },
            flowStep: FLOW_STEP,
        })

        expect(createModelCalls).toHaveLength(1)
        expect(createModelCalls[0]['flowStep']).toEqual(FLOW_STEP)
    })

    it('builds the flow step inside the job itself, so extract keeps it without the caller supplying one', async () => {
        const ctx = jobContext()

        await executeAiJob.execute(ctx, jobData(AiStepAction.EXTRACT_STRUCTURED_DATA, {
            text: 'an invoice total of 42',
            schema: { mode: 'simple', fields: [{ name: 'total', type: 'number', isRequired: true }] },
        }))

        expect(createModelCalls).toHaveLength(1)
        expect(createModelCalls[0]['flowStep']).toEqual(FLOW_STEP)
    })

    it('builds the flow step inside the job itself for generate image too', async () => {
        const ctx = jobContext({ provider: AIProviderName.GOOGLE })

        await executeAiJob.execute(ctx, jobData(AiStepAction.GENERATE_IMAGE, {
            prompt: 'a cat',
            provider: AIProviderName.GOOGLE,
            modelId: 'gemini-2.5-flash-image',
        }))

        expect(createModelCalls).toHaveLength(1)
        expect(createModelCalls[0]['flowStep']).toEqual(FLOW_STEP)
    })
})

function jobContext({ provider = AIProviderName.MISTRAL }: { provider?: AIProviderName } = {}): Parameters<typeof executeAiJob.execute>[0] {
    return {
        apiClient: {
            resolveAiProvider: async () => ({ ...RESOLVED, provider }),
            resumeAiStep: async () => undefined,
            saveFlowStepFile: async () => ({ fileId: 'file-1', url: 'https://files.example/file-1' }),
        },
        log: { warn: () => undefined, error: () => undefined },
    } as unknown as Parameters<typeof executeAiJob.execute>[0]
}

describe('the image model gets the flow step too, so gateway routing is not silently compat', () => {
    it('hands the flow step to the image model builder, not just the language fallback', async () => {
        const forImages: Record<string, unknown>[] = []
        const serverUtils = await import('@activepieces/server-utils')
        const original = serverUtils.aiUtils.createModelForImages
        serverUtils.aiUtils.createModelForImages = (args: Record<string, unknown>) => {
            forImages.push(args)
            return undefined
        }

        try {
            await executeAiJob.execute(jobContext({ provider: AIProviderName.GOOGLE }), jobData(AiStepAction.GENERATE_IMAGE, {
                prompt: 'a cat',
                provider: AIProviderName.GOOGLE,
                modelId: 'gemini-2.5-flash-image',
            }))
        }
        finally {
            serverUtils.aiUtils.createModelForImages = original
        }

        expect(forImages).toHaveLength(1)
        expect(forImages[0]['flowStep']).toEqual(FLOW_STEP)
    })
})
