import { Readable } from 'stream'
import { isNil } from '@activepieces/core-utils'
import { Flow, FlowStatus } from '@activepieces/shared'
import { XMLParser } from 'fast-xml-parser'
import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowService } from '../flows/flow/flow.service'
import { projectService } from '../project/project-service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { webhookController } from './webhook-controller'
import { isBinaryContentType, streamWebhookBinaryBody } from './webhook-request-converter'

const STREAMED_BINARY_PARSER_PATTERNS = [
    /^image\/.*/,
    /^video\/.*/,
    /^audio\/.*/,
    'application/pdf',
    'application/zip',
    'application/gzip',
    'application/octet-stream',
]

export const webhookModule: FastifyPluginAsync = async (app) => {
    // Resolve the flow before the body is parsed so large uploads to unknown flows are
    // rejected before we stream them anywhere (webhook endpoints are unauthenticated).
    // The resolved project/platform is reused by the streaming file sink.
    app.addHook('onRequest', async (request, reply) => {
        const flowId = (request.params as { flowId?: string }).flowId
        if (isNil(flowId)) {
            return
        }
        const flow = await flowService(request.log).getOneById(flowId)
        if (isNil(flow)) {
            if (isStreamedContentType(request)) {
                await reply.status(StatusCodes.NOT_FOUND).send({})
            }
            return
        }
        // A streamed upload is persisted to storage during body parsing, before the
        // controller's disabled-flow guard runs. Reject it here for any flow that guard
        // would reject, so a webhook that never executes leaves no orphaned file behind.
        if (isStreamedContentType(request) && !await willAcceptStreamedUpload(request, flow)) {
            await reply.status(StatusCodes.NOT_FOUND).send({})
            return
        }
        const platformId = await projectService(request.log).getPlatformId(flow.projectId)
        request.webhookContext = { projectId: flow.projectId, platformId, flowId }
    })

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

    // Binary bodies are streamed straight to object storage while the request body is still
    // being parsed (the stream is only live during this phase — deferring the read to the
    // handler loses the socket data). octet-stream is buffered by a parent scope (app.ts) —
    // override it here so webhooks stream it instead.
    app.removeContentTypeParser('application/octet-stream')
    for (const pattern of STREAMED_BINARY_PARSER_PATTERNS) {
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

// Mirrors the saveSampleData computation in webhook-controller: an ENABLED flow always
// accepts, and a DISABLED flow only accepts uploads for sample-data capture — the
// draft/test routes (always simulate) or a production route with an active simulate
// trigger source. Handshake requests are never binary/multipart, so they need no branch.
async function willAcceptStreamedUpload(request: FastifyRequest, flow: Flow): Promise<boolean> {
    if (flow.status === FlowStatus.ENABLED) {
        return true
    }
    const url = request.routeOptions.url ?? ''
    if (url.endsWith('/draft') || url.endsWith('/draft/sync') || url.endsWith('/test')) {
        return true
    }
    return triggerSourceService(request.log).existsByFlowId({ flowId: flow.id, simulate: true })
}

function isStreamedContentType(request: FastifyRequest): boolean {
    const contentType = request.headers['content-type']
    if (isNil(contentType)) {
        return false
    }
    return contentType.toLowerCase().trimStart().startsWith('multipart/') || isBinaryContentType(contentType)
}
