import { AiRouterEvaluationError, AiRouterMatchMode, ChooseAiRouteResponse, tryCatch } from '@activepieces/shared'
import { z } from 'zod'

const TIMEOUT_MS = 10_000

export const aiRouterApi = {
    async choose({ apiUrl, engineToken, state, question, options, matchMode }: ChooseParams): Promise<ChooseAiRouteResponse> {
        const url = `${apiUrl}v1/engine/ai-router`
        const startedAt = Date.now()
        const response = await global.fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineToken}`,
            },
            body: JSON.stringify({ state, question, options, matchMode }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        }).catch((error: unknown) => {
            const timedOut = error instanceof Error && error.name === 'TimeoutError'
            const reason = timedOut
                ? `did not answer within ${TIMEOUT_MS} ms`
                : `could not be reached (${String(error)})`
            throw new AiRouterEvaluationError({ message: `${url} ${reason} after ${Date.now() - startedAt} ms`, cause: error })
        })

        if (!response.ok) {
            const reason = await apiErrorReason(response)
            throw new AiRouterEvaluationError({ message: `${url} answered ${response.status} after ${Date.now() - startedAt} ms${reason}` })
        }

        const parsed = ChooseAiRouteResponse.safeParse(await response.json())
        if (!parsed.success) {
            throw new AiRouterEvaluationError({ message: `${url} answered with an unexpected body after ${Date.now() - startedAt} ms` })
        }
        return parsed.data
    },
}

async function apiErrorReason(response: Response): Promise<string> {
    const { data } = await tryCatch(() => response.json())
    const parsed = ApiErrorBody.safeParse(data)
    return parsed.success ? `: ${parsed.data.params.message}` : ''
}

const ApiErrorBody = z.object({ params: z.object({ message: z.string() }) })

type ChooseParams = {
    apiUrl: string
    engineToken: string
    state: string
    question: string
    options: Record<string, string>
    matchMode: AiRouterMatchMode
}
