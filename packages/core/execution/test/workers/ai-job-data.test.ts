import { describe, expect, it } from 'vitest'
import { AiStepAction, ExecuteAiJobData, WorkerJobType } from '../../src/index'

const base = {
    schemaVersion: 1,
    jobType: WorkerJobType.EXECUTE_AI,
    requestId: 'request-1',
    projectId: 'project-1',
    platformId: 'platform-1',
    flowId: 'flow-1',
    flowRunId: 'run-1',
    waitpointId: 'waitpoint-1',
    provider: 'openai',
    modelId: 'gpt-4o',
    prompt: 'hello',
}

describe('what an AI step job accepts', () => {
    it('takes each action with only the fields that action needs', () => {
        expect(ExecuteAiJobData.safeParse({ ...base, action: AiStepAction.ASK_AI }).success).toBe(true)
        expect(ExecuteAiJobData.safeParse({ ...base, action: AiStepAction.SUMMARIZE_TEXT, text: 'a long text' }).success).toBe(true)
        expect(ExecuteAiJobData.safeParse({ ...base, action: AiStepAction.CLASSIFY_TEXT, text: 'warm', categories: ['sunny'] }).success).toBe(true)
    })

    it('still accepts a step whose optional fields were never filled in', () => {
        expect(ExecuteAiJobData.safeParse({ ...base, action: AiStepAction.CLASSIFY_TEXT }).success).toBe(true)
        expect(ExecuteAiJobData.safeParse({ ...base, action: AiStepAction.SUMMARIZE_TEXT }).success).toBe(true)
    })

    it('accepts a saved flow that carries fields belonging to another action, rather than failing it at enqueue time', () => {
        const parsed = ExecuteAiJobData.safeParse({ ...base, action: AiStepAction.ASK_AI, text: 'stale', categories: ['stale'] })

        expect(parsed.success).toBe(true)
    })

    it('keeps the fields the action does use', () => {
        const parsed = ExecuteAiJobData.parse({ ...base, action: AiStepAction.CLASSIFY_TEXT, text: 'warm', categories: ['sunny', 'rainy'] })

        expect(parsed).toMatchObject({ action: AiStepAction.CLASSIFY_TEXT, text: 'warm', categories: ['sunny', 'rainy'] })
    })

    it('takes the two actions that carry files and a schema', () => {
        expect(ExecuteAiJobData.safeParse({
            ...base,
            action: AiStepAction.EXTRACT_STRUCTURED_DATA,
            text: 'an invoice',
            files: [{ fileId: 'file-1', mimeType: 'application/pdf' }],
            schema: { mode: 'simple', fields: [{ name: 'total' }] },
        }).success).toBe(true)
        expect(ExecuteAiJobData.safeParse({
            ...base,
            action: AiStepAction.GENERATE_IMAGE,
            files: [{ fileId: 'file-2', mimeType: 'image/png' }],
            advancedOptions: { size: '1024x1024' },
        }).success).toBe(true)
    })

    it('no longer needs a prompt, because Extract and Generate Image do not have one', () => {
        expect(ExecuteAiJobData.safeParse({ ...base, action: AiStepAction.EXTRACT_STRUCTURED_DATA, prompt: undefined }).success).toBe(true)
    })

    it('still rejects an action nobody ships', () => {
        expect(ExecuteAiJobData.safeParse({ ...base, action: 'TRANSLATE' }).success).toBe(false)
    })
})
