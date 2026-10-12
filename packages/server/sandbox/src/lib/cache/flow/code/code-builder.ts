import { existsSync } from 'node:fs'
import fs, { rm } from 'node:fs/promises'
import path from 'node:path'
import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { type ApLogger, cryptoUtils, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { ExecutionMode } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { CodeArtifact, SandboxSettings } from '../../../types'
import { bunRunner } from '../../../utils/bun-runner'
import { cacheState } from '../../cache-state'
import { codeCache } from './code-cache'
import { denoStepTranspiler } from './deno-step-transpiler'
import { packageDependencies } from './package-dependencies'

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

const DENO_TRANSPILER_VERSION = 'sucrase-v1'

const SUPERSEDED_BUILD_MIN_AGE_MS = 5 * 60 * 1000

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

        const currentHash = await cryptoUtils.hashObject(useDeno
            ? { sourceCode, useDeno, transpiler: DENO_TRANSPILER_VERSION }
            : { sourceCode, useDeno })
        const entryPath = useDeno
            ? codes.stepEntryPath({ flowVersionId, stepName: name })
            : codes.compiledStepPath({ flowVersionId, stepName: name })
        const transpiledPath = codes.transpiledStepPath({ flowVersionId, stepName: name })
        const packageJson = getPackageJson(sourceCode.packageJson, getSettings)
        const hasDependencies = Object.keys(JSON.parse(packageJson).dependencies ?? {}).length > 0
        const cache = cacheState(codePath)
        let buildStatus: CodeBuildStatus = 'success'
        const { cacheHit } = await cache.getOrSetCache({
            key: codePath,
            cacheMiss: (value: string) => {
                const entryExists = useDeno
                    ? existsSync(transpiledPath) || existsSync(entryPath)
                    : existsSync(entryPath)
                return value !== currentHash
                    || !entryExists
                    || (useDeno && hasDependencies && !existsSync(path.join(codePath, 'node_modules')))
            },
            installFn: async () => {
                const stagingPath = `${codePath}-staging-${nanoid()}`
                const stagingEntryPath = path.join(stagingPath, path.basename(entryPath))
                const stagingTranspiledPath = path.join(stagingPath, path.basename(transpiledPath))
                try {
                    await fileSystemUtils.threadSafeMkdir(stagingPath)

                    const installError = await wideEvent.timed({
                        name: 'codeDeps',
                        fn: async () => {
                            const { error } = await tryCatch(() => installDependencies({
                                path: stagingPath,
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
                            entryPath: stagingEntryPath,
                            useDeno,
                            errorMessage: `Failed to install dependencies. ${installError ?? 'error installing dependencies'}`,
                        })
                        await tryCatch(() => rm(path.join(stagingPath, 'node_modules'), { recursive: true }))
                        buildStatus = 'install-failed'
                        await swapIntoPlace({ stagingPath, targetPath: codePath })
                        return currentHash
                    }

                    if (useDeno) {
                        await wideEvent.timed({
                            name: 'codeCompile',
                            fn: async () => {
                                await fs.writeFile(stagingEntryPath, sourceCode.code, 'utf8')
                                const { data: transpiled, error } = await tryCatch(() => denoStepTranspiler.toCommonJs({ source: sourceCode.code }))
                                if (error !== null || transpiled.fallbackToEsm === true) {
                                    const fallbackError = error ?? transpiled?.error
                                    if (!isNil(fallbackError)) {
                                        log.info({ codePath, error: fallbackError }, 'Deno step transpile failed, falling back to raw source')
                                    }
                                    return
                                }
                                await fs.writeFile(stagingTranspiledPath, transpiled.code, 'utf8')
                            },
                        })
                        await swapIntoPlace({ stagingPath, targetPath: codePath })
                        return currentHash
                    }

                    const compileError = await wideEvent.timed({
                        name: 'codeCompile',
                        fn: async () => {
                            const { error } = await tryCatch(() => compileCode({
                                path: stagingPath,
                                code: sourceCode.code,
                            }, log))
                            if (error) {
                                log.info({ codePath, error }, 'Compilation error')
                                await writeInvalidArtifact({
                                    entryPath: stagingEntryPath,
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
                    await tryCatch(() => rm(path.join(stagingPath, 'node_modules'), { recursive: true }))
                    await swapIntoPlace({ stagingPath, targetPath: codePath })
                    return currentHash
                }
                finally {
                    await tryCatch(() => rm(stagingPath, { recursive: true, force: true }))
                }
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

async function swapIntoPlace({ stagingPath, targetPath }: SwapIntoPlaceParams): Promise<void> {
    const buildPath = stagingPath.replace('-staging-', '-build-')
    await fs.rename(stagingPath, buildPath)

    const keep = new Set([path.basename(buildPath)])
    const { data: previousTarget } = await tryCatch(() => fs.readlink(targetPath))
    if (!isNil(previousTarget)) {
        keep.add(path.basename(previousTarget))
    }

    const linkPath = `${buildPath}-link`
    await tryCatch(() => rm(linkPath, { force: true }))
    await fs.symlink(path.basename(buildPath), linkPath)

    const attempts = 3
    let lastError: Error | null = null
    let published = false
    for (let attempt = 0; attempt < attempts; attempt++) {
        const { error } = await tryCatch(() => fs.rename(linkPath, targetPath))
        if (error === null) {
            published = true
            break
        }
        lastError = error
        const legacyDirPath = `${targetPath}-build-legacy-${nanoid()}`
        const { error: moveError } = await tryCatch(() => fs.rename(targetPath, legacyDirPath))
        if (moveError === null) {
            keep.add(path.basename(legacyDirPath))
        }
    }
    if (!published) {
        throw new Error(`Failed to publish the built code step at ${targetPath}: ${lastError?.message}`)
    }

    await cleanupSupersededBuilds({ targetPath, keep })
}

async function cleanupSupersededBuilds({ targetPath, keep }: CleanupSupersededBuildsParams): Promise<void> {
    const parentDir = path.dirname(targetPath)
    const buildPrefix = `${path.basename(targetPath)}-build-`
    const { data: siblings } = await tryCatch(() => fs.readdir(parentDir))
    if (isNil(siblings)) {
        return
    }
    const superseded = siblings.filter((name) => name.startsWith(buildPrefix) && !keep.has(name))
    await Promise.all(superseded.map(async (name) => tryCatch(async () => {
        const siblingPath = path.join(parentDir, name)
        const { mtimeMs } = await fs.lstat(siblingPath)
        const oldEnoughToNotBeMidPublish = Date.now() - mtimeMs > SUPERSEDED_BUILD_MIN_AGE_MS
        if (oldEnoughToNotBeMidPublish) {
            await rm(siblingPath, { recursive: true, force: true })
        }
    })))
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

type SwapIntoPlaceParams = {
    stagingPath: string
    targetPath: string
}

type CleanupSupersededBuildsParams = {
    targetPath: string
    keep: Set<string>
}

type WriteInvalidArtifactParams = {
    entryPath: string
    useDeno: boolean
    errorMessage: string
}

export type CodeBuildStatus = 'success' | 'install-failed' | 'compile-failed'
