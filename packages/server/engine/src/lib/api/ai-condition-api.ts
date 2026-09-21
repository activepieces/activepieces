import { DEFAULT_AI_CONDITION_THRESHOLD, EngineGenericError, EvaluateAiConditionResponse } from '@activepieces/shared'

const TIMEOUT_MS = 10_000

export const aiConditionApi = {
    async matches({ apiUrl, engineToken, text, question, threshold }: MatchesParams): Promise<boolean> {
        const response = await requestProbability({ apiUrl, engineToken, text, question })
        return response.probability >= (threshold ?? DEFAULT_AI_CONDITION_THRESHOLD)
    },
}

async function requestProbability({ apiUrl, engineToken, text, question }: RequestParams): Promise<EvaluateAiConditionResponse> {
    const url = `${apiUrl}v1/engine/ai-condition`
    const startedAt = Date.now()
    const response = await global.fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
        },
        body: JSON.stringify({ text, question }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((error: unknown) => {
        const timedOut = error instanceof Error && error.name === 'TimeoutError'
        const reason = timedOut
            ? `did not answer within ${TIMEOUT_MS} ms`
            : `could not be reached (${String(error)})`
        throw new EngineGenericError('AiConditionEvaluationError', `${url} ${reason} after ${Date.now() - startedAt} ms`)
    })
    if (!response.ok) {
        throw new EngineGenericError('AiConditionEvaluationError', `AI condition returned ${response.status} ${response.statusText}`)
    }
    const parsed = EvaluateAiConditionResponse.safeParse(await response.json())
    if (!parsed.success) {
        throw new EngineGenericError('AiConditionEvaluationError', 'AI condition returned a response without a probability')
    }
    return parsed.data
}

type RequestParams = {
    apiUrl: string
    engineToken: string
    text: string
    question: string
}

type MatchesParams = RequestParams & {
    threshold?: number
}
