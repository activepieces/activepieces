import * as https from 'node:https'
import { FastifyReply } from 'fastify'

const ALLOWED_RESPONSE_HEADERS = new Set([
    'content-type',
    'content-length',
    'transfer-encoding',
    'cache-control',
    'date',
])

function filterResponseHeaders(raw: Record<string, string | string[] | undefined>): Record<string, string | string[]> {
    const filtered: Record<string, string | string[]> = {}
    for (const [key, value] of Object.entries(raw)) {
        if (value !== undefined && ALLOWED_RESPONSE_HEADERS.has(key.toLowerCase())) {
            filtered[key] = value
        }
    }
    return filtered
}

async function forward({ reply, hostname, path, headers, body }: StreamProxyParams): Promise<void> {
    const bodyBuffer = Buffer.from(body, 'utf-8')

    await reply.hijack()

    return new Promise<void>((resolve, reject) => {
        const proxyReq = https.request({
            hostname,
            path,
            method: 'POST',
            headers: { ...headers, 'content-length': String(bodyBuffer.byteLength) },
        })

        proxyReq.on('response', (proxyRes) => {
            const safeHeaders = filterResponseHeaders(proxyRes.headers as Record<string, string | string[] | undefined>)
            reply.raw.writeHead(proxyRes.statusCode ?? 502, safeHeaders)
            proxyRes.pipe(reply.raw)
            proxyRes.on('error', (err) => {
                if (!reply.raw.writableEnded) {
                    reply.raw.end()
                }
                reject(err)
            })
            reply.raw.on('finish', resolve)
            reply.raw.on('error', reject)
        })

        proxyReq.on('error', (err) => {
            if (!reply.raw.headersSent) {
                reply.raw.writeHead(502)
            }
            reply.raw.end()
            reject(err)
        })

        proxyReq.end(bodyBuffer)
    })
}

export const streamProxy = { forward }

type StreamProxyParams = {
    reply: FastifyReply
    hostname: string
    path: string
    headers: Record<string, string>
    body: string
}
