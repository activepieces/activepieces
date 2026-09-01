import { existsSync } from 'node:fs'
import fs, { rm } from 'node:fs/promises'
import path from 'node:path'
import { tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { type ApLogger, cryptoUtils, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { ExecutionMode } from '@activepieces/shared'
import { CodeArtifact, SandboxSettings } from '../../../types'
import { bunRunner } from '../../../utils/bun-runner'
import { cacheState } from '../../cache-state'
import { codeCache } from './code-cache'

const INVALID_ARTIFACT_ERROR_PLACEHOLDER = '__AP_ERROR_MESSAGE__'

const INVALID_ARTIFACT_TEMPLATE = `
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
        const codePath = codeCache(codesFolderPath).stepDir({ flowVersionId, stepName: name })
        log.debug({ sourceCode, name, codePath }, 'Processing code step')

        const currentHash = await cryptoUtils.hashObject(sourceCode)
        const stepEntryPath = codeCache(codesFolderPath).stepEntryPath({ flowVersionId, stepName: name })
        const packageJson = getPackageJson(sourceCode.packageJson, getSettings)
        const hasDependencies = Object.keys(JSON.parse(packageJson).dependencies ?? {}).length > 0
        const cache = cacheState(codePath)
        let buildStatus: CodeBuildStatus = 'success'
        const { cacheHit } = await cache.getOrSetCache({
            key: codePath,
            cacheMiss: (value: string) => {
                return value !== currentHash
                    || !existsSync(stepEntryPath)
                    || (hasDependencies && !existsSync(path.join(codePath, 'node_modules')))
            },
            installFn: async () => {
                const codeNeedCleanUp = await fileSystemUtils.fileExists(codePath)
                if (codeNeedCleanUp) {
                    await rm(codePath, { recursive: true })
                }

                await fileSystemUtils.threadSafeMkdir(codePath)

                const installError = await wideEvent.timed({
                    name: 'codeDeps',
                    fn: async () => {
                        const { error } = await tryCatch(() => installDependencies({
                            path: codePath,
                            packageJson,
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
                    await handleInstallError({ codePath, error: installError })
                    await tryCatch(() => rm(path.join(codePath, 'node_modules'), { recursive: true }))
                    buildStatus = 'install-failed'
                    return currentHash
                }

                await fs.writeFile(stepEntryPath, sourceCode.code, 'utf8')
                return currentHash
            },
            // A transient bun install failure must self-heal: never cache the throwing stub, so the
            // next build re-runs install. See GIT-1608.
            skipSave: () => buildStatus === 'install-failed',
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
    return JSON.stringify({
        ...packageJsonObject,
        dependencies: {
            '@types/node': '18.17.1',
            ...(packageJsonObject?.['dependencies'] ?? {}),
        },
    })
}

async function installDependencies({ path, packageJson }: InstallDependenciesParams, log: ApLogger): Promise<void> {
    await fs.writeFile(`${path}/package.json`, packageJson, 'utf8')
    const deps = Object.entries(JSON.parse(packageJson).dependencies ?? {})
    if (deps.length > 0) {
        await bunRunner(log).install({ path, filtersPath: [] })
    }
}

async function handleInstallError({ codePath, error }: HandleInstallErrorParams): Promise<void> {
    const errorMessage = `Failed to install dependencies. ${error ?? 'error installing dependencies'}`
    const invalidArtifactContent = INVALID_ARTIFACT_TEMPLATE.replace(
        INVALID_ARTIFACT_ERROR_PLACEHOLDER,
        () => JSON.stringify(errorMessage),
    )
    await fs.writeFile(`${codePath}/index.ts`, invalidArtifactContent, 'utf8')
}

type ProcessCodeStepParams = {
    artifact: CodeArtifact
    codesFolderPath: string
}

type InstallDependenciesParams = {
    path: string
    packageJson: string
}

type HandleInstallErrorParams = {
    codePath: string
    error: unknown
}

export type CodeBuildStatus = 'success' | 'install-failed'
