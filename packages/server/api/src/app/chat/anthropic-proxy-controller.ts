import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { streamProxy } from '../helper/stream-proxy'

const OPENROUTER_HOST = 'openrouter.ai'
const OPENROUTER_MODEL_PREFIX = 'anthropic'
const MODEL_FIELD_REGEX = /"model"\s*:\s*"((?:[^"\\]|\\.)*)"/

const AnthropicHeader = {
    API_KEY: 'x-api-key',
    VERSION: 'anthropic-version',
    CONTENT_TYPE: 'content-type',
} as const

const DEFAULT_ANTHROPIC_VERSION = '2023-06-01'

export const anthropicProxyModule: FastifyPluginAsyncZod = async (app) => {

    app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
        done(null, body)
    })

    app.post('/v1/chat/proxy/anthropic/v1/messages', {
        config: { security: securityAccess.public() },
    }, async (request, reply) => {
        const apiKey = extractHeader(request.headers[AnthropicHeader.API_KEY])
        if (!apiKey) {
            return reply.status(401).send({ error: 'Missing x-api-key header' })
        }
        const version = extractHeader(request.headers[AnthropicHeader.VERSION]) ?? DEFAULT_ANTHROPIC_VERSION

        await streamProxy.forward({
            reply,
            hostname: OPENROUTER_HOST,
            path: '/api/v1/messages',
            headers: {
                [AnthropicHeader.CONTENT_TYPE]: 'application/json',
                [AnthropicHeader.API_KEY]: apiKey,
                [AnthropicHeader.VERSION]: version,
            },
            body: rewriteModel(String(request.body)),
        })
    })
}

function extractHeader(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] ?? ''
    return value ?? ''
}

// Rewrites native Anthropic model IDs to OpenRouter format.
// e.g. claude-sonnet-4-6 → anthropic/claude-sonnet-4.6
function rewriteModel(rawBody: string): string {
    const match = MODEL_FIELD_REGEX.exec(rawBody)
    if (!match) return rawBody

    const model = match[1]
    if (model.includes('/')) return rawBody

    const rewritten = `${OPENROUTER_MODEL_PREFIX}/${model}`.replace(/-(\d+)$/, '.$1')
    return rawBody.slice(0, match.index) + `"model":"${rewritten}"` + rawBody.slice(match.index + match[0].length)
}
