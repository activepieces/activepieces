import { ApFile } from '@activepieces/pieces-framework'
import { describe, expect, it } from 'vitest'
import { fileProcessor } from '../../src/lib/variables/processors/file'

describe('fileProcessor – large Base64 input', () => {
    it('should return an ApFile for a large base64 data URI without stack overflow', async () => {
        // Root cause: the is-base64 library validates via regex, which throws
        // "Maximum call stack size exceeded" (RangeError) on large strings.
        // The error is caught by fileProcessor and returned as null.
        //
        // With the old code: isBase64(...) throws → caught → returns null → test FAILS
        // With the fix (string-based parsing): returns a valid ApFile → test PASSES
        const largeBuffer = Buffer.alloc(5 * 1024 * 1024, 'A')
        const dataUri = `data:application/octet-stream;base64,${largeBuffer.toString('base64')}`
        const result = await fileProcessor(undefined as any, dataUri)
        expect(result).toBeInstanceOf(ApFile)
    })
})

describe('fileProcessor – Base64 data URI edge cases', () => {
    it('should resolve the correct extension for a standard MIME type', async () => {
        const data = Buffer.from('hello').toString('base64')
        const result = await fileProcessor(undefined as any, `data:image/png;base64,${data}`) as ApFile
        expect(result).toBeInstanceOf(ApFile)
        expect(result.extension).toBe('png')
    })

    it('should resolve the correct extension when the MIME type includes parameters', async () => {
        // mime-types strips parameters internally, so text/plain;charset=utf-8 → 'txt'
        const data = Buffer.from('hello').toString('base64')
        const result = await fileProcessor(undefined as any, `data:text/plain;charset=utf-8;base64,${data}`) as ApFile
        expect(result).toBeInstanceOf(ApFile)
        expect(result.extension).toBe('txt')
    })

    it('should return null for a data URI with no MIME type', async () => {
        const data = Buffer.from('hello').toString('base64')
        const result = await fileProcessor(undefined as any, `data:;base64,${data}`)
        expect(result).toBeNull()
    })

    it('should return null for a data URI with empty base64 payload', async () => {
        const result = await fileProcessor(undefined as any, 'data:image/png;base64,')
        expect(result).toBeNull()
    })

    it('should return null for a data URI with a whitespace-only base64 payload', async () => {
        const result = await fileProcessor(undefined as any, 'data:image/png;base64,   \n  ')
        expect(result).toBeNull()
    })

    it('Buffer.from does not throw on invalid base64 – returns an ApFile with best-effort decoded bytes', async () => {
        // Node.js silently ignores invalid base64 characters rather than throwing.
        // This means an invalid payload produces an ApFile with garbage content
        // instead of null. Callers that need strict validation must check the
        // file contents themselves.
        const result = await fileProcessor(undefined as any, 'data:text/plain;base64,!!!not-valid-base64!!!')
        expect(result).toBeInstanceOf(ApFile)
    })

    it('should return null for a plain string that is not a data URI or URL', async () => {
        const result = await fileProcessor(undefined as any, 'just a plain string')
        expect(result).toBeNull()
    })
})
