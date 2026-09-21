import { safeHttp } from '@activepieces/server-utils'
import { ActivepiecesError, AiRouterMatchMode, ChooseAiRouteRequest, ChooseAiRouteResponse, ErrorCode, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const GATEWAY_EVALUATION_URL = 'https://ai-gateway.vercel.sh/v4/ai/evaluation-model'
const GATEWAY_MODEL_ID = 'typesafe-ai/jev'
const GATEWAY_PROTOCOL_VERSION = '0.0.1'
const CHOICE_KEY = 'route'
const TIMEOUT_MS = 8_000

export const aiRouterService = (log: FastifyBaseLogger) => ({
    async choose({ state, question, options, matchMode }: ChooseAiRouteRequest): Promise<ChooseAiRouteResponse> {
        const apiKey = system.get(AppSystemProp.AI_GATEWAY_API_KEY)
        if (isNil(apiKey)) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: { message: 'The AI router needs AP_AI_GATEWAY_API_KEY to be set on this instance' },
            })
        }

        const keyToRoute = Object.fromEntries(Object.keys(options).map((route, index) => [`r${index}`, route]))
        const startedAt = Date.now()
        const { data: response, error } = await tryCatch(() => safeHttp.axios.post<GatewayEvaluationResponse>(
            GATEWAY_EVALUATION_URL,
            {
                state,
                questions: buildQuestions({ question, options, matchMode, keyToRoute }),
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
            log.warn({ durationMs, matchMode, reason: error.message }, 'The AI router gateway call failed')
            throw new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: `The AI router gateway did not answer after ${durationMs} ms` },
            })
        }

        const answer = matchMode === AiRouterMatchMode.BEST_MATCH
            ? readChoiceAnswer(response.data)
            : readBooleanAnswers({ data: response.data, keyToRoute })
        if (isNil(answer)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: 'The AI router model did not answer the routing question' },
            })
        }

        log.info({ matched: answer.matched, matchMode, durationMs }, 'Chose the AI router routes')
        return answer
    },
})

function buildQuestions({ question, options, matchMode, keyToRoute }: BuildQuestionsParams): Record<string, unknown> {
    if (matchMode === AiRouterMatchMode.BEST_MATCH) {
        return {
            [CHOICE_KEY]: { type: 'choice', instructions: question, criteria: options },
        }
    }
    return Object.fromEntries(Object.entries(keyToRoute).map(([key, route]) => [
        key,
        { type: 'boolean', instructions: `${question}\n\nAnswer yes only if this route applies: ${route} — ${options[route]}` },
    ]))
}

function readChoiceAnswer(data: GatewayEvaluationResponse): ChooseAiRouteResponse | undefined {
    const answer = data.answers[CHOICE_KEY]
    if (isNil(answer) || isNil(answer.choice)) {
        return undefined
    }
    return {
        matched: [answer.choice],
        ...(isNil(answer.probabilities) ? {} : { probabilities: answer.probabilities }),
    }
}

function readBooleanAnswers({ data, keyToRoute }: ReadBooleanAnswersParams): ChooseAiRouteResponse | undefined {
    const entries = Object.entries(keyToRoute).flatMap(([key, route]) => {
        const answer = data.answers[key]
        return isNil(answer) || isNil(answer.answer) ? [] : [{ route, yes: answer.answer, probability: answer.probability }]
    })
    if (entries.length === 0) {
        return undefined
    }
    const probabilities = Object.fromEntries(entries.flatMap(({ route, yes, probability }) => {
        const confidence = isNil(probability) ? undefined : (yes ? probability : 1 - probability)
        return isNil(confidence) ? [] : [[route, confidence]]
    }))
    return {
        matched: entries.filter(({ yes }) => yes).map(({ route }) => route),
        ...(Object.keys(probabilities).length === 0 ? {} : { probabilities }),
    }
}

type BuildQuestionsParams = {
    question: string
    options: Record<string, string>
    matchMode: AiRouterMatchMode
    keyToRoute: Record<string, string>
}

type ReadBooleanAnswersParams = {
    data: GatewayEvaluationResponse
    keyToRoute: Record<string, string>
}

type GatewayEvaluationResponse = {
    answers: Record<string, {
        choice?: string
        probabilities?: Record<string, number>
        answer?: boolean
        probability?: number
    } | undefined>
}
