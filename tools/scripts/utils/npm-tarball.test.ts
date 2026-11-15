import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { npmTarball } from './npm-tarball'

const PIECE = { name: '@activepieces/piece-microsoft-365-planner', version: '0.4.0' }
const TARBALL_URL = 'https://registry.npmjs.org/@activepieces/piece-microsoft-365-planner/-/piece-microsoft-365-planner-0.4.0.tgz'

const mockRegistry = ({ statuses }: { statuses: (number | 'network-error')[] }): { url: string, method: string | undefined }[] => {
    const calls: { url: string, method: string | undefined }[] = []
    spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        calls.push({ url: String(input), method: init?.method })
        const status = statuses[Math.min(calls.length, statuses.length) - 1]
        if (status === 'network-error') {
            throw new TypeError('fetch failed')
        }
        return new Response(null, { status })
    })
    return calls
}

describe('npmTarball.waitUntilDownloadable', () => {
    beforeEach(() => {
        spyOn(console, 'info').mockImplementation(() => undefined)
        spyOn(globalThis, 'setTimeout').mockImplementation(((handler: () => void) => {
            handler()
            return 0
        }) as unknown as typeof setTimeout)
    })

    afterEach(() => {
        mock.restore()
    })

    it('returns at once when the tarball is already downloadable', async () => {
        const calls = mockRegistry({ statuses: [200] })

        expect(await npmTarball.waitUntilDownloadable(PIECE)).toBe(true)
        expect(calls).toEqual([{ url: TARBALL_URL, method: 'HEAD' }])
    })

    it('keeps polling the tarball while npm answers 404 or the request fails', async () => {
        const calls = mockRegistry({ statuses: [404, 'network-error', 404, 200] })

        expect(await npmTarball.waitUntilDownloadable(PIECE)).toBe(true)
        expect(calls).toHaveLength(4)
    })

    it('gives up after 60 attempts when the tarball never becomes downloadable', async () => {
        const calls = mockRegistry({ statuses: [404] })

        expect(await npmTarball.waitUntilDownloadable(PIECE)).toBe(false)
        expect(calls).toHaveLength(60)
    })

    it('builds the tarball url of an unscoped package', async () => {
        const calls = mockRegistry({ statuses: [200] })

        await npmTarball.waitUntilDownloadable({ name: 'left-pad', version: '1.3.0' })
        expect(calls[0].url).toBe('https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz')
    })
})
