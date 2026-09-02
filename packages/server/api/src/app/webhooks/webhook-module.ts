import { Readable } from 'node:stream'
import { buffer as streamToBuffer } from 'node:stream/consumers'
import { XMLParser } from 'fast-xml-parser'
import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { webhookController } from './webhook-controller'
import { captureRawBodyWhileStreaming, isBinaryContentType, isMultipartContentType } from './webhook-request-converter'

export const webhookModule: FastifyPluginAsync = async (app) => {
    // Capture rawBody so signature-verifying triggers can check it. String-parsed types are
    // buffered whole; binary bodies keep streaming to storage and retain only a capped copy, so a
    // large upload is never held in memory. Multipart is tapped in webhook-request-converter
    // instead: @fastify/multipart pipes request.raw itself, so consuming the payload here would
    // starve busboy of the parts.
    app.addHook('preParsing', async (request, _reply, payload) => {
        // isMultipart() isn't set this early (it's flagged during content-type parsing), so
        // detect streamed types from the header directly.
        const contentType = request.headers['content-type']
        if (isMultipartContentType(contentType)) {
            return payload
        }
        if (isBinaryContentType(contentType)) {
            return captureRawBodyWhileStreaming({ request, payload })
        }
        const raw = await streamToBuffer(payload)
        request.rawBody = raw.toString('utf8')
        return Readable.from(raw)
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

    // Binary bodies pass through as a raw stream so webhook-request-converter can stream them
    // straight to storage instead of buffering the whole file in memory.
    const streamThroughBinary = (_request: FastifyRequest, payload: Readable, done: (err: Error | null, body?: Readable) => void) => done(null, payload)
    app.addContentTypeParser(/^image\/.*/, streamThroughBinary)
    app.addContentTypeParser(/^video\/.*/, streamThroughBinary)
    app.addContentTypeParser(/^audio\/.*/, streamThroughBinary)
    app.addContentTypeParser('application/pdf', streamThroughBinary)
    app.addContentTypeParser('application/zip', streamThroughBinary)
    app.addContentTypeParser('application/gzip', streamThroughBinary)
    app.addContentTypeParser('text/csv', streamThroughBinary)
    // octet-stream has a global buffering parser; override it (scoped to webhook routes) to stream.
    app.removeContentTypeParser('application/octet-stream')
    app.addContentTypeParser('application/octet-stream', streamThroughBinary)

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
