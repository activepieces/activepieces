import { AIProviderName, ExecuteAiMode } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'

const { executeAi } = vi.hoisted(() => ({ executeAi: vi.fn() }))

vi.mock('../src/lib/worker-socket', () => ({
    workerSocket: { getAiWorkerClient: () => ({ executeAi }) },
}))

const { createAiContext } = await import('../src/lib/piece-context/ai')

describe('createAiContext', () => {
    it('injects the engine-trusted fields and delegates to the worker AI client', async () => {
        executeAi.mockResolvedValue({ text: 'hello from worker' })
        const ai = createAiContext({ engineToken: 'etok', projectId: 'proj-1', flowId: 'flow-1', runId: 'run-1', stepName: 'step_1' })

        const response = await ai.execute({ mode: ExecuteAiMode.TEXT, provider: AIProviderName.OPENAI, model: 'gpt-4.1', prompt: 'hi', actionName: 'askAi' })

        expect(response).toEqual({ text: 'hello from worker' })
        expect(executeAi).toHaveBeenCalledWith({
            mode: ExecuteAiMode.TEXT,
            provider: AIProviderName.OPENAI,
            model: 'gpt-4.1',
            prompt: 'hi',
            actionName: 'askAi',
            engineToken: 'etok',
            projectId: 'proj-1',
            flowId: 'flow-1',
            runId: 'run-1',
            stepName: 'step_1',
        })
    })

    it('always sets the engine token from the engine side (never from the piece)', async () => {
        executeAi.mockResolvedValue({ images: [{ base64: 'aGk=' }] })
        const ai = createAiContext({ engineToken: 'secret-token', projectId: 'p', flowId: 'f', runId: 'r', stepName: 's' })

        await ai.execute({ mode: ExecuteAiMode.IMAGE, provider: AIProviderName.OPENAI, model: 'gpt-image-1', prompt: 'a cat' })

        const lastCall = executeAi.mock.calls.at(-1)?.[0]
        expect(lastCall.engineToken).toBe('secret-token')
        expect(lastCall.runId).toBe('r')
    })
})
