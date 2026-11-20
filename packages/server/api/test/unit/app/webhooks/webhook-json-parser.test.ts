import Fastify, { FastifyPluginAsync } from 'fastify'
import { vi } from 'vitest'

vi.mock('../../../../src/app/webhooks/webhook-controller', () => {
    const mockController: FastifyPluginAsync = async (app) => {
        app.post('/test', async (request) => ({
            body: request.body,
            rawBody: request.rawBody,
        }))
    }
    return { webhookController: mockController }
})

import { webhookModule } from '../../../../src/app/webhooks/webhook-module'

describe('Webhook JSON content-type parser', () => {
    async function buildApp() {
        const app = Fastify()
        await app.register(webhookModule)
        await app.ready()
        return app
    }

    it('should parse application/cloudevents-batch+json with charset parameter', async () => {
        const app = await buildApp()
        try {
            const payload = JSON.stringify([{ specversion: '1.0', type: 'qbo.invoice.created', id: 'evt_1' }])
            const response = await app.inject({
                method: 'POST',
                url: '/v1/webhooks/test',
                headers: {
                    'content-type': 'application/cloudevents-batch+json; charset=utf-8',
                },
                payload,
            })

            expect(response.statusCode).toBe(200)
            expect(response.json()).toEqual({
                body: [{ specversion: '1.0', type: 'qbo.invoice.created', id: 'evt_1' }],
                rawBody: payload,
            })
        }
        finally {
            await app.close()
        }
    })

    it('should parse empty array payload with application/cloudevents-batch+json', async () => {
        const app = await buildApp()
        try {
            const response = await app.inject({
                method: 'POST',
                url: '/v1/webhooks/test',
                headers: {
                    'content-type': 'application/cloudevents-batch+json; charset=utf-8',
                },
                payload: '[]',
            })

            expect(response.statusCode).toBe(200)
            expect(response.json()).toEqual({
                body: [],
                rawBody: '[]',
            })
        }
        finally {
            await app.close()
        }
    })

    it('should parse application/cloudevents+json payloads', async () => {
        const app = await buildApp()
        try {
            const payload = JSON.stringify({ specversion: '1.0', type: 'example.event', data: { ok: true } })
            const response = await app.inject({
                method: 'POST',
                url: '/v1/webhooks/test',
                headers: {
                    'content-type': 'application/cloudevents+json',
                },
                payload,
            })

            expect(response.statusCode).toBe(200)
            expect(response.json()).toEqual({
                body: { specversion: '1.0', type: 'example.event', data: { ok: true } },
                rawBody: payload,
            })
        }
        finally {
            await app.close()
        }
    })

    it('should return 400 for malformed +json payload', async () => {
        const app = await buildApp()
        try {
            const response = await app.inject({
                method: 'POST',
                url: '/v1/webhooks/test',
                headers: {
                    'content-type': 'application/cloudevents-batch+json; charset=utf-8',
                },
                payload: '[{invalid json',
            })

            expect(response.statusCode).toBe(400)
        }
        finally {
            await app.close()
        }
    })
})
