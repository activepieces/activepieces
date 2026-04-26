import * as https from 'node:https'
import { FastifyReply } from 'fastify'

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
            reply.raw.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
            proxyRes.pipe(reply.raw)
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
