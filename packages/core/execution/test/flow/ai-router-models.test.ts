import { describe, expect, it } from 'vitest'
import { AiRouterActionSettings, AiRouterActionSettingsWithValidation, AiRouterMatchMode, BranchExecutionType } from '../../src/lib/flows/actions/action'
import { aiRouterModels } from '../../src/lib/flows/actions/ai-router-models'

const SETTINGS = {
    text: 'charged twice',
    question: 'Which team?',
    matchMode: AiRouterMatchMode.BEST_MATCH,
    branches: [{ branchType: BranchExecutionType.CONDITION, branchName: 'Billing', description: 'Payments' }],
}

describe('aiRouterModels', () => {
    it('lists every decision model the picker offers', () => {
        expect(aiRouterModels.all.map((model) => model.id)).toEqual([
            'typesafe/jev-1.14',
            'typesafe/jev-1.13',
            'cloudflare/clef',
            'cloudflare/clef-flash',
            'cloudflare/clef-omni',
            'google/gemini-decision-1',
        ])
    })

    it('keeps Jev 1.13 as the default so steps saved before the picker route as they did', () => {
        expect(aiRouterModels.defaultModelId).toBe('typesafe/jev-1.13')
        expect(aiRouterModels.resolve(undefined)).toBe('typesafe/jev-1.13')
    })

    it.each(['typesafe/jev-1.14', 'cloudflare/clef', 'cloudflare/clef-flash', 'cloudflare/clef-omni', 'google/gemini-decision-1'])('keeps %s, which is on the allowlist', (model) => {
        expect(aiRouterModels.resolve(model)).toBe(model)
    })

    it.each(['openai/gpt-5', '', 'typesafe/jev-latest'])('falls back to the default for %j, which is not on the allowlist', (model) => {
        expect(aiRouterModels.resolve(model)).toBe('typesafe/jev-1.13')
    })
})

describe('AI Router step settings keep the picked model', () => {
    it('keeps the model on save and validation', () => {
        expect(AiRouterActionSettings.parse({ ...SETTINGS, model: 'cloudflare/clef' }).model).toBe('cloudflare/clef')
        expect(AiRouterActionSettingsWithValidation.parse({ ...SETTINGS, model: 'cloudflare/clef' }).model).toBe('cloudflare/clef')
    })

    it('still accepts a step saved before the picker existed', () => {
        expect(AiRouterActionSettingsWithValidation.safeParse(SETTINGS).success).toBe(true)
    })
})
