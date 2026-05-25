import { vi } from 'vitest'

const mockSave = vi.fn().mockResolvedValue({})

vi.mock('../../../../src/app/file/file.service', () => ({
    fileService: () => ({
        save: mockSave,
    }),
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: {
        getNumberOrThrow: (prop: string) => {
            if (prop === 'WEBHOOK_PAYLOAD_INLINE_THRESHOLD_KB') return 512
            if (prop === 'MAX_WEBHOOK_PAYLOAD_SIZE_MB') return 5
            return 0
        },
    },
}))

import { payloadOffloader } from '../../../../src/app/workers/payload-offloader'

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
} as never

describe('payloadOffloader', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getPayloadSizeInBytes', () => {
        it('should return correct byte size for payload', () => {
            const payload = { key: 'value' }
            const size = payloadOffloader.getPayloadSizeInBytes(payload)
            expect(size).toBe(Buffer.byteLength(JSON.stringify(payload), 'utf8'))
        })

        it('should not over-count buffer bytes for multipart payloads with a raw Buffer', () => {
            const fileSize = 35 * 1024 * 1024
            const buffer = Buffer.alloc(fileSize, 0xff)
            const payload = {
                body: { fileField: 'http://example.com/file.bin' },
                rawBody: buffer,
            }

            const size = payloadOffloader.getPayloadSizeInBytes(payload)

            const naiveSize = Buffer.byteLength(JSON.stringify(payload), 'utf8')
            expect(naiveSize).toBeGreaterThan(fileSize * 2)

            expect(size).toBeGreaterThanOrEqual(fileSize)
            expect(size).toBeLessThan(fileSize + 1024)
        })

        it('should not under-count crafted objects that mimic Buffer JSON shape', () => {
            const payload = {
                rawBody: {
                    type: 'Buffer',
                    data: [0, 'a'.repeat(10 * 1024 * 1024)],
                },
            }

            const size = payloadOffloader.getPayloadSizeInBytes(payload)
            const naiveSize = Buffer.byteLength(JSON.stringify(payload), 'utf8')

            expect(size).toBe(naiveSize)
        })
    })

    describe('offloadPayload', () => {
        it('should always offload small payloads to file storage', async () => {
            const payload = { test: true }
            const result = await payloadOffloader.offloadPayload(mockLogger, payload, 'project-1', 'platform-1')

            expect(result.type).toBe('ref')
            expect('fileId' in result && result.fileId).toBeDefined()
            expect(mockSave).toHaveBeenCalledTimes(1)
        })

        it('should always offload large payloads to file storage', async () => {
            const payload = { data: 'x'.repeat(600 * 1024) }
            const result = await payloadOffloader.offloadPayload(mockLogger, payload, 'project-1', 'platform-1')

            expect(result.type).toBe('ref')
            expect('fileId' in result && result.fileId).toBeDefined()
            expect(mockSave).toHaveBeenCalledTimes(1)
        })
    })

    describe('maybeOffloadPayload', () => {
        it('should return inline payload when size is below threshold', async () => {
            const payload = { test: true }
            const result = await payloadOffloader.maybeOffloadPayload(mockLogger, payload, 'project-1', 'platform-1')

            expect(result).toEqual({ type: 'inline', value: payload })
            expect(mockSave).not.toHaveBeenCalled()
        })

        it('should return ref payload when size exceeds inline threshold', async () => {
            const payload = { data: 'x'.repeat(600 * 1024) }
            const result = await payloadOffloader.maybeOffloadPayload(mockLogger, payload, 'project-1', 'platform-1')

            expect(result.type).toBe('ref')
            expect('fileId' in result && result.fileId).toBeDefined()
            expect(mockSave).toHaveBeenCalledTimes(1)
        })
    })
})
