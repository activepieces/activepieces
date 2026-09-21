import { ChooseAiRouteResponse, EngineGenericError } from '@activepieces/shared'

const TIMEOUT_MS = 10_000

export const aiRouterApi = {
    async choose({ apiUrl, engineToken, state, question, options }: ChooseParams): Promise<ChooseAiRouteResponse> {
        const url = `${apiUrl}v1/engine/ai-router`
        const startedAt = Date.now()
        const response = await global.fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineToken}`,
            },
            body: JSON.stringify({ state, question, options }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        }).catch((error: unknown) => {
            const timedOut = error instanceof Error && error.name === 'TimeoutError'
            const reason = timedOut
                ? `did not answer within ${TIMEOUT_MS} ms`
                : `could not be reached (${String(error)})`
            throw new EngineGenericError('AiRouterEvaluationError', `${url} ${reason} after ${Date.now() - startedAt} ms`)
        })

        if (!response.ok) {
            throw new EngineGenericError('AiRouterEvaluationError', `${url} answered ${response.status} ${response.statusText} after ${Date.now() - startedAt} ms`)
        }

        const parsed = ChooseAiRouteResponse.safeParse(await response.json())
        if (!parsed.success) {
            throw new EngineGenericError('AiRouterEvaluationError', `${url} answered with an unexpected body after ${Date.now() - startedAt} ms`)
        }
        return parsed.data
    },
}

type ChooseParams = {
    apiUrl: string
    engineToken: string
    state: string
    question: string
    options: Record<string, string>
}
