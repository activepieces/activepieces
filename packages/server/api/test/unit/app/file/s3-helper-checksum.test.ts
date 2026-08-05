import { createServer, IncomingMessage, Server } from 'http'
import { AddressInfo } from 'net'
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
    headers: IncomingMessage['headers']
    body: string
}

const captured: CapturedRequest[] = []
let server: Server

const log = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
} as unknown as FastifyBaseLogger

describe('s3Helper checksum behavior on S3-compatible providers', () => {
    beforeAll(async () => {
        server = createServer((req, res) => {
            const chunks: Buffer[] = []
            req.on('data', (chunk) => chunks.push(chunk))
            req.on('end', () => {
                captured.push({
                    method: req.method ?? '',
                    headers: req.headers,
                    body: Buffer.concat(chunks).toString('utf8'),
                })
                res.writeHead(200, { 'content-type': 'application/xml' })
                res.end('<?xml version="1.0"?><DeleteResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></DeleteResult>')
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

    it('uploads without aws-chunked encoding or checksum headers', async () => {
        const payload = Buffer.from('regression-test-payload')

        await s3Helper(log).uploadFile('project/p1/FLOW_RUN_LOG/f1', payload)

        const putRequest = captured.find((request) => request.method === 'PUT')
        expect(putRequest).toBeDefined()
        expect(putRequest?.headers['content-encoding'] ?? '').not.toContain('aws-chunked')
        expect(putRequest?.headers['content-md5']).toBeUndefined()
        const checksumHeaders = Object.keys(putRequest?.headers ?? {}).filter((header) => header.startsWith('x-amz-checksum-'))
        expect(checksumHeaders).toEqual([])
        expect(putRequest?.body).toBe('regression-test-payload')
    })

    it('deletes objects with the CRC32C checksum accepted by OCI', async () => {
        await s3Helper(log).deleteFiles(['project/p1/FLOW_RUN_LOG/f1'])

        const deleteRequest = captured.find((request) => request.method === 'POST')
        expect(deleteRequest).toBeDefined()
        expect(deleteRequest?.headers['x-amz-checksum-crc32c']).toBeDefined()
        expect(deleteRequest?.headers['x-amz-checksum-crc32']).toBeUndefined()
    })
})
