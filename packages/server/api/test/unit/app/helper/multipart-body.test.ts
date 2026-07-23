import http from 'node:http'
import fastifyMultipart from '@fastify/multipart'
import fastify, { FastifyInstance } from 'fastify'
import { attachMultipartFieldsToBody } from '../../../../src/app/helper/multipart-body'

const BOUNDARY = '----multipartbodytest'

// A real socket, not app.inject(): inject hands busboy the whole payload at once, so every part
// parses synchronously and field-ordering bugs stay hidden. Streaming the file in chunks and
// sending the trailing field last is what actually exercises the ordering guarantee.
async function postChunked(port: number, path: string, parts: { fileBytes: Buffer, trailingField: string }): Promise<string> {
    const head = `--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="doc.txt"\r\nContent-Type: text/plain\r\n\r\n`
    const tail = `\r\n--${BOUNDARY}\r\nContent-Disposition: form-data; name="displayName"\r\n\r\n${parts.trailingField}\r\n--${BOUNDARY}--\r\n`

    return new Promise((resolve, reject) => {
        const req = http.request(
            { port, method: 'POST', path, headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` } },
            (res) => {
                let body = ''
                res.on('data', (chunk) => body += chunk)
                res.on('end', () => resolve(body))
            },
        )
        req.on('error', reject)
        req.write(head)
        const chunkSize = 64 * 1024
        let offset = 0
        const timer = setInterval(() => {
            if (offset < parts.fileBytes.length) {
                req.write(parts.fileBytes.subarray(offset, offset + chunkSize))
                offset += chunkSize
                return
            }
            clearInterval(timer)
            setTimeout(() => req.end(tail), 50)
        }, 10)
    })
}

let app: FastifyInstance
let port: number

beforeAll(async () => {
    app = fastify()
    await app.register(fastifyMultipart, { limits: { fileSize: 25 * 1024 * 1024 } })
    app.post('/upload', { preValidation: attachMultipartFieldsToBody }, async (request) => {
        const body = request.body as Record<string, { value?: string, filename?: string, data?: Buffer }>
        return {
            displayName: body.displayName ?? null,
            filename: body.file?.filename ?? null,
            size: body.file?.data?.length ?? null,
        }
    })
    await app.listen({ port: 0 })
    port = (app.server.address() as { port: number }).port
})

afterAll(async () => {
    await app.close()
})

describe('attachMultipartFieldsToBody', () => {
    it('finds a field appended after the file part on a chunked upload', async () => {
        const response = await postChunked(port, '/upload', {
            fileBytes: Buffer.alloc(512 * 1024, 'a'),
            trailingField: 'My Document',
        })

        expect(JSON.parse(response)).toEqual({
            displayName: 'My Document',
            filename: 'doc.txt',
            size: 512 * 1024,
        })
    })
})
