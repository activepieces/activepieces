import { mkdtemp, mkdir, symlink, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

    describe('assertPathInside', () => {
        it('should allow a target that lives directly inside the base directory', async () => {
            const target = join(tempDir, 'file.json')
            await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: target })).resolves.toBeUndefined()
        })

        it('should allow a nested target that does not yet exist', async () => {
            const target = join(tempDir, 'nested', 'deep', 'file.json')
            await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: target })).resolves.toBeUndefined()
        })

        it('should reject a target that escapes the base via ".."', async () => {
            const target = join(tempDir, '..', 'escape.json')
            await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: target })).rejects.toThrow(/path escape detected/)
        })

        it('should reject an absolute target that sits outside the base', async () => {
            const outside = join(tmpdir(), 'completely-outside.json')
            await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: outside })).rejects.toThrow(/path escape detected/)
        })

        it('should reject a target that escapes via a symlink inside the base', async () => {
            const outsideDir = await mkdtemp(join(tmpdir(), 'server-utils-test-outside-'))
            try {
                const symlinkInBase = join(tempDir, 'pointer')
                await symlink(outsideDir, symlinkInBase)
                const target = join(symlinkInBase, 'file.json')
                await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: target })).rejects.toThrow(/path escape detected/)
            }
            finally {
                await rm(outsideDir, { recursive: true, force: true })
            }
        })

        it('should reject a target that is itself a symlink pointing outside the base', async () => {
            const outsideDir = await mkdtemp(join(tmpdir(), 'server-utils-test-outside-'))
            const outsideFile = join(outsideDir, 'target.json')
            try {
                await writeFile(outsideFile, '{}')
                const symlinkFile = join(tempDir, 'inner.json')
                await symlink(outsideFile, symlinkFile)
                await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: symlinkFile })).rejects.toThrow(/path escape detected/)
            }
            finally {
                await rm(outsideDir, { recursive: true, force: true })
            }
        })

        it('should allow a symlink that stays inside the base', async () => {
            const innerReal = join(tempDir, 'real')
            await mkdir(innerReal, { recursive: true })
            const symlinkInBase = join(tempDir, 'alias')
            await symlink(innerReal, symlinkInBase)
            const target = join(symlinkInBase, 'file.json')
            await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: target })).resolves.toBeUndefined()
        })

        it('should reject when ".." in the missing tail escapes the base', async () => {
            const nestedDir = join(tempDir, 'inner')
            await mkdir(nestedDir, { recursive: true })
            const target = join(nestedDir, '..', '..', 'outside.json')
            await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: target })).rejects.toThrow(/path escape detected/)
        })

        it('should allow a target under a directory that exists inside the base', async () => {
            const nestedDir = join(tempDir, 'inner')
            await mkdir(nestedDir, { recursive: true })
            const target = join(nestedDir, 'file.json')
            await expect(fileSystemUtils.assertPathInside({ baseDir: tempDir, targetPath: target })).resolves.toBeUndefined()
        })
    })
})
