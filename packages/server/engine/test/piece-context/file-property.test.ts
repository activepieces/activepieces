import { ApFileRef } from '@activepieces/pieces-framework'

function mockFetchOnce(body: Uint8Array[]): void {
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            body.forEach((chunk) => controller.enqueue(chunk))
            controller.close()
        },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(stream, { status: 200 }),
    )
}

describe('ApFileRef.buffer', () => {
    beforeEach(() => {
        process.env.AP_MAX_FILE_SIZE_MB = '1'
        vi.restoreAllMocks()
    })

    it('returns the full contents when under the cap', async () => {
        mockFetchOnce([new Uint8Array([1, 2, 3, 4])])
        const ref = new ApFileRef({ url: 'http://files.local/a.bin', filename: 'a.bin' })
        const buffer = await ref.buffer()
        expect(buffer).toEqual(Buffer.from([1, 2, 3, 4]))
    })

    it('throws once the stream exceeds AP_MAX_FILE_SIZE_MB, without buffering past it', async () => {
        const half = new Uint8Array(700 * 1024)
        mockFetchOnce([half, half, half])
        const ref = new ApFileRef({ url: 'http://files.local/big.bin', filename: 'big.bin' })
        await expect(ref.buffer()).rejects.toThrow('exceeds the 1MB buffer limit')
    })
})
