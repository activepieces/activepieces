import { safeHttp } from '@activepieces/server-utils'
import { FastifyReply } from 'fastify'

async function forward({ reply, hostname, path, headers, body }: StreamProxyParams): Promise<void> {
    await reply.hijack()
    const response = await safeHttp.axios.request<NodeJS.ReadableStream>({
        method: 'POST',
        url: `https://${hostname}${path}`,
        headers,
        data: body,
        responseType: 'stream',
        validateStatus: () => true,
        maxRedirects: 0,
    })
    reply.raw.writeHead(
        response.status,
        filterResponseHeaders(response.headers as Record<string, string | string[] | undefined>),
    )
    response.data.pipe(reply.raw)
    return new Promise<void>((resolve, reject) => {
        reply.raw.on('finish', resolve)
        reply.raw.on('error', reject)
        response.data.on('error', (err: Error) => {
            if (!reply.raw.writableEnded) reply.raw.end()
            reject(err)
        })
    })
}

function filterResponseHeaders(raw: Record<string, string | string[] | undefined>): Record<string, string | string[]> {
    const filtered: Record<string, string | string[]> = {}
    for (const [key, value] of Object.entries(raw)) {
        if (value !== undefined && ALLOWED_RESPONSE_HEADERS.has(key.toLowerCase())) {
            filtered[key] = value
        }
    }
    return filtered
}

export { filterResponseHeaders }
export const streamProxy = { forward }

const ALLOWED_RESPONSE_HEADERS = new Set([
    'content-type',
    'content-length',
    'transfer-encoding',
    'cache-control',
    'date',
])

type StreamProxyParams = {
    reply: FastifyReply
    hostname: string
    path: string
    headers: Record<string, string>
    body: string
}
