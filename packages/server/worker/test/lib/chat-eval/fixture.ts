import { AIProviderName } from '@activepieces/shared'
import { ModelMessage } from 'ai'

export type ChatEvalAssertion =
    | { type: 'neverAskedHow' }
    | { type: 'neverCutOff' }
    | { type: 'noBuildToolBeforePhaseSet' }
    | { type: 'calledBefore', a: string, b: string }
    | { type: 'reachedToolWithin', toolName: string, n: number }
    | { type: 'maxQuestionCards', n: number, toolNames?: string[] }

export type ChatEvalJudgeDimension = {
    dimension: string
    rubric: string
    expectedLabel: 'pass' | 'fail'
}

export type ChatEvalRecordedToolCall = {
    order: number
    toolName: string
    recordedInput?: Record<string, unknown>
    output: unknown
}

export type ChatEvalFixtureModel = {
    provider: AIProviderName
    modelId: string
    tier: { id: string, thinkingBudget: number, modelId: string }
}

export type ChatEvalFixture = {
    id: string
    description: string
    kind: 'regression' | 'capability'
    initialMessages: ModelMessage[]
    userTurns: string[]
    recordedToolCalls: ChatEvalRecordedToolCall[]
    model: ChatEvalFixtureModel
    assertions: ChatEvalAssertion[]
    judge: ChatEvalJudgeDimension[]
}
