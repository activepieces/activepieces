import { FileType } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { engineFileApi } from '../src/lib/api/engine-file-api'

const PARAMS = {
    engineToken: 'test-token',
    apiUrl: 'http://localhost:3000/',
    fileId: 'file-1',
}

describe('engine→API requests retry Cloudflare origin timeouts', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('retries a 524 on download and returns the file once the origin answers', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(null, { status: 524 }))
            .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))

        const [bytes] = await Promise.all([engineFileApi.download(PARAMS), vi.runAllTimersAsync()])

        expect(fetchSpy).toHaveBeenCalledTimes(2)
        expect(new TextDecoder().decode(bytes)).toBe('{"ok":true}')
    })

    it('retries a 524 on upload and returns the read url once the origin answers', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(null, { status: 524 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ readUrl: 'http://read/file-1' }), { status: 200 }))

        const [result] = await Promise.all([
            engineFileApi.upload({ ...PARAMS, type: FileType.FLOW_RUN_LOG, data: new TextEncoder().encode('{}') }),
            vi.runAllTimersAsync(),
        ])

        expect(fetchSpy).toHaveBeenCalledTimes(2)
        expect(result).toEqual({ fileId: 'file-1', readUrl: 'http://read/file-1' })
    })
})
