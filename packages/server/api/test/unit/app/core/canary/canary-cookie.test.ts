import fastifyCookie from '@fastify/cookie'
import Fastify, { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { canaryCookie, CANARY_COOKIE_NAME } from '../../../../../src/app/core/canary/canary-cookie'

const buildApp = async (secret: string): Promise<FastifyInstance> => {
    const app = Fastify()
    await app.register(fastifyCookie, { secret })
    await app.ready()
    return app
}

const cookiePair = (setCookieHeader: string): string => setCookieHeader.split(';')[0]

describe('canaryCookie', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildApp('test-secret')
    })

    afterEach(async () => {
        await app.close()
    })

    it('builds a hardened Set-Cookie header', () => {
        const header = canaryCookie.buildSetHeader(app)
        expect(header).toContain(`${CANARY_COOKIE_NAME}=`)
        expect(header).toMatch(/Secure/i)
        expect(header).toMatch(/SameSite=Lax/i)
        expect(header).toContain('Path=/')
        // Intentionally readable by JS (not HttpOnly) so the frontend can trigger the canary swap.
        expect(header).not.toMatch(/HttpOnly/i)
    })

    it('round-trips: a freshly built cookie validates', () => {
        const header = cookiePair(canaryCookie.buildSetHeader(app))
        expect(canaryCookie.isValidHeader(app, header)).toBe(true)
    })

    it('rejects a tampered signature', () => {
        const header = cookiePair(canaryCookie.buildSetHeader(app))
        expect(canaryCookie.isValidHeader(app, header.slice(0, -3) + 'xyz')).toBe(false)
    })

    it('rejects an unsigned / forged value', () => {
        expect(canaryCookie.isValidHeader(app, `${CANARY_COOKIE_NAME}=1`)).toBe(false)
    })

    it('rejects a cookie signed with a different secret', async () => {
        const header = cookiePair(canaryCookie.buildSetHeader(app))
        const other = await buildApp('rotated-secret')
        expect(canaryCookie.isValidHeader(other, header)).toBe(false)
        await other.close()
    })

    it('treats absent / unrelated cookies as invalid', () => {
        expect(canaryCookie.isValidHeader(app, undefined)).toBe(false)
        expect(canaryCookie.isValidHeader(app, 'other=1; foo=bar')).toBe(false)
    })
})
