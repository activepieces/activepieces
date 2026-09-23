import { ActivepiecesAiBilling, AiChargeBasis, aiChargeFor, AIProviderName, isNil, tryCatch } from '@activepieces/core-utils'
import { activepiecesAiCost, safeHttp } from '@activepieces/server-utils'
import { AiRouterMatchMode, ChooseAiRouteResponse, ResolveAiProviderResponse, RouteJobData } from '@activepieces/shared'
import { z } from 'zod'

export async function routeStep({ data, resolved, billing }: RouteStepParams): Promise<ChooseAiRouteResponse> {
    const apiKey = resolved.provider === AIProviderName.ACTIVEPIECES || resolved.provider === AIProviderName.OPENROUTER ? resolved.auth.apiKey : undefined
    if (isNil(apiKey) || apiKey.length === 0) {
        throw new Error('The AI Router has no OpenRouter key to call the routing model with')
    }
    const keyToRoute = Object.fromEntries(Object.keys(data.options).map((route, index) => [`r${index}`, route]))
    const { data: response, error } = await tryCatch(() => safeHttp.axios.post<unknown>(
        DECISIONS_URL,
        {
            model: data.modelId,
            state: { text: data.state },
            questions: buildQuestions({ data, keyToRoute }),
        },
        {
            timeout: TIMEOUT_MS,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        },
    ))
    if (error) {
        throw new Error(`The routing model did not answer: ${describeFailure(error)}`)
    }
    const parsed = DecisionsResponse.safeParse(response.data)
    if (!parsed.success) {
        throw new Error('The routing model answered in a shape the AI Router does not understand')
    }
    const answer = data.matchMode === AiRouterMatchMode.BEST_MATCH
        ? readChoice(parsed.data)
        : readNouls({ decisions: parsed.data, keyToRoute })
    if (isNil(answer)) {
        throw new Error('The routing model did not answer the routing question')
    }
    bill({ data, resolved, billing, decisions: parsed.data })
    return answer
}

function buildQuestions({ data, keyToRoute }: { data: RouteJobData, keyToRoute: Record<string, string> }): Record<string, unknown> {
    if (data.matchMode === AiRouterMatchMode.BEST_MATCH) {
        return {
            [CHOICE_KEY]: { type: 'choice', instructions: data.question, criteria: data.options },
        }
    }
    return Object.fromEntries(Object.entries(keyToRoute).map(([key, route]) => [
        key,
        { type: 'noul', instructions: `${data.question}\n\nAnswer yes only if this route applies: ${route} — ${data.options[route]}` },
    ]))
}

function readChoice(decisions: DecisionsResponse): ChooseAiRouteResponse | undefined {
    const answer = decisions.answers[CHOICE_KEY]
    if (isNil(answer) || isNil(answer.choice)) {
        return undefined
    }
    return {
        matched: [answer.choice],
        ...(isNil(answer.probabilities) ? {} : { probabilities: answer.probabilities }),
    }
}

function readNouls({ decisions, keyToRoute }: { decisions: DecisionsResponse, keyToRoute: Record<string, string> }): ChooseAiRouteResponse | undefined {
    const entries = Object.entries(keyToRoute).flatMap(([key, route]) => {
        const probability = decisions.answers[key]?.noul
        return isNil(probability) ? [] : [{ route, probability }]
    })
    if (entries.length === 0) {
        return undefined
    }
    return {
        matched: entries.filter(({ probability }) => probability >= APPLIES_THRESHOLD).map(({ route }) => route),
        probabilities: Object.fromEntries(entries.map(({ route, probability }) => [route, probability])),
    }
}

function bill({ data, resolved, billing, decisions }: BillParams): void {
    const charge = aiChargeFor({ credentials: resolved })
    if (charge?.basis === AiChargeBasis.PROVIDER_REPORTED_COST) {
        activepiecesAiCost.reportProviderCost({
            billing,
            provider: resolved.provider,
            modelId: data.modelId,
            costUsd: decisions.usage?.cost,
            inputTokens: decisions.usage?.input_tokens,
            outputTokens: decisions.usage?.output_tokens,
            generationId: decisions.id,
        })
        return
    }
    activepiecesAiCost.reportFixedCredits({ billing, provider: resolved.provider, modelId: data.modelId, generationId: decisions.id })
}

function describeFailure(error: unknown): string {
    const failure = HttpFailure.safeParse(error)
    if (!failure.success) {
        return 'the request failed'
    }
    const status = failure.data.response?.status
    if (isNil(status)) {
        return failure.data.message
    }
    const detail = ErrorBody.safeParse(failure.data.response?.data)
    return detail.success ? `HTTP ${status}: ${detail.data.error.message}` : `HTTP ${status}`
}

const DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions'
const CHOICE_KEY = 'route'
const APPLIES_THRESHOLD = 0.5
const TIMEOUT_MS = 8_000

const DecisionsResponse = z.object({
    id: z.string().optional(),
    answers: z.record(z.string(), z.object({
        choice: z.string().optional(),
        probabilities: z.record(z.string(), z.number()).optional(),
        noul: z.number().optional(),
    }).optional()),
    usage: z.object({
        input_tokens: z.number().optional(),
        output_tokens: z.number().optional(),
        cost: z.number().optional(),
    }).optional(),
})

const HttpFailure = z.object({
    message: z.string(),
    response: z.object({
        status: z.number(),
        data: z.unknown().optional(),
    }).optional(),
})

const ErrorBody = z.object({
    error: z.object({ message: z.string() }),
})

type DecisionsResponse = z.infer<typeof DecisionsResponse>

type RouteStepParams = {
    data: RouteJobData
    resolved: ResolveAiProviderResponse
    billing: ActivepiecesAiBilling
}

type BillParams = RouteStepParams & {
    decisions: DecisionsResponse
}
