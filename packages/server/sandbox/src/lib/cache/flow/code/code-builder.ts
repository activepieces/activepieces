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

const TS_CONFIG_CONTENT = `
{
    "compilerOptions": {
        "lib": ["es2022", "dom"],
        "module": "commonjs",
        "target": "es2022",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "noUnusedLocals": false,
        "noUnusedParameters": false,
        "strict": false,
        "strictPropertyInitialization": false,
        "strictNullChecks": false,
        "strictFunctionTypes": false,
        "strictBindCallApply": false,
        "noImplicitAny": false,
        "noImplicitThis": false,
        "noImplicitReturns": false,
        "noFallthroughCasesInSwitch": false
    }
}
`

const INVALID_ARTIFACT_ERROR_PLACEHOLDER = '__AP_ERROR_MESSAGE__'

const INVALID_DENO_ARTIFACT_TEMPLATE = `
    export const code = async () => {
      throw new Error(${INVALID_ARTIFACT_ERROR_PLACEHOLDER});
    };
    `

const INVALID_LEGACY_ARTIFACT_TEMPLATE = `
    exports.code = async (params) => {
      throw new Error(${INVALID_ARTIFACT_ERROR_PLACEHOLDER});
    };
    `

export const codeBuilder = (log: ApLogger, getSettings: () => SandboxSettings) => ({
    async processCodeStep({
        artifact,
        codesFolderPath,
    }: ProcessCodeStepParams): Promise<CodeBuildStatus> {
        const { sourceCode, flowVersionId, name, useDeno } = artifact
        const codes = codeCache(codesFolderPath)
        const codePath = codes.stepDir({ flowVersionId, stepName: name })
        log.debug({ sourceCode, name, codePath, useDeno }, 'Processing code step')

        const currentHash = await cryptoUtils.hashObject({ sourceCode, useDeno })
        const entryPath = useDeno
            ? codes.stepEntryPath({ flowVersionId, stepName: name })
            : codes.compiledStepPath({ flowVersionId, stepName: name })
        const packageJson = getPackageJson(sourceCode.packageJson, getSettings)
        const hasDependencies = Object.keys(JSON.parse(packageJson).dependencies ?? {}).length > 0
        const cache = cacheState(codePath)
        let buildStatus: CodeBuildStatus = 'success'
        const { cacheHit } = await cache.getOrSetCache({
            key: codePath,
            cacheMiss: (value: string) => {
                return value !== currentHash
                    || !existsSync(entryPath)
                    || (useDeno && hasDependencies && !existsSync(path.join(codePath, 'node_modules')))
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
                    await writeInvalidArtifact({
                        entryPath,
                        useDeno,
                        errorMessage: `Failed to install dependencies. ${installError ?? 'error installing dependencies'}`,
                    })
                    await tryCatch(() => rm(path.join(codePath, 'node_modules'), { recursive: true }))
                    buildStatus = 'install-failed'
                    return currentHash
                }

                if (useDeno) {
                    await fs.writeFile(entryPath, sourceCode.code, 'utf8')
                    return currentHash
                }

                const compileError = await wideEvent.timed({
                    name: 'codeCompile',
                    fn: async () => {
                        const { error } = await tryCatch(() => compileCode({
                            path: codePath,
                            code: sourceCode.code,
                        }, log))
                        if (error) {
                            log.info({ codePath, error }, 'Compilation error')
                            await writeInvalidArtifact({
                                entryPath,
                                useDeno,
                                errorMessage: `Compilation Error ${error ?? 'error compiling'}`,
                            })
                        }
                        else {
                            log.info({ codePath }, 'Compilation success')
                        }
                        return error
                    },
                })
                if (compileError) {
                    buildStatus = 'compile-failed'
                }

                // node_modules is only needed at runtime by deno steps; the legacy bundle inlines it.
                await tryCatch(() => rm(path.join(codePath, 'node_modules'), { recursive: true }))
                return currentHash
            },
            // A transient bun install failure must self-heal: never cache the throwing stub, so the
            // next build re-runs install. Deterministic compile errors stay cached. See GIT-1608.
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

async function compileCode({ path, code }: CompileCodeParams, log: ApLogger): Promise<void> {
    await fs.writeFile(`${path}/tsconfig.json`, TS_CONFIG_CONTENT, {
        encoding: 'utf8',
        flag: 'w',
    })
    await fs.writeFile(`${path}/index.ts`, code, { encoding: 'utf8', flag: 'w' })

    await bunRunner(log).build({
        path,
        entryFile: `${path}/index.ts`,
        outputFile: `${path}/index.js`,
    })
}

async function writeInvalidArtifact({ entryPath, useDeno, errorMessage }: WriteInvalidArtifactParams): Promise<void> {
    const template = useDeno ? INVALID_DENO_ARTIFACT_TEMPLATE : INVALID_LEGACY_ARTIFACT_TEMPLATE
    const invalidArtifactContent = template.replace(
        INVALID_ARTIFACT_ERROR_PLACEHOLDER,
        () => JSON.stringify(errorMessage),
    )
    await fs.writeFile(entryPath, invalidArtifactContent, 'utf8')
}

type ProcessCodeStepParams = {
    artifact: CodeArtifact
    codesFolderPath: string
}

type InstallDependenciesParams = {
    path: string
    packageJson: string
}

type CompileCodeParams = {
    path: string
    code: string
}

type WriteInvalidArtifactParams = {
    entryPath: string
    useDeno: boolean
    errorMessage: string
}

export type CodeBuildStatus = 'success' | 'install-failed' | 'compile-failed'
