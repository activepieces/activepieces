import { FileSizeError } from '@activepieces/shared'
import { createFilesService } from '../../src/lib/services/step-files.service'

const SERVICE_PARAMS = {
    stepName: 'step_1',
    flowId: 'flow-id',
    engineToken: 'test-token',
    apiUrl: 'http://localhost:3000/',
}

describe('step-files service', () => {

    beforeEach(() => {
        process.env.AP_MAX_FILE_SIZE_MB = '10'
        process.env.AP_FILE_STORAGE_LOCATION = 'DB'
        process.env.AP_S3_USE_SIGNED_URLS = 'false'
    })

    it('throws when data is a plain Object', async () => {
        const files = createFilesService(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: {} as any }),
        ).rejects.toThrow('Expected file data to be a Buffer, but received Object')
    })

    it('throws when data is a string', async () => {
        const files = createFilesService(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: 'hello' as any }),
        ).rejects.toThrow('Expected file data to be a Buffer, but received string')
    })

    it('throws when data is undefined', async () => {
        const files = createFilesService(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: undefined as any }),
        ).rejects.toThrow('Expected file data to be a Buffer, but received undefined')
    })

    it('throws when file exceeds size limit', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = '1'
        const files = createFilesService(SERVICE_PARAMS)
        const twoMbBuffer = Buffer.alloc(2 * 1024 * 1024)
        await expect(
            files.write({ fileName: 'big.bin', data: twoMbBuffer }),
        ).rejects.toThrow(FileSizeError)
    })
})
