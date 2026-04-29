import { Writable } from 'node:stream'
import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { loggerRedact } from '../src/logger-redact'

describe('loggerRedact', () => {
    it('redacts the Authorization request header', () => {
        const out = capture((log) => {
            log.info({ req: { headers: { authorization: 'Bearer secret-jwt' } } }, 'msg')
        })
        expect(out).not.toContain('secret-jwt')
        expect(out).toContain('[REDACTED]')
    })

    it('redacts the Cookie request header and outbound Set-Cookie', () => {
        const out = capture((log) => {
            log.info({
                req: { headers: { cookie: 'session=abc123' } },
                res: { headers: { 'set-cookie': 'session=xyz789' } },
            }, 'msg')
        })
        expect(out).not.toContain('abc123')
        expect(out).not.toContain('xyz789')
    })

    it('redacts access_token and refresh_token at one level deep', () => {
        const out = capture((log) => {
            log.info({ oauth: { access_token: 'real-access', refresh_token: 'real-refresh' } }, 'msg')
        })
        expect(out).not.toContain('real-access')
        expect(out).not.toContain('real-refresh')
    })

    it('redacts access_token at two levels deep (connection.auth shape)', () => {
        const out = capture((log) => {
            log.info({ connection: { auth: { access_token: 'real-secret' } } }, 'msg')
        })
        expect(out).not.toContain('real-secret')
        expect(out).toContain('[REDACTED]')
    })

    it('redacts password at any depth up to two levels', () => {
        const out = capture((log) => {
            log.info({ a: { b: { password: 'p@ssw0rd' } } }, 'msg')
        })
        expect(out).not.toContain('p@ssw0rd')
    })

    it('redacts the connection value blob', () => {
        const out = capture((log) => {
            log.info({ connection: { value: 'encrypted-creds' } }, 'msg')
        })
        expect(out).not.toContain('encrypted-creds')
    })

    it('redacts a nested connection.value (e.g. flow.connection.value)', () => {
        const out = capture((log) => {
            log.info({ flow: { connection: { value: 'nested-encrypted' } } }, 'msg')
        })
        expect(out).not.toContain('nested-encrypted')
    })

    it('does not redact unrelated `value` fields (dropdown options, form fields)', () => {
        const out = capture((log) => {
            log.info({
                option: { label: 'Slack', value: 'slack' },
                field: { name: 'priority', value: 'high' },
            }, 'msg')
        })
        expect(out).toContain('slack')
        expect(out).toContain('high')
    })

    it('does not touch unrelated fields', () => {
        const out = capture((log) => {
            log.info({ user: { id: 'u_42', firstName: 'Khaled' } }, 'msg')
        })
        expect(out).toContain('u_42')
        expect(out).toContain('Khaled')
    })

    it('redacts axios error response body', () => {
        const out = capture((log) => {
            log.error({ err: { response: { data: { access_token: 'leaked' } } } }, 'msg')
        })
        expect(out).not.toContain('leaked')
    })
})

function capture(emit: (log: pino.Logger) => void): string {
    const chunks: Buffer[] = []
    const stream = new Writable({
        write(chunk: Buffer, _enc, cb) {
            chunks.push(chunk)
            cb()
        },
    })
    const log = pino({ redact: loggerRedact }, stream)
    emit(log)
    return Buffer.concat(chunks).toString('utf-8')
}
