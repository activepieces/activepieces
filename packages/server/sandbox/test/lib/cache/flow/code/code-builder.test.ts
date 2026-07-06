import { randomUUID } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ExecutionMode, FlowVersionState, NetworkMode } from '@activepieces/shared'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const installMock = vi.fn()
const buildMock = vi.fn()

vi.mock('../../../../../src/lib/utils/bun-runner', () => ({
    bunRunner: () => ({ install: installMock, build: buildMock }),
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

function buildArtifact(packageJson: string) {
    return {
        name: 'step_1',
        flowVersionId: `fv-${randomUUID()}`,
        flowVersionState: FlowVersionState.LOCKED,
        sourceCode: {
            code: 'export const code = async () => 42',
            packageJson,
        },
    }
}

async function runStub(compiledJs: string): Promise<unknown> {
    const moduleExports: { code?: (params: unknown) => Promise<unknown> } = {}
    // Executing the generated stub proves it is syntactically valid JS.
    new Function('exports', compiledJs)(moduleExports)
    return moduleExports.code!({})
}

beforeEach(() => {
    installMock.mockReset()
    buildMock.mockReset()
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
        ).resolves.toBeUndefined()

        // Compilation is skipped once install fails — the step never reaches esbuild.
        expect(buildMock).not.toHaveBeenCalled()

        const stubPath = codeCache(codesFolderPath).compiledStepPath({
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
        ).resolves.toBeUndefined()

        const stubPath = codeCache(codesFolderPath).compiledStepPath({
            flowVersionId: artifact.flowVersionId,
            stepName: artifact.name,
        })
        const stub = await readFile(stubPath, 'utf8')

        // runStub would throw SyntaxError if the message were interpolated unescaped.
        await expect(runStub(stub)).rejects.toThrow('boom `backtick` and ${injection}')
    })

    it('proceeds to compile when dependency install succeeds', async () => {
        const codesFolderPath = uniqueFolder()
        const artifact = buildArtifact('{"dependencies":{"pkg":"1.0.0"}}')
        installMock.mockResolvedValue({ stdout: '', stderr: '' })
        buildMock.mockResolvedValue({ stdout: '', stderr: '' })

        await expect(
            codeBuilder(noopLog, getSettings).processCodeStep({ artifact, codesFolderPath }),
        ).resolves.toBeUndefined()

        expect(installMock).toHaveBeenCalledTimes(1)
        expect(buildMock).toHaveBeenCalledTimes(1)
    })
})
