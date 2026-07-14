import { Readable } from 'stream'
import { isNil } from '@activepieces/core-utils'
import { XMLParser } from 'fast-xml-parser'
import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { webhookController } from './webhook-controller'
import { isBinaryContentType, STREAMED_BINARY_CONTENT_TYPES, streamWebhookBinaryBody } from './webhook-request-converter'

export const webhookModule: FastifyPluginAsync = async (app) => {
    // rawBody is required for HMAC signature verification, but only ever over text bodies.
    // Capture it for every content-type EXCEPT the streamed ones (binary + multipart), which
    // would otherwise be buffered whole in memory and defeat streaming. A fresh stream is
    // re-fed so the downstream text parsers behave byte-identically.
    app.addHook('preParsing', async (request, _reply, payload) => {
        if (isNil(request.headers['content-type']) || isStreamedContentType(request)) {
            return payload
        }
        const bodyLimit = request.routeOptions.bodyLimit ?? app.initialConfig.bodyLimit
        const chunks: Buffer[] = []
        let totalBytes = 0
        for await (const chunk of payload) {
            totalBytes += chunk.length
            if (!isNil(bodyLimit) && totalBytes > bodyLimit) {
                const error: Error & { statusCode?: number } = new Error('Request body is too large')
                error.statusCode = StatusCodes.REQUEST_TOO_LONG
                throw error
            }
            chunks.push(Buffer.from(chunk))
        }
        const buffer = Buffer.concat(chunks)
        request.rawBody = buffer.toString('utf8')
        return Readable.from(buffer)
    })

    app.addContentTypeParser(
        'application/json',
        { parseAs: 'string' },
        (_req, body: string, done) => {
            if (body == null || body.trim() === '') {
                return done(null, {})
            }

            try {
                done(null, JSON.parse(body))
            }
            catch (err) {
                const error: Error & { statusCode?: number } = err instanceof Error ? err : new Error('JSON parsing failed')
                error.statusCode = 400
                done(error, undefined)
            }
        },
    )

    // The body stream is only live during parsing, so binary bodies are consumed here:
    // streamed straight to S3 (identity-free key), or buffered on non-S3. octet-stream is
    // buffered by a parent scope (app.ts) — override it here so webhooks handle it instead.
    app.removeContentTypeParser('application/octet-stream')
    for (const pattern of STREAMED_BINARY_CONTENT_TYPES) {
        app.addContentTypeParser(pattern, (request: FastifyRequest, payload: Readable) => streamWebhookBinaryBody(request, payload))
    }

    // processEntities: false prevents DOCTYPE entity declarations from overriding
    // built-in XML entities (&lt; &gt; &amp; etc), blocking injection attacks.
    const xmlParser = new XMLParser({ processEntities: false })
    app.addContentTypeParser(
        ['text/xml', 'application/xml', 'application/rss+xml'],
        { parseAs: 'string' },
        (_req, body: string, done) => {
            try {
                done(null, xmlParser.parse(body))
            }
            catch (err) {
                const error: Error & { statusCode?: number } = err instanceof Error ? err : new Error('XML parsing failed')
                error.statusCode = 400
                done(error, undefined)
            }
        },
    )

    await app.register(webhookController, { prefix: '/v1/webhooks' })
}

function isStreamedContentType(request: FastifyRequest): boolean {
    const contentType = request.headers['content-type']
    if (isNil(contentType)) {
        return false
    }
    return contentType.toLowerCase().trimStart().startsWith('multipart/') || isBinaryContentType(contentType)
}
