import Fastify, { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { vi } from 'vitest'

vi.mock('../../../../src/app/file/file.service', () => ({
    fileService: () => ({ save: vi.fn() }),
}))

vi.mock('../../../../src/app/webhooks/webhook-controller', () => {
    const webhookController: FastifyPluginAsync = async (app) => {
        app.post('/:flowId', async (request) => ({ body: request.body, rawBody: request.rawBody }))
    }
    return { webhookController }
})

import { webhookModule } from '../../../../src/app/webhooks/webhook-module'

describe('webhook content types', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = Fastify()
        await app.register(webhookModule)
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    const post = (contentType: string, payload: string) => app.inject({
        method: 'POST',
        url: '/v1/webhooks/abc',
        headers: { 'content-type': contentType },
        payload,
    })

    it('accepts application/cloudevents-batch+json with a charset and keeps rawBody', async () => {
        const res = await post('application/cloudevents-batch+json; charset=utf-8', '[]')
        expect(res.statusCode).toBe(200)
        expect(res.json()).toEqual({ body: [], rawBody: '[]' })
    })

    it('accepts application/cloudevents+json', async () => {
        const event = { specversion: '1.0', type: 'qbo.customer.created.v1', id: '1' }
        const res = await post('application/cloudevents+json', JSON.stringify(event))
        expect(res.statusCode).toBe(200)
        expect(res.json().body).toEqual(event)
    })

    it('accepts other +json types regardless of case', async () => {
        const res = await post('Application/Vnd.Api+JSON', '{"data":1}')
        expect(res.statusCode).toBe(200)
        expect(res.json().body).toEqual({ data: 1 })
    })

    it('maps an empty +json body to an empty object', async () => {
        const res = await post('application/cloudevents+json', '')
        expect(res.statusCode).toBe(200)
        expect(res.json().body).toEqual({})
    })

    it('rejects malformed +json with 400', async () => {
        const res = await post('application/cloudevents+json', '{not json')
        expect(res.statusCode).toBe(400)
    })

    it('still parses application/json', async () => {
        const res = await post('application/json; charset=utf-8', '[]')
        expect(res.statusCode).toBe(200)
        expect(res.json()).toEqual({ body: [], rawBody: '[]' })
    })

    it('still parses application/rss+xml as XML', async () => {
        const res = await post('application/rss+xml', '<rss><channel><title>Feed</title></channel></rss>')
        expect(res.statusCode).toBe(200)
        expect(res.json().body).toEqual({ rss: { channel: { title: 'Feed' } } })
    })
})
