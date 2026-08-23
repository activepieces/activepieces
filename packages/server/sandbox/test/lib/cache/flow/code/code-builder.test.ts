import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ExecutionMode, FlowVersionState, NetworkMode } from '@activepieces/shared'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const installMock = vi.fn()

vi.mock('../../../../../src/lib/utils/bun-runner', () => ({
    bunRunner: () => ({ install: installMock }),
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

function buildArtifact(packageJson: string) {
    return {
        name: 'step_1',
        flowVersionId: `fv-${randomUUID()}`,
        flowVersionState: FlowVersionState.LOCKED,
        sourceCode: {
            code: SOURCE,
            packageJson,
        },
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

beforeEach(() => {
    installMock.mockReset()
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

    it('writes the source verbatim as index.ts and keeps node_modules when install succeeds', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        mockInstallSuccess()

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBe('success')

        expect(installMock).toHaveBeenCalledTimes(1)
        const ref = { flowVersionId: artifact.flowVersionId, stepName: artifact.name }
        await expect(readFile(codeCache(codesFolderPath).stepEntryPath(ref), 'utf8')).resolves.toBe(SOURCE)
        await expect(readFile(join(codeCache(codesFolderPath).stepDir(ref), 'package.json'), 'utf8')).resolves.toContain('@types/node')
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

    it('rebuilds when the entry module was deleted out of band, instead of serving a phantom cache hit', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        const entryPath = codeCache(codesFolderPath).stepEntryPath({
            flowVersionId: artifact.flowVersionId,
            stepName: artifact.name,
        })
        mockInstallSuccess()

        const builder = codeBuilder(noopLog, getSettings)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')
        expect(installMock).toHaveBeenCalledTimes(1)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')
        expect(installMock).toHaveBeenCalledTimes(1)

        await rm(entryPath)

        await expect(builder.processCodeStep({ artifact, codesFolderPath })).resolves.toBe('success')
        expect(installMock).toHaveBeenCalledTimes(2)
        await expect(readFile(entryPath, 'utf8')).resolves.toBe(SOURCE)
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
        const entryPath = codeCache(codesFolderPath).stepEntryPath({
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
        await expect(readFile(entryPath, 'utf8')).resolves.toBe(SOURCE)
    })
})
