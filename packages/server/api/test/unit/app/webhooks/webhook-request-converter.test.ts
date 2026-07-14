import { Readable } from 'stream'
import { FAIL_PARENT_ON_FAILURE_HEADER, PARENT_RUN_ID_HEADER } from '@activepieces/shared'
import { extractHeaderFromRequest, isBinaryContentType, streamWebhookBinaryBody } from '../../../../src/app/webhooks/webhook-request-converter'

const { mockS3 } = vi.hoisted(() => ({
    mockS3: { uploadStream: vi.fn(async () => undefined) },
}))
vi.mock('../../../../src/app/file/s3-helper', () => ({ s3Helper: () => mockS3 }))

describe('isBinaryContentType', () => {
    it.each([
        'image/png',
        'image/jpeg',
        'video/mp4',
        'audio/mpeg',
        'application/pdf',
        'application/zip',
        'application/gzip',
        'application/octet-stream',
    ])('should return true for %s', (contentType) => {
        expect(isBinaryContentType(contentType)).toBe(true)
    })

    it.each([
        'application/json',
        'text/plain',
        'text/html',
        'application/xml',
    ])('should return false for %s', (contentType) => {
        expect(isBinaryContentType(contentType)).toBe(false)
    })

    it('should return false for undefined', () => {
        expect(isBinaryContentType(undefined)).toBe(false)
    })

    it('should handle charset suffix', () => {
        expect(isBinaryContentType('image/png; charset=utf-8')).toBe(true)
        expect(isBinaryContentType('application/json; charset=utf-8')).toBe(false)
    })
})

describe('streamWebhookBinaryBody size cap', () => {
    const MB = 1024 * 1024

    beforeEach(() => {
        mockS3.uploadStream.mockClear()
        process.env.AP_FILE_STORAGE_LOCATION = 'S3'
        process.env.AP_MAX_STREAM_FILE_SIZE_MB = '16'
    })

    afterAll(() => {
        delete process.env.AP_FILE_STORAGE_LOCATION
        delete process.env.AP_MAX_STREAM_FILE_SIZE_MB
    })

    function request(contentLength: number): never {
        return {
            url: '/v1/webhooks/flow-1',
            headers: { 'content-type': 'application/octet-stream', 'content-length': String(contentLength) },
            log: { info: () => undefined, error: () => undefined, warn: () => undefined },
        } as never
    }

    it('rejects a declared Content-Length over MAX_STREAM_FILE_SIZE_MB before uploading', async () => {
        await expect(streamWebhookBinaryBody(request(20 * MB), Readable.from([]))).rejects.toThrow()
        expect(mockS3.uploadStream).not.toHaveBeenCalled()
    })

    it('streams a file within the limit', async () => {
        const result = await streamWebhookBinaryBody(request(10 * MB), Readable.from([]))
        expect(mockS3.uploadStream).toHaveBeenCalledTimes(1)
        expect(result.type).toBe('streamed-file')
    })
})

describe('extractHeaderFromRequest', () => {
    it('should extract parentRunId and failParentOnFailure headers', () => {
        const request = {
            headers: {
                [PARENT_RUN_ID_HEADER]: 'run-123',
                [FAIL_PARENT_ON_FAILURE_HEADER]: 'true',
            },
        } as never

        const result = extractHeaderFromRequest(request)
        expect(result.parentRunId).toBe('run-123')
        expect(result.failParentOnFailure).toBe(true)
    })

    it('should return undefined parentRunId when header is missing', () => {
        const request = {
            headers: {},
        } as never

        const result = extractHeaderFromRequest(request)
        expect(result.parentRunId).toBeUndefined()
        expect(result.failParentOnFailure).toBe(false)
    })
})
