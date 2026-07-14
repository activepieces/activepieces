import { createServer, IncomingMessage, Server } from 'http'
import { AddressInfo } from 'net'
import { Readable } from 'stream'
import { FastifyBaseLogger } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { s3Helper } from '../../../../src/app/file/s3-helper'

let endpoint: string

vi.mock('../../../../src/app/file/file.service', () => ({
    fileRepo: vi.fn(),
}))

vi.mock('../../../../src/app/helper/exception-handler', () => ({
    exceptionHandler: { handle: vi.fn() },
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: {
        get: vi.fn((prop: string) => {
            if (prop === 'S3_ENDPOINT') {
                return endpoint
            }
            if (prop === 'S3_REGION') {
                return 'us-east-1'
            }
            return undefined
        }),
        getOrThrow: vi.fn((prop: string) => {
            if (prop === 'S3_BUCKET') {
                return 'test-bucket'
            }
            return 'test-credential'
        }),
        getBoolean: vi.fn().mockReturnValue(false),
    },
}))

type CapturedRequest = {
    method: string
    body: string
}

const captured: CapturedRequest[] = []
let server: Server

const log = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
} as unknown as FastifyBaseLogger

describe('s3Helper.uploadStream', () => {
    beforeAll(async () => {
        server = createServer((req: IncomingMessage, res) => {
            const chunks: Buffer[] = []
            req.on('data', (chunk) => chunks.push(chunk))
            req.on('end', () => {
                captured.push({ method: req.method ?? '', body: Buffer.concat(chunks).toString('utf8') })
                res.writeHead(200, { 'content-type': 'application/xml', ETag: '"test-etag"' })
                res.end()
            })
        })
        await new Promise<void>((resolve) => server.listen(0, resolve))
        endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    })

    beforeEach(() => {
        captured.length = 0
    })

    it('streams the body to s3 and returns the counted size', async () => {
        const payload = 'hello streaming world'
        const stream = Readable.from([Buffer.from(payload)])

        const result = await s3Helper(log).uploadStream({ s3Key: 'project/p1/FLOW_STEP_FILE/f1', stream, maxBytes: 1024 })

        expect(result).toEqual({ s3Key: 'project/p1/FLOW_STEP_FILE/f1', size: payload.length })
        const putRequest = captured.find((request) => request.method === 'PUT')
        expect(putRequest?.body).toBe(payload)
    })

    it('aborts and rejects when the stream exceeds maxBytes', async () => {
        const stream = Readable.from([Buffer.alloc(50, 1), Buffer.alloc(50, 1)])

        await expect(
            s3Helper(log).uploadStream({ s3Key: 'project/p1/FLOW_STEP_FILE/f2', stream, maxBytes: 10 }),
        ).rejects.toMatchObject({ statusCode: 413 })
    })
})
