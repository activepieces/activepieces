import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileSystemUtils } from '../src/file-system-utils'

let tempDir: string

beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'server-utils-test-'))
})

afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
})

describe('fileSystemUtils', () => {
    describe('fileExists', () => {
        it('should return true for an existing file', async () => {
            const filePath = join(tempDir, 'exists.txt')
            await writeFile(filePath, 'hello')
            expect(await fileSystemUtils.fileExists(filePath)).toBe(true)
        })

        it('should return false for a non-existent file', async () => {
            const filePath = join(tempDir, 'nope.txt')
            expect(await fileSystemUtils.fileExists(filePath)).toBe(false)
        })
    })

    describe('threadSafeMkdir', () => {
        it('should create a new directory', async () => {
            const dirPath = join(tempDir, 'a', 'b', 'c')
            await fileSystemUtils.threadSafeMkdir(dirPath)
            expect(await fileSystemUtils.fileExists(dirPath)).toBe(true)
        })

        it('should not throw when directory already exists', async () => {
            const dirPath = join(tempDir, 'existing')
            await fileSystemUtils.threadSafeMkdir(dirPath)
            await expect(fileSystemUtils.threadSafeMkdir(dirPath)).resolves.toBeUndefined()
        })
    })

    describe('deleteFile', () => {
        it('should delete an existing file', async () => {
            const filePath = join(tempDir, 'to-delete.txt')
            await writeFile(filePath, 'bye')
            await fileSystemUtils.deleteFile(filePath)
            expect(await fileSystemUtils.fileExists(filePath)).toBe(false)
        })

        it('should not throw when file does not exist', async () => {
            const filePath = join(tempDir, 'nope.txt')
            await expect(fileSystemUtils.deleteFile(filePath)).resolves.toBeUndefined()
        })
    })
})
