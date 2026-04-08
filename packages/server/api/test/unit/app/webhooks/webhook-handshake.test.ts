import { WebhookHandshakeStrategy } from '@activepieces/shared'
import { isHandshakeRequest } from '../../../../src/app/webhooks/webhook-handshake'

const makePayload = (overrides: { headers?: Record<string, string>, queryParams?: Record<string, string>, body?: unknown, method?: string } = {}) => ({
    headers: overrides.headers ?? {},
    queryParams: overrides.queryParams ?? {},
    body: overrides.body ?? {},
    method: overrides.method ?? 'POST',
})

describe('isHandshakeRequest', () => {
    describe('HEADER_PRESENT strategy', () => {
        it('should return true when header is present', () => {
            const result = isHandshakeRequest({
                payload: makePayload({ headers: { 'x-hook-secret': 'abc' } }),
                handshakeConfiguration: {
                    strategy: WebhookHandshakeStrategy.HEADER_PRESENT,
                    paramName: 'X-Hook-Secret',
                },
            })
            expect(result).toBe(true)
        })

        it('should return false when header is missing', () => {
            const result = isHandshakeRequest({
                payload: makePayload(),
                handshakeConfiguration: {
                    strategy: WebhookHandshakeStrategy.HEADER_PRESENT,
                    paramName: 'X-Hook-Secret',
                },
            })
            expect(result).toBe(false)
        })
    })

    describe('QUERY_PRESENT strategy', () => {
        it('should return true when query param is present', () => {
            const result = isHandshakeRequest({
                payload: makePayload({ queryParams: { hub_challenge: '123' } }),
                handshakeConfiguration: {
                    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
                    paramName: 'hub_challenge',
                },
            })
            expect(result).toBe(true)
        })

        it('should return false when query param is missing', () => {
            const result = isHandshakeRequest({
                payload: makePayload(),
                handshakeConfiguration: {
                    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
                    paramName: 'hub_challenge',
                },
            })
            expect(result).toBe(false)
        })
    })

    describe('BODY_PARAM_PRESENT strategy', () => {
        it('should return true when body param is present', () => {
            const result = isHandshakeRequest({
                payload: makePayload({ body: { challenge: 'test' } }),
                handshakeConfiguration: {
                    strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
                    paramName: 'challenge',
                },
            })
            expect(result).toBe(true)
        })

        it('should return false when body param is missing', () => {
            const result = isHandshakeRequest({
                payload: makePayload({ body: { other: 'test' } }),
                handshakeConfiguration: {
                    strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
                    paramName: 'challenge',
                },
            })
            expect(result).toBe(false)
        })
    })

    describe('NONE strategy', () => {
        it('should return true for HEAD requests', () => {
            const result = isHandshakeRequest({
                payload: makePayload({ method: 'HEAD' }),
                handshakeConfiguration: {
                    strategy: WebhookHandshakeStrategy.NONE,
                },
            })
            expect(result).toBe(true)
        })

        it('should return false for POST requests', () => {
            const result = isHandshakeRequest({
                payload: makePayload(),
                handshakeConfiguration: {
                    strategy: WebhookHandshakeStrategy.NONE,
                },
            })
            expect(result).toBe(false)
        })
    })

    it('should return false when config is null', () => {
        const result = isHandshakeRequest({
            payload: makePayload(),
            handshakeConfiguration: null,
        })
        expect(result).toBe(false)
    })

    it('should return false when strategy is null', () => {
        const result = isHandshakeRequest({
            payload: makePayload(),
            // @ts-expect-error testing invalid handshake configuration
            handshakeConfiguration: {
                strategy: null,
                paramName: 'test',
            },
        })
        expect(result).toBe(false)
    })

    it('should return false when paramName is null', () => {
        const result = isHandshakeRequest({
            payload: makePayload(),
            // @ts-expect-error testing invalid handshake configuration
            handshakeConfiguration: {
                strategy: WebhookHandshakeStrategy.HEADER_PRESENT,
                paramName: null,
            },
        })
        expect(result).toBe(false)
    })
})
