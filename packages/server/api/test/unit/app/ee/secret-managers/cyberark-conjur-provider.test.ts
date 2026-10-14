import http from 'node:http'
import { ErrorCode } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
    process.env['AP_SSRF_ALLOW_LIST'] = '127.0.0.1'
})

import { cyberarkConjurProvider } from '../../../../../src/app/ee/secret-managers/secret-manager-providers/cyberark-conjur-provider'

const TOKEN = 'conjur-access-token'
const secrets: Record<string, string> = {}

const log = { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } as unknown as FastifyBaseLogger

let server: http.Server
let baseUrl: string

beforeAll(async () => {
    server = http.createServer((req, res) => {
        const url = req.url ?? ''
        if (req.method === 'POST' && url.includes('/authenticate')) {
            res.writeHead(200, { 'Content-Type': 'text/plain' })
            res.end(TOKEN)
            return
        }
        const match = url.match(/\/secrets\/[^/]+\/variable\/(.+)$/)
        if (req.method === 'GET' && match) {
            res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
            res.end(secrets[decodeURIComponent(match[1])])
            return
        }
        res.writeHead(404)
        res.end()
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address === null || typeof address === 'string') {
        throw new Error('test server has no port')
    }
    baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
})

const config = () => ({
    url: baseUrl,
    organizationAccountName: 'acme',
    loginId: 'host/app',
    apiKey: 'api-key',
})

describe('cyberarkConjurProvider.getSecret', () => {
    it.each([
        ['plain text', 'my-password'],
        ['digits', '123456'],
        ['zero', '0'],
        ['false', 'false'],
        ['null', 'null'],
        ['json object', '{"user":"a","pass":"b"}'],
        ['quoted string', '"quoted"'],
    ])('returns the raw secret text for %s', async (_label, value) => {
        secrets['app/secret'] = value
        const result = await cyberarkConjurProvider(log).getSecret({ path: 'app/secret' }, config())
        expect(result).toBe(value)
    })

    it('rejects an empty secret', async () => {
        secrets['app/empty'] = ''
        await expect(cyberarkConjurProvider(log).getSecret({ path: 'app/empty' }, config())).rejects.toMatchObject({
            error: {
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: { message: expect.stringContaining('No secret found') },
            },
        })
    })
})

describe('cyberarkConjurProvider.checkConnection', () => {
    it('returns the base64 encoded token', async () => {
        const token = await cyberarkConjurProvider(log).checkConnection(config())
        expect(token).toBe(Buffer.from(TOKEN, 'utf8').toString('base64'))
    })
})
