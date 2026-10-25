import { isNil, tryCatch } from '@activepieces/core-utils'
import { onCallService } from '@activepieces/server-utils'
import { ReportAiUsageRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore, redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { aiUsageEvent } from './ai-usage-event'

export const aiUsageIngest = (log: FastifyBaseLogger) => ({
    async ingest(input: ReportAiUsageRequest): Promise<void> {
        const { error } = await tryCatch(async () => {
            const { event, runKey } = await aiUsageEvent.build(input)
            const streamLength = await withTimeout(appendOnce({ idempotencyKey: input.idempotencyKey, runKey, payload: JSON.stringify(event) }))
            await pageIfBacklogged({ streamLength, log })
        })
        if (!isNil(error)) {
            log.warn({ event: 'ai-usage.ingest-failed', error, provider: input.provider, model: { id: input.modelId } }, '[aiUsageIngest] Could not record this AI call for usage analytics')
        }
    },
})

async function appendOnce({ idempotencyKey, runKey, payload }: AppendParams): Promise<number> {
    const redis = await redisConnections.useExisting()
    const result = await redis.eval(
        INGEST_SCRIPT,
        3,
        `${SEEN_KEY_PREFIX}${idempotencyKey}`,
        isNil(runKey) ? NO_RUN_KEY : `${RUN_KEY_PREFIX}${runKey}`,
        AI_USAGE_STREAM_KEY,
        payload,
        isNil(runKey) ? '0' : '1',
        String(RUN_KEY_TTL_SECONDS),
        String(STREAM_MAX_LENGTH),
        String(SEEN_KEY_TTL_SECONDS),
    )
    return Number(result)
}

async function withTimeout<T>(work: Promise<T>): Promise<T> {
    const timer: { handle?: NodeJS.Timeout } = {}
    const timeout = new Promise<never>((_, reject) => {
        timer.handle = setTimeout(() => reject(new Error(`AI usage ingest took longer than ${INGEST_TIMEOUT_MS} ms`)), INGEST_TIMEOUT_MS)
    })
    try {
        return await Promise.race([work, timeout])
    }
    finally {
        clearTimeout(timer.handle)
    }
}

async function pageIfBacklogged({ streamLength, log }: { streamLength: number, log: FastifyBaseLogger }): Promise<void> {
    if (streamLength >= STREAM_TRIMMED_AT) {
        await pageOnce({ code: 'AI_USAGE_STREAM_TRIMMED', message: 'The AI usage stream is at its length cap, so the oldest unflushed calls are being dropped. Check the AI_USAGE_FLUSH job.', streamLength, log })
        return
    }
    if (streamLength >= BACKLOG_AT) {
        await pageOnce({ code: 'AI_USAGE_BACKLOG', message: 'AI usage calls are piling up in Redis faster than AI_USAGE_FLUSH writes them to Postgres.', streamLength, log })
    }
}

async function pageOnce({ code, message, streamLength, log }: PageParams): Promise<void> {
    await distributedStore.runOnceWithin(`${PAGE_KEY_PREFIX}${code}`, PAGE_EVERY_SECONDS, () =>
        onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page({ code, message, params: { streamLength } }),
    )
}

const INGEST_SCRIPT = `
if redis.call('EXISTS', KEYS[1]) == 1 then
    return -1
end
local first = 0
if ARGV[2] == '1' and redis.call('SET', KEYS[2], '1', 'NX', 'EX', ARGV[3]) then
    first = 1
end
redis.call('XADD', KEYS[3], 'MAXLEN', '~', ARGV[4], '*', 'e', ARGV[1], 'r', first)
redis.call('SET', KEYS[1], '1', 'EX', ARGV[5])
return redis.call('XLEN', KEYS[3])
`

const SEEN_KEY_PREFIX = 'ai-usage:seen:'
const RUN_KEY_PREFIX = 'ai-usage:run:'
const NO_RUN_KEY = 'ai-usage:run:none'
const PAGE_KEY_PREFIX = 'ai-usage:page:'
const SEEN_KEY_TTL_SECONDS = 600
const RUN_KEY_TTL_SECONDS = 93_600
const STREAM_MAX_LENGTH = 2_000_000
const STREAM_TRIMMED_AT = 1_800_000
const BACKLOG_AT = 300_000
const INGEST_TIMEOUT_MS = 500
const PAGE_EVERY_SECONDS = 30 * 60

export const AI_USAGE_STREAM_KEY = 'ai-usage:events:v1'

type AppendParams = {
    idempotencyKey: string
    runKey: string | null
    payload: string
}

type PageParams = {
    code: string
    message: string
    streamLength: number
    log: FastifyBaseLogger
}
