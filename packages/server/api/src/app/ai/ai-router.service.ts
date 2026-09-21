import { safeHttp } from '@activepieces/server-utils'
import { ActivepiecesError, ChooseAiRouteRequest, ChooseAiRouteResponse, ErrorCode, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const GATEWAY_EVALUATION_URL = 'https://ai-gateway.vercel.sh/v4/ai/evaluation-model'
const GATEWAY_MODEL_ID = 'typesafe-ai/jev'
const GATEWAY_PROTOCOL_VERSION = '0.0.1'
const QUESTION_KEY = 'route'
const TIMEOUT_MS = 8_000

export const aiRouterService = (log: FastifyBaseLogger) => ({
    async choose({ state, question, options }: ChooseAiRouteRequest): Promise<ChooseAiRouteResponse> {
        const apiKey = system.get(AppSystemProp.AI_GATEWAY_API_KEY)
        if (isNil(apiKey)) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: { message: 'The AI router needs AP_AI_GATEWAY_API_KEY to be set on this instance' },
            })
        }

        const startedAt = Date.now()
        const { data: response, error } = await tryCatch(() => safeHttp.axios.post<GatewayEvaluationResponse>(
            GATEWAY_EVALUATION_URL,
            {
                state,
                questions: {
                    [QUESTION_KEY]: { type: 'choice', instructions: question, criteria: options },
                },
            },
            {
                timeout: TIMEOUT_MS,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'ai-model-id': GATEWAY_MODEL_ID,
                    'ai-evaluation-model-specification-version': '4',
                    'ai-gateway-protocol-version': GATEWAY_PROTOCOL_VERSION,
                },
            },
        ))
        const durationMs = Date.now() - startedAt
        if (error) {
            log.warn({ durationMs, reason: error.message }, 'The AI router gateway call failed')
            throw new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: `The AI router gateway did not answer after ${durationMs} ms` },
            })
        }

        const answer = response.data.answers[QUESTION_KEY]
        if (isNil(answer) || isNil(answer.choice)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: 'The AI router model did not answer the routing question' },
            })
        }

        log.info({ choice: answer.choice, durationMs }, 'Chose an AI router route')
        return {
            choice: answer.choice,
            ...(isNil(answer.probabilities) ? {} : { probabilities: answer.probabilities }),
        }
    },
})

type GatewayEvaluationResponse = {
    answers: Record<string, { choice?: string, probabilities?: Record<string, number> } | undefined>
}
