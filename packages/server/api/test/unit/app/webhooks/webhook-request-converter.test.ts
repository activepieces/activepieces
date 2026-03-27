import { isBinaryContentType, extractHeaderFromRequest } from '../../../../src/app/webhooks/webhook-request-converter'
import { PARENT_RUN_ID_HEADER, FAIL_PARENT_ON_FAILURE_HEADER } from '@activepieces/shared'

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
