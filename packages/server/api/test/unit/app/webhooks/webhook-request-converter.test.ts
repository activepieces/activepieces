import { FAIL_PARENT_ON_FAILURE_HEADER, PARENT_RUN_ID_HEADER } from '@activepieces/shared'
import { convertRequest, extractHeaderFromRequest, isBinaryContentType } from '../../../../src/app/webhooks/webhook-request-converter'

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

describe('convertRequest rawBody', () => {
    it('forwards rawBody for string-parsed (signed) content types', async () => {
        const request = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            query: {},
            body: { ok: true },
            rawBody: '{"ok":true}',
            isMultipart: () => false,
        } as never

        const result = await convertRequest(request, 'project-1', 'flow-1')
        expect(result.rawBody).toBe('{"ok":true}')
        expect(result.body).toEqual({ ok: true })
    })
})
