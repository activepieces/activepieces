import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tempDir: string
let originalCwd: string

async function loadApVersionUtil(): Promise<typeof import('../src/ap-version')['apVersionUtil']> {
    vi.resetModules()
    const mod = await import('../src/ap-version')
    return mod.apVersionUtil
}

beforeEach(async () => {
    originalCwd = process.cwd()
    tempDir = await mkdtemp(join(tmpdir(), 'ap-version-test-'))
    process.chdir(tempDir)
})

afterEach(async () => {
    process.chdir(originalCwd)
    await rm(tempDir, { recursive: true, force: true })
})

describe('apVersionUtil.getCurrentRelease', () => {
    it('returns the version field from package.json in cwd', async () => {
        await writeFile(join(tempDir, 'package.json'), JSON.stringify({ version: '1.2.3' }))
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getCurrentRelease()).toBe('1.2.3')
    })

    // The fallback is a known correctness hazard: the worker version gate compares
    // worker vs app release with `!==`, so two independent processes that both fall
    // back to '0.0.0' compare equal and the gate passes even though neither version
    // was actually read. These tests pin the fallback so a regression is loud.
    it('falls back to 0.0.0 when package.json is missing', async () => {
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getCurrentRelease()).toBe('0.0.0')
    })

    it('falls back to 0.0.0 when package.json is not valid JSON', async () => {
        await writeFile(join(tempDir, 'package.json'), '{ not json')
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getCurrentRelease()).toBe('0.0.0')
    })

    it('falls back to 0.0.0 when version field is absent', async () => {
        await writeFile(join(tempDir, 'package.json'), JSON.stringify({ name: 'pkg' }))
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getCurrentRelease()).toBe('0.0.0')
    })

    it('falls back to 0.0.0 when version field is not a string', async () => {
        await writeFile(join(tempDir, 'package.json'), JSON.stringify({ version: 123 }))
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getCurrentRelease()).toBe('0.0.0')
    })

    it('caches the first read and ignores later changes to package.json', async () => {
        await writeFile(join(tempDir, 'package.json'), JSON.stringify({ version: '1.2.3' }))
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getCurrentRelease()).toBe('1.2.3')
        await writeFile(join(tempDir, 'package.json'), JSON.stringify({ version: '9.9.9' }))
        expect(apVersionUtil.getCurrentRelease()).toBe('1.2.3')
    })
})

describe('apVersionUtil.versionsAreCompatible', () => {
    it('returns true when both are the same real version', async () => {
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.versionsAreCompatible({ versionA: '1.2.3', versionB: '1.2.3' })).toBe(true)
    })

    it('returns false when both are real but different', async () => {
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.versionsAreCompatible({ versionA: '1.2.3', versionB: '1.2.4' })).toBe(false)
    })

    it('returns false when either side is undefined (old, pre-gate worker)', async () => {
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.versionsAreCompatible({ versionA: undefined, versionB: '1.2.3' })).toBe(false)
        expect(apVersionUtil.versionsAreCompatible({ versionA: '1.2.3', versionB: undefined })).toBe(false)
        expect(apVersionUtil.versionsAreCompatible({ versionA: undefined, versionB: undefined })).toBe(false)
    })

    it('returns false when either side is the 0.0.0 read-failure sentinel', async () => {
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.versionsAreCompatible({ versionA: '0.0.0', versionB: '1.2.3' })).toBe(false)
        expect(apVersionUtil.versionsAreCompatible({ versionA: '1.2.3', versionB: '0.0.0' })).toBe(false)
    })

    // The crux: two processes that both failed their read report '0.0.0' but may be on
    // different releases. Fail closed so a skewed dispatch can never slip through.
    it('returns false when both sides are 0.0.0 (both failed to read)', async () => {
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.versionsAreCompatible({ versionA: '0.0.0', versionB: '0.0.0' })).toBe(false)
    })
})
