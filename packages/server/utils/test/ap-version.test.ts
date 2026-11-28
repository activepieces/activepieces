import { ReleaseFeedEntry, ReleaseKind } from '@activepieces/shared'
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

describe('apVersionUtil.getRunningTag', () => {
    afterEach(() => {
        delete process.env['AP_RELEASE_TAG']
    })

    it('returns AP_RELEASE_TAG when the image sets it', async () => {
        await writeFile(join(tempDir, 'package.json'), JSON.stringify({ version: '0.92.3' }))
        process.env['AP_RELEASE_TAG'] = '0.92.3-hotfix.2'
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getRunningTag()).toBe('0.92.3-hotfix.2')
        expect(apVersionUtil.getCurrentRelease()).toBe('0.92.3')
    })

    it('falls back to package.json when AP_RELEASE_TAG is unset or empty', async () => {
        await writeFile(join(tempDir, 'package.json'), JSON.stringify({ version: '0.93.0' }))
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getRunningTag()).toBe('0.93.0')
        process.env['AP_RELEASE_TAG'] = ''
        expect(apVersionUtil.getRunningTag()).toBe('0.93.0')
    })
})

describe('apVersionUtil.getLatestRelease', () => {
    it('returns the highest minor or patch tag and ignores rc and hotfix tags', async () => {
        const apVersionUtil = await loadApVersionUtil()
        const entries = [
            feedEntry({ tag: '0.93.0', kind: ReleaseKind.MINOR }),
            feedEntry({ tag: '0.93.2', kind: ReleaseKind.PATCH }),
            feedEntry({ tag: '0.94.0-rc.1', kind: ReleaseKind.RC }),
            feedEntry({ tag: '0.93.2-hotfix.1', kind: ReleaseKind.HOTFIX }),
            feedEntry({ tag: '0.92.10', kind: ReleaseKind.PATCH }),
        ]
        expect(apVersionUtil.getLatestRelease({ entries })).toBe('0.93.2')
    })

    it('skips releases marked avoid', async () => {
        const apVersionUtil = await loadApVersionUtil()
        const entries = [
            { ...feedEntry({ tag: '0.93.2', kind: ReleaseKind.PATCH }), avoid: { reason: 'Upgrade to 0.93.1 or wait for 0.93.3.' } },
            feedEntry({ tag: '0.93.1', kind: ReleaseKind.PATCH }),
        ]
        expect(apVersionUtil.getLatestRelease({ entries })).toBe('0.93.1')
    })

    it('returns null for an empty feed instead of 0.0.0', async () => {
        const apVersionUtil = await loadApVersionUtil()
        expect(apVersionUtil.getLatestRelease({ entries: [] })).toBeNull()
    })
})

describe('apVersionUtil.getHotfixOnLine', () => {
    it('returns the highest hotfix on the running line that is newer than the running release', async () => {
        const apVersionUtil = await loadApVersionUtil()
        const entries = [
            feedEntry({ tag: '0.92.3-hotfix.1', kind: ReleaseKind.HOTFIX }),
            feedEntry({ tag: '0.92.3-hotfix.2', kind: ReleaseKind.HOTFIX }),
            feedEntry({ tag: '0.91.4-hotfix.1', kind: ReleaseKind.HOTFIX }),
            feedEntry({ tag: '0.93.0', kind: ReleaseKind.MINOR }),
        ]
        expect(apVersionUtil.getHotfixOnLine({ entries, running: '0.92.3' })).toBe('0.92.3-hotfix.2')
    })

    it('offers nothing to an instance already running the newest hotfix', async () => {
        const apVersionUtil = await loadApVersionUtil()
        const entries = [
            feedEntry({ tag: '0.92.3-hotfix.1', kind: ReleaseKind.HOTFIX }),
            feedEntry({ tag: '0.92.3-hotfix.2', kind: ReleaseKind.HOTFIX }),
        ]
        expect(apVersionUtil.getHotfixOnLine({ entries, running: '0.92.3-hotfix.2' })).toBeNull()
        expect(apVersionUtil.getHotfixOnLine({ entries, running: '0.92.3-hotfix.1' })).toBe('0.92.3-hotfix.2')
    })

    it('returns null when the only hotfixes on the line are older than the running release', async () => {
        const apVersionUtil = await loadApVersionUtil()
        const entries = [feedEntry({ tag: '0.92.1-hotfix.1', kind: ReleaseKind.HOTFIX })]
        expect(apVersionUtil.getHotfixOnLine({ entries, running: '0.92.3' })).toBeNull()
    })
})

function feedEntry({ tag, kind }: { tag: string, kind: ReleaseKind }): ReleaseFeedEntry {
    return {
        tag,
        kind,
        line: tag.split('.').slice(0, 2).join('.'),
        releasedAt: '2026-11-24T14:00:00.000Z',
        imageDigest: `sha256:${'a'.repeat(64)}`,
        migrations: { blocking: 0, background: 0, breaking: [] },
        notes: [],
        pieceMigrations: [],
        supportedUntil: null,
    }
}
