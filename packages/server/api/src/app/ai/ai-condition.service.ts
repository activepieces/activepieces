import { aiUtils } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, EvaluateAiConditionResponse, isNil } from '@activepieces/shared'
import { experimental_evaluate } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const MAX_RETRIES = 1
const QUESTION_KEY = 'matches'

export const aiConditionService = (log: FastifyBaseLogger) => ({
    async evaluate({ text, question }: EvaluateParams): Promise<EvaluateAiConditionResponse> {
        const apiKey = system.get(AppSystemProp.AI_GATEWAY_API_KEY)
        if (isNil(apiKey)) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: { message: 'AI conditions need AP_AI_GATEWAY_API_KEY to be set on this instance' },
            })
        }
        const startedAt = Date.now()
        const { answers } = await experimental_evaluate({
            model: aiUtils.createGatewayEvaluationModel({ apiKey }),
            state: text,
            maxRetries: MAX_RETRIES,
            questions: {
                [QUESTION_KEY]: {
                    type: 'boolean',
                    instructions: question,
                },
            },
        })
        const { probability } = answers[QUESTION_KEY]
        log.info({ probability, durationMs: Date.now() - startedAt }, 'Evaluated an AI router condition')
        return { probability }
    },
})

type EvaluateParams = {
    text: string
    question: string
}
