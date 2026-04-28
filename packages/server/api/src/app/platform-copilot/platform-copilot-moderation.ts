import { safeHttp } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

type ModerationResponse = {
    results?: { flagged?: boolean }[]
}

export const runModeration = async ({ input, log }: { input: string, log: FastifyBaseLogger }): Promise<{ flagged: boolean }> => {
    const apiKey = system.get(AppSystemProp.OPENAI_API_KEY)
    if (!apiKey) {
        return { flagged: false }
    }
    try {
        const response = await safeHttp.axios.post<ModerationResponse>(
            'https://api.openai.com/v1/moderations',
            { model: MODEL, input },
            {
                headers: { Authorization: `Bearer ${apiKey}` },
                timeout: 5_000,
            },
        )
        const flagged = response.data.results?.[0]?.flagged === true
        return { flagged }
    }
    catch (error) {
        log.warn({ err: error }, '[openai-moderation] moderation call failed; fail-open')
        return { flagged: false }
    }
}

const MODEL = 'omni-moderation-latest'
