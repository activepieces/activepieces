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
            data: jobData(AiStepAction.enum.EXTRACT_STRUCTURED_DATA, {
                text: 'an invoice total of 42',
                schema: { mode: 'simple', fields: [{ name: 'total', type: 'number', isRequired: true }] },
            }),
            resolved: RESOLVED,
            flowStep: FLOW_STEP,
            files: [],
        })

        expect(createModelCalls).toHaveLength(1)
        expect(createModelCalls[0]['flowStep']).toEqual(FLOW_STEP)
    })

    it('generate image builds its language fallback with the flow step, keeping gateway routing on submodel', async () => {
        const ctx = { apiClient: { saveFlowStepFile: async () => ({ fileId: 'file-1', url: 'https://files.example/file-1' }) } }

        await generateImageStep({
            ctx: ctx as unknown as Parameters<typeof generateImageStep>[0]['ctx'],
            data: jobData(AiStepAction.enum.GENERATE_IMAGE, {
                prompt: 'a cat',
                provider: AIProviderName.GOOGLE,
                modelId: 'gemini-2.5-flash-image',
            }),
            resolved: { ...RESOLVED, provider: AIProviderName.GOOGLE },
            flowStep: FLOW_STEP,
            inputImages: [],
        })

        expect(createModelCalls).toHaveLength(1)
        expect(createModelCalls[0]['flowStep']).toEqual(FLOW_STEP)
    })
})
