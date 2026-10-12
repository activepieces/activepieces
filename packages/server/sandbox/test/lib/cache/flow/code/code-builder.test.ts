import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { lstat, mkdir, readdir, readFile, realpath, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ExecutionMode, FlowVersionState, NetworkMode } from '@activepieces/shared'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { installMock, buildMock, transpileMock } = vi.hoisted(() => ({
    installMock: vi.fn(),
    buildMock: vi.fn(),
    transpileMock: vi.fn(),
}))

vi.mock('../../../../../src/lib/utils/bun-runner', () => ({
    bunRunner: () => ({ install: installMock, build: buildMock }),
}))

vi.mock('../../../../../src/lib/cache/flow/code/deno-step-transpiler', () => ({
    denoStepTranspiler: { toCommonJs: transpileMock },
}))

// eslint-disable-next-line import/first
import { codeBuilder } from '../../../../../src/lib/cache/flow/code/code-builder'
// eslint-disable-next-line import/first
import { codeCache } from '../../../../../src/lib/cache/flow/code/code-cache'
// eslint-disable-next-line import/first
import { SandboxSettings } from '../../../../../src/lib/types'

const folders: string[] = []

function uniqueFolder(): string {
    const folder = join(tmpdir(), `code-builder-test-${randomUUID()}`)
    folders.push(folder)
    return folder
}

function createNoopLog(): ApLogger {
    const log: ApLogger = {
        level: 'silent',
        silent: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        fatal: () => undefined,
        debug: () => undefined,
        trace: () => undefined,
        child: () => log,
    }
    return log
}

const noopLog = createNoopLog()

const getSettings = (): SandboxSettings => ({
    EXECUTION_MODE: ExecutionMode.SANDBOX_CODE_AND_PROCESS,
    DEV_PIECES: [],
    ENVIRONMENT: 'PRODUCTION',
    REUSE_SANDBOX: undefined,
    FLOW_TIMEOUT_SECONDS: 600,
    MAX_FILE_SIZE_MB: 10,
    MAX_FLOW_RUN_LOG_SIZE_MB: 10,
    NETWORK_MODE: NetworkMode.UNRESTRICTED,
    SANDBOX_MEMORY_LIMIT: '256',
    SANDBOX_PROPAGATED_ENV_VARS: [],
    SSRF_ALLOW_LIST: [],
})

const SOURCE = 'export const code = async () => 42'

function buildArtifact(packageJson: string, useDeno = true) {
    return {
        name: 'step_1',
        flowVersionId: `fv-${randomUUID()}`,
        flowVersionState: FlowVersionState.LOCKED,
        sourceCode: {
            code: SOURCE,
            packageJson,
        },
        useDeno,
    }
}

function mockInstallSuccess(): void {
    installMock.mockImplementation(async ({ path }: { path: string }) => {
        await mkdir(join(path, 'node_modules'), { recursive: true })
        return { stdout: '', stderr: '' }
    })
}

async function runStub(stubTs: string): Promise<unknown> {
    const moduleExports: { code?: (params: unknown) => Promise<unknown> } = {}
    // Executing the generated stub proves it is syntactically valid; the ESM
    // export is rewritten to an assignment so it runs under new Function.
    new Function('exports', stubTs.replace('export const code', 'exports.code'))(moduleExports)
    return moduleExports.code!({})
}

function mockBuildSuccess(): void {
    buildMock.mockImplementation(async ({ outputFile }: { outputFile: string }) => {
        await writeFile(outputFile, 'exports.code = async (params) => params', 'utf8')
        return { stdout: '', stderr: '' }
    })
}

const TRANSPILED_SOURCE = 'exports.code = async () => 42'

beforeEach(() => {
    installMock.mockReset()
    buildMock.mockReset()
    transpileMock.mockReset()
    transpileMock.mockResolvedValue({ code: TRANSPILED_SOURCE })
})

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
})

describe('codeBuilder.processCodeStep', () => {
    it('degrades a dependency-install failure into a runtime-throwing stub instead of throwing', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"python":"13.4"}}')
        installMock.mockRejectedValue(
            new Error('Exit 1\nstderr: error: No version matching "13.4" found for specifier "python"'),
        )

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('install-failed')

        const stubPath = codeCache(codesFolderPath).stepEntryPath({
            flowVersionId: artifact.flowVersionId,
            stepName: artifact.name,
        })
        const stub = await readFile(stubPath, 'utf8')

        await expect(runStub(stub)).rejects.toThrow('Failed to install dependencies')
        await expect(runStub(stub)).rejects.toThrow('No version matching "13.4"')
    })

    it('escapes backticks, template placeholders, and newlines in the install error message', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        installMock.mockRejectedValue(new Error('boom `backtick` and ${injection}\nsecond line'))

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('install-failed')

        const stubPath = codeCache(codesFolderPath).stepEntryPath({
            flowVersionId: artifact.flowVersionId,
            stepName: artifact.name,
        })
        const stub = await readFile(stubPath, 'utf8')

        // runStub would throw SyntaxError if the message were interpolated unescaped.
        await expect(runStub(stub)).rejects.toThrow('boom `backtick` and ${injection}')
    })

    it('transpiles a deno step to index.cjs, keeps the raw index.ts beside it, and keeps node_modules', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        mockInstallSuccess()

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('success')

        expect(installMock).toHaveBeenCalledTimes(1)
        expect(transpileMock).toHaveBeenCalledWith({ source: SOURCE })
        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        await expect(readFile(codeCache(codesFolderPath).transpiledStepPath(ref), 'utf8')).resolves.toBe(TRANSPILED_SOURCE)
        await expect(readFile(codeCache(codesFolderPath).stepEntryPath(ref), 'utf8')).resolves.toBe(SOURCE)
        expect(existsSync(join(codeCache(codesFolderPath).stepDir(ref), 'node_modules'))).toBe(true)
        await expect(readFile(join(codeCache(codesFolderPath).stepDir(ref), 'package.json'), 'utf8')).resolves.toContain('@types/node')
    })

    it('falls back to the raw index.ts when the transpiler asks for ESM (top-level await)', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{}')
        transpileMock.mockResolvedValue({ fallbackToEsm: true })

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('success')

        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        await expect(readFile(codeCache(codesFolderPath).stepEntryPath(ref), 'utf8')).resolves.toBe(SOURCE)
        expect(existsSync(codeCache(codesFolderPath).transpiledStepPath(ref))).toBe(false)
    })

    it('falls back to the raw index.ts when the transpiler fails, without failing the build', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{}')
        transpileMock.mockRejectedValue(new Error('deno exploded'))

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('success')

        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        await expect(readFile(codeCache(codesFolderPath).stepEntryPath(ref), 'utf8')).resolves.toBe(SOURCE)
    })

    it('compiles a legacy step (useDeno false) to index.js and removes node_modules', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}', false)
        mockInstallSuccess()
        mockBuildSuccess()

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('success')

        expect(buildMock).toHaveBeenCalledTimes(1)
        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        await expect(readFile(codeCache(codesFolderPath).compiledStepPath(ref), 'utf8')).resolves.toContain('exports.code')
        expect(existsSync(join(codeCache(codesFolderPath).stepDir(ref), 'node_modules'))).toBe(false)
    })

    it('degrades a legacy compile failure into a runtime-throwing index.js stub with status compile-failed', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{}', false)
        mockInstallSuccess()
        buildMock.mockRejectedValue(new Error('Unexpected token'))

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('compile-failed')

        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        const stub = await readFile(codeCache(codesFolderPath).compiledStepPath(ref), 'utf8')
        await expect(runStub(stub)).rejects.toThrow('Compilation Error')
        await expect(runStub(stub)).rejects.toThrow('Unexpected token')
    })

    it('rebuilds when the same source flips between deno and legacy', async () => {
        const codesFolderPath = uniqueFolder()
        const denoArtifact = buildArtifact('{}', true)
        const legacyArtifact = { ...denoArtifact, useDeno: false }
        mockInstallSuccess()
        mockBuildSuccess()
        const builder = codeBuilder(noopLog, getSettings)

        await expect(builder.processCodeStep({ artifact: denoArtifact, codesFolderPath })).resolves.toBe('success')
        expect(buildMock).not.toHaveBeenCalled()

        await expect(builder.processCodeStep({ artifact: legacyArtifact, codesFolderPath })).resolves.toBe('success')
        expect(buildMock).toHaveBeenCalledTimes(1)

        const ref = { flowVersionId: denoArtifact.flowVersionId, stepName: denoArtifact.name }
        expect(existsSync(codeCache(codesFolderPath).compiledStepPath(ref))).toBe(true)
    })

    it('does not cache a transient install failure — the next build re-runs install and self-heals (GIT-1608)', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        installMock.mockRejectedValueOnce(new Error('Exit 1\nstderr: FileNotFound: copying file ts4.8/stream/web.d.ts'))

        const builder = codeBuilder(noopLog, getSettings)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('install-failed')
        mockInstallSuccess()
        // Unchanged source must NOT be served from cache — bun is retried.
        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')

        expect(installMock).toHaveBeenCalledTimes(2)
    })

    it('does not cache a compile failure — the next build re-runs esbuild and self-heals (GIT-1864)', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}', false)
        mockInstallSuccess()
        buildMock.mockRejectedValueOnce(new Error('Could not resolve "jsrsasign"'))

        const builder = codeBuilder(noopLog, getSettings)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('compile-failed')
        mockBuildSuccess()
        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')

        expect(buildMock).toHaveBeenCalledTimes(2)
    })

    it('does not leave a stale hash behind when a rebuild of an already-cached step fails', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}', false)
        const entryPath = codeCache(codesFolderPath).compiledStepPath({
            flowVersionId: artifact.flowVersionId,
            stepName: artifact.name,
        })
        mockInstallSuccess()
        mockBuildSuccess()

        const builder = codeBuilder(noopLog, getSettings)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')

        await rm(entryPath)
        buildMock.mockRejectedValueOnce(new Error('Could not resolve "jsrsasign"'))

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('compile-failed')
        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')

        expect(buildMock).toHaveBeenCalledTimes(3)
    })

    it('rebuilds when the entry module was deleted out of band, instead of serving a phantom cache hit', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        const transpiledPath = codeCache(codesFolderPath).transpiledStepPath(ref)
        const rawEntryPath = codeCache(codesFolderPath).stepEntryPath(ref)
        mockInstallSuccess()

        const builder = codeBuilder(noopLog, getSettings)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')
        expect(installMock).toHaveBeenCalledTimes(1)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')
        expect(installMock).toHaveBeenCalledTimes(1)

        await rm(transpiledPath)
        await rm(rawEntryPath)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')
        expect(installMock).toHaveBeenCalledTimes(2)
        await expect(readFile(transpiledPath, 'utf8')).resolves.toBe(TRANSPILED_SOURCE)
        await expect(readFile(rawEntryPath, 'utf8')).resolves.toBe(SOURCE)
    })

    it('rebuilds when node_modules was deleted out of band and the step declares dependencies', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        const stepDir = codeCache(codesFolderPath).stepDir({
            flowVersionId: artifact.flowVersionId,
            stepName: artifact.name,
        })
        mockInstallSuccess()

        const builder = codeBuilder(noopLog, getSettings)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')
        expect(installMock).toHaveBeenCalledTimes(1)

        await rm(join(stepDir, 'node_modules'), { recursive: true })

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')
        expect(installMock).toHaveBeenCalledTimes(2)
    })

    it('builds once when concurrent runs provision the same step, instead of each rebuilding over the others', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        const entryPath = codeCache(codesFolderPath).transpiledStepPath({
            flowVersionId: artifact.flowVersionId,
            stepName: artifact.name,
        })
        mockInstallSuccess()

        const builder = codeBuilder(noopLog, getSettings)

        const concurrentCount = 5
        const statuses = await Promise.all(
            Array.from({ length: concurrentCount }, () => builder.processCodeStep({ artifact, codesFolderPath })),
        )

        expect(statuses).toEqual(Array.from({ length: concurrentCount }, () => 'success'))
        expect(installMock).toHaveBeenCalledTimes(1)
        await expect(readFile(entryPath, 'utf8')).resolves.toBe(TRANSPILED_SOURCE)
    })
})

describe('codeBuilder atomic step builds', () => {
    it('keeps the previous build fully readable while a rebuild runs, then swaps the new one in', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{}')
        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        const entryPath = codeCache(codesFolderPath).stepEntryPath(ref)

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('success')

        const changedSource = 'export const code = async () => 43'
        const changedArtifact = { ...artifact, sourceCode: { ...artifact.sourceCode, code: changedSource } }
        let entryDuringRebuild: string | null = null
        transpileMock.mockImplementation(async () => {
            entryDuringRebuild = await readFile(entryPath, 'utf8')
            return { code: TRANSPILED_SOURCE }
        })

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact: changedArtifact, codesFolderPath }),
        ).resolves.toBe('success')

        expect(entryDuringRebuild).toBe(SOURCE)
        await expect(readFile(entryPath, 'utf8')).resolves.toBe(changedSource)
    })

    it('leaves no staging directories behind after successful and failed builds', async () => {
        const codesFolderPath = uniqueFolder()
        const okArtifact = buildArtifact('{}')
        await codeBuilder(noopLog, getSettings).processCodeStep({ artifact: okArtifact, codesFolderPath })

        const failedArtifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        installMock.mockImplementation(async ({ path }: { path: string }) => {
            await mkdir(join(path, 'node_modules', 'half-written-pkg'), { recursive: true })
            throw new Error('install interrupted')
        })
        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact: failedArtifact, codesFolderPath }),
        ).resolves.toBe('install-failed')

        for (const artifact of [okArtifact, failedArtifact]) {
            const stepDir = codeCache(codesFolderPath).stepDir({ flowVersionId: artifact.flowVersionId, stepName: artifact.name })
            const siblings = await readdir(join(stepDir, '..'))
            expect(siblings.filter((name) => name.includes('-staging-'))).toEqual([])
        }

        const failedStepDir = codeCache(codesFolderPath).stepDir({ flowVersionId: failedArtifact.flowVersionId, stepName: failedArtifact.name })
        expect(existsSync(join(failedStepDir, 'node_modules'))).toBe(false)
        await expect(readFile(join(failedStepDir, 'index.ts'), 'utf8')).resolves.toContain('install interrupted')
    })
})

describe('codeBuilder publication never deletes the live build', () => {
    it('keeps the previous build fully readable through an independent builder publishing a replacement', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        const stepDir = codeCache(codesFolderPath).stepDir(ref)
        mockInstallSuccess()

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('success')

        const liveBuildDir = await realpath(stepDir)
        await expect(readFile(join(liveBuildDir, 'index.ts'), 'utf8')).resolves.toBe(SOURCE)

        const changedSource = 'export const code = async () => 43'
        const changedArtifact = { ...artifact, sourceCode: { ...artifact.sourceCode, code: changedSource } }
        let liveEntryDuringPublication: string | null = null
        transpileMock.mockImplementation(async () => {
            liveEntryDuringPublication = await readFile(join(liveBuildDir, 'index.ts'), 'utf8')
            return { code: TRANSPILED_SOURCE }
        })

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact: changedArtifact, codesFolderPath }),
        ).resolves.toBe('success')

        expect(liveEntryDuringPublication).toBe(SOURCE)
        await expect(readFile(join(liveBuildDir, 'index.ts'), 'utf8')).resolves.toBe(SOURCE)
        expect(existsSync(join(liveBuildDir, 'node_modules'))).toBe(true)
        await expect(readFile(join(stepDir, 'index.ts'), 'utf8')).resolves.toBe(changedSource)
        expect(await realpath(stepDir)).not.toBe(liveBuildDir)
    })

    it('garbage-collects builds two generations old, keeping the current and previous ones', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{}')
        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        const stepDir = codeCache(codesFolderPath).stepDir(ref)
        const buildDirs: string[] = []

        for (const source of [SOURCE, 'export const code = async () => 2', 'export const code = async () => 3']) {
            const versionArtifact = { ...artifact, sourceCode: { ...artifact.sourceCode, code: source } }
            await expect(
                codeBuilder(noopLog, getSettings).processCodeStep({ artifact: versionArtifact, codesFolderPath }),
            ).resolves.toBe('success')
            buildDirs.push(await realpath(stepDir))
            const backdated = new Date(Date.now() - 10 * 60 * 1000)
            for (const dir of buildDirs) {
                if (existsSync(dir)) {
                    await utimes(dir, backdated, backdated)
                }
            }
        }

        expect(existsSync(buildDirs[0])).toBe(false)
        expect(existsSync(buildDirs[1])).toBe(true)
        expect(await realpath(stepDir)).toBe(buildDirs[2])
    })

    it('upgrades a pre-symlink real step directory in place, preserving it for in-flight runs', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{}')
        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        const stepDir = codeCache(codesFolderPath).stepDir(ref)
        await mkdir(stepDir, { recursive: true })
        await writeFile(join(stepDir, 'index.ts'), 'legacy-layout-content', 'utf8')

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('success')

        expect((await lstat(stepDir)).isSymbolicLink()).toBe(true)
        await expect(readFile(join(stepDir, 'index.ts'), 'utf8')).resolves.toBe(SOURCE)
        const siblings = await readdir(join(stepDir, '..'))
        const legacyDir = siblings.find((name) => name.includes('-build-legacy-'))
        expect(legacyDir).toBeDefined()
        await expect(readFile(join(stepDir, '..', legacyDir!, 'index.ts'), 'utf8')).resolves.toBe('legacy-layout-content')
    })
})
