import { existsSync } from 'node:fs'
import fs, { rm } from 'node:fs/promises'
import path from 'node:path'
import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { type ApLogger, cryptoUtils, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { ExecutionMode } from '@activepieces/shared'
import { CodeArtifact, SandboxSettings } from '../../../types'
import { bunRunner } from '../../../utils/bun-runner'
import { diskLock } from '../../../utils/distributed-lock'
import { cacheState } from '../../cache-state'
import { codeCache } from './code-cache'
import { denoStepTranspiler } from './deno-step-transpiler'
import { packageDependencies } from './package-dependencies'

const DENO_TRANSPILER_VERSION = 'sucrase-v1'

const INSTALL_LOCKS_DIR = '.install-locks'

const INSTALL_LOCK_TIMEOUT_MS = 15 * 60 * 1000

const INVALID_ARTIFACT_ERROR_PLACEHOLDER = '__AP_ERROR_MESSAGE__'

const INVALID_DENO_ARTIFACT_TEMPLATE = `
    export const code = async () => {
      throw new Error(${INVALID_ARTIFACT_ERROR_PLACEHOLDER});
    };
    `

export const codeBuilder = (log: ApLogger, getSettings: () => SandboxSettings) => ({
    async processCodeStep({
        artifact,
        codesFolderPath,
    }: ProcessCodeStepParams): Promise<CodeBuildStatus> {
        const { sourceCode, flowVersionId, name } = artifact
        const codes = codeCache(codesFolderPath)
        const codePath = codes.stepDir({ flowVersionId, stepName: name })
        log.debug({ sourceCode, name, codePath }, 'Processing code step')

        const currentHash = await cryptoUtils.hashObject({ sourceCode, useDeno: true, transpiler: DENO_TRANSPILER_VERSION })
        const entryPath = codes.stepEntryPath({ flowVersionId, stepName: name })
        const transpiledPath = codes.transpiledStepPath({ flowVersionId, stepName: name })
        const packageJson = getPackageJson(sourceCode.packageJson, getSettings)
        const hasDependencies = Object.keys(JSON.parse(packageJson).dependencies ?? {}).length > 0
        const cache = cacheState(codePath)
        let buildStatus: CodeBuildStatus = 'success'
        const { cacheHit } = await cache.getOrSetCache({
            key: codePath,
            cacheMiss: (value: string) => {
                const entryExists = existsSync(transpiledPath) || existsSync(entryPath)
                return value !== currentHash
                    || !entryExists
                    || (hasDependencies && !existsSync(path.join(codePath, 'node_modules')))
            },
            installFn: async () => {
                await fileSystemUtils.threadSafeMkdir(codePath)
                await cache.clear()
                await removeStaleBuildOutputs({ codes, flowVersionId, stepName: name })

                const installError = await wideEvent.timed({
                    name: 'codeDeps',
                    fn: async () => {
                        const { error } = await tryCatch(() => installDependencies({
                            path: codePath,
                            packageJson,
                            locksPath: path.join(codesFolderPath, INSTALL_LOCKS_DIR),
                        }, log))
                        if (error) {
                            log.info({ codePath, error }, 'Dependency installation error')
                        }
                        else {
                            log.info({ path: codePath }, 'Installed dependencies')
                        }
                        return error
                    },
                })

                if (installError) {
                    await writeInvalidArtifact({
                        entryPath,
                        errorMessage: `Failed to install dependencies. ${installError ?? 'error installing dependencies'}`,
                    })
                    await tryCatch(() => rm(path.join(codePath, 'node_modules'), { recursive: true }))
                    buildStatus = 'install-failed'
                    return currentHash
                }

                await wideEvent.timed({
                    name: 'codeCompile',
                    fn: async () => {
                        await fs.writeFile(entryPath, sourceCode.code, 'utf8')
                        const { data: transpiled, error } = await tryCatch(() => denoStepTranspiler.toCommonJs({ source: sourceCode.code }))
                        if (error !== null || transpiled.fallbackToEsm === true) {
                            const fallbackError = error ?? transpiled?.error
                            if (!isNil(fallbackError)) {
                                log.info({ codePath, error: fallbackError }, 'Deno step transpile failed, falling back to raw source')
                            }
                            return
                        }
                        await fs.writeFile(transpiledPath, transpiled.code, 'utf8')
                    },
                })
                return currentHash
            },
            skipSave: () => buildStatus !== 'success',
        })
        return cacheHit ? 'success' : buildStatus
    },
})

function isPackagesAllowed(getSettings: () => SandboxSettings): boolean {
    switch (getSettings().EXECUTION_MODE) {
        case ExecutionMode.SANDBOX_CODE_ONLY:
            return false
        case ExecutionMode.SANDBOX_CODE_AND_PROCESS:
        case ExecutionMode.UNSANDBOXED:
        case ExecutionMode.SANDBOX_PROCESS:
            return true
        default:
            return false
    }
}

function getPackageJson(packageJson: string, getSettings: () => SandboxSettings): string {
    const packagedAllowed = isPackagesAllowed(getSettings)
    if (!packagedAllowed) {
        return '{"dependencies":{}}'
    }
    const { data: parsedPackageJson, error: parseError } = tryCatchSync(() => JSON.parse(packageJson))
    const packageJsonObject = parseError ? {} : (parsedPackageJson as Record<string, unknown>)
    const requestedDependencies = packageDependencies.sanitize(packageJsonObject?.['dependencies'])
    return JSON.stringify({
        dependencies: {
            '@types/node': '18.17.1',
            ...requestedDependencies,
        },
    })
}

async function removeStaleBuildOutputs({ codes, flowVersionId, stepName }: RemoveStaleBuildOutputsParams): Promise<void> {
    const ref = { flowVersionId, stepName }
    await Promise.all([
        rm(codes.stepEntryPath(ref), { force: true }),
        rm(codes.compiledStepPath(ref), { force: true }),
        rm(codes.transpiledStepPath(ref), { force: true }),
    ])
}

async function installDependencies({ path, packageJson, locksPath }: InstallDependenciesParams, log: ApLogger): Promise<void> {
    await diskLock(locksPath).runExclusive({
        key: path,
        timeoutMs: INSTALL_LOCK_TIMEOUT_MS,
        fn: async () => {
            await fs.writeFile(`${path}/package.json`, packageJson, 'utf8')
            const deps = Object.entries(JSON.parse(packageJson).dependencies ?? {})
            if (deps.length > 0) {
                await bunRunner(log).install({ path, filtersPath: [], force: true })
            }
        },
    })
}

async function writeInvalidArtifact({ entryPath, errorMessage }: WriteInvalidArtifactParams): Promise<void> {
    const invalidArtifactContent = INVALID_DENO_ARTIFACT_TEMPLATE.replace(
        INVALID_ARTIFACT_ERROR_PLACEHOLDER,
        () => JSON.stringify(errorMessage),
    )
    await fs.writeFile(entryPath, invalidArtifactContent, 'utf8')
}

type ProcessCodeStepParams = {
    artifact: CodeArtifact
    codesFolderPath: string
}

type RemoveStaleBuildOutputsParams = {
    codes: ReturnType<typeof codeCache>
    flowVersionId: string
    stepName: string
}

type InstallDependenciesParams = {
    path: string
    packageJson: string
    locksPath: string
}

type WriteInvalidArtifactParams = {
    entryPath: string
    errorMessage: string
}

export type CodeBuildStatus = 'success' | 'install-failed'
