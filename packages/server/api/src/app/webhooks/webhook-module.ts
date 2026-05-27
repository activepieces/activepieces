import { XMLParser } from 'fast-xml-parser'
import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { webhookController } from './webhook-controller'

export const webhookModule: FastifyPluginAsync = async (app) => {
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

    // Add content type parsers for binary types
    app.addContentTypeParser(
        /^image\/.*/,
        { parseAs: 'buffer' },
        async (_request: FastifyRequest, payload: Buffer) => {
            return payload
        },
    )
    app.addContentTypeParser(
        /^video\/.*/,
        { parseAs: 'buffer' },
        async (_request: FastifyRequest, payload: Buffer) => {
            return payload
        },
    )
    app.addContentTypeParser(
        /^audio\/.*/,
        { parseAs: 'buffer' },
        async (_request: FastifyRequest, payload: Buffer) => {
            return payload
        },
    )
    app.addContentTypeParser(
        'application/pdf',
        { parseAs: 'buffer' },
        async (_request: FastifyRequest, payload: Buffer) => {
            return payload
        },
    )
    app.addContentTypeParser(
        'application/zip',
        { parseAs: 'buffer' },
        async (_request: FastifyRequest, payload: Buffer) => {
            return payload
        },
    )
    app.addContentTypeParser(
        'application/gzip',
        { parseAs: 'buffer' },
        async (_request: FastifyRequest, payload: Buffer) => {
            return payload
        },
    )

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
