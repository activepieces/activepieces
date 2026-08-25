import http from 'node:http'
import { FetchHttpClient, HttpMethod } from '@activepieces/pieces-common'
import FormData from 'form-data'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const FIELD_MARKER = 'AP-FORENSICS-MULTIPART-9f2c1a'

type CapturedRequest = {
    contentType: string
    rawBody: string
}

describe('claim: FetchHttpClient sends a node form-data body as multipart, not a stringified object', () => {
    let server: http.Server
    let capturePromise: Promise<CapturedRequest>

    beforeEach(async () => {
        capturePromise = new Promise<CapturedRequest>((resolve) => {
            server = http.createServer((req, res) => {
                const chunks: Buffer[] = []
                req.on('data', (chunk) => chunks.push(chunk))
                req.on('end', () => {
                    res.writeHead(200, { 'content-type': 'application/json' })
                    res.end(JSON.stringify({ ok: true }))
                    resolve({
                        contentType: req.headers['content-type'] ?? '',
                        rawBody: Buffer.concat(chunks).toString('utf8'),
                    })
                })
            })
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    })

    afterEach(async () => {
        await new Promise<void>((resolve) => server.close(() => resolve()))
    })

    it('delivers the appended field content over the wire', async () => {
        const address = server.address()
        if (address === null || typeof address === 'string') {
            throw new Error('expected a TCP address')
        }
        const port = address.port

        const form = new FormData()
        form.append('file', Buffer.from(FIELD_MARKER), {
            filename: 'synthetic-upload.txt',
            contentType: 'text/plain',
        })

        const client = new FetchHttpClient()
        await client.sendRequest({
            method: HttpMethod.POST,
            url: `http://127.0.0.1:${port}/upload`,
            body: form,
        })

        const received = await capturePromise
        expect(received.rawBody).not.toContain('[object FormData]')
        expect(received.rawBody).toContain(FIELD_MARKER)
        expect(received.contentType).toMatch(/^multipart\/form-data;\s*boundary=/)
    })
})
