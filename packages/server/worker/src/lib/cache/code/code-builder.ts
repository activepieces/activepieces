import fs, { rm } from 'node:fs/promises'
import path from 'node:path'
import { cryptoUtils, fileSystemUtils } from '@activepieces/server-utils'
import { ExecutionMode, FlowVersionState, SourceCode, tryCatch, tryCatchSync } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { Logger } from 'pino'
import { workerSettings } from '../../config/worker-settings'
import { cacheState, NO_SAVE_GUARD } from '../cache-state'
import { bunRunner } from './bun-runner'

const tracer = trace.getTracer('code-builder')

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

const INVALID_ARTIFACT_TEMPLATE = `
    exports.code = async (params) => {
      throw new Error(\`\${ERROR_MESSAGE}\`);
    };
    `

const INVALID_ARTIFACT_ERROR_PLACEHOLDER = '${ERROR_MESSAGE}'

export const codeBuilder = (log: Logger) => ({
    getCodesFolder({
        codesFolderPath,
        flowVersionId,
    }: {
        codesFolderPath: string
        flowVersionId: string
    }): string {
        return path.join(codesFolderPath, flowVersionId)
    },

    async processCodeStep({
        artifact,
        codesFolderPath,
    }: ProcessCodeStepParams): Promise<void> {
        const { sourceCode, flowVersionId, name } = artifact
        const flowVersionPath = path.join(codesFolderPath, flowVersionId)
        const codePath = path.join(flowVersionPath, name)
        log.debug({ sourceCode, name, codePath }, 'Processing code step')

        const currentHash = await cryptoUtils.hashObject(sourceCode)
        const cache = cacheState(codePath)
        await cache.getOrSetCache({
            key: codePath,
            cacheMiss: (value: string) => {
                return value !== currentHash
            },
            installFn: async () => {
                const { code, packageJson } = sourceCode

                const codeNeedCleanUp = await fileSystemUtils.fileExists(codePath)
                if (codeNeedCleanUp) {
                    await rm(codePath, { recursive: true })
                }

                await fileSystemUtils.threadSafeMkdir(codePath)

                await tracer.startActiveSpan('codeBuilder.installDependencies', async (depSpan) => {
                    try {
                        depSpan.setAttribute('code.path', codePath)
                        await installDependencies({
                            path: codePath,
                            packageJson: getPackageJson(packageJson),
                        }, log)
                        log.info({ path: codePath }, 'Installed dependencies')
                    }
                    finally {
                        depSpan.end()
                    }
                })

                await tracer.startActiveSpan('codeBuilder.compileCode', async (compileSpan) => {
                    try {
                        compileSpan.setAttribute('code.path', codePath)
                        const { error } = await tryCatch(() => compileCode({
                            path: codePath,
                            code,
                        }, log))
                        if (error) {
                            log.info({ codePath, error }, 'Compilation error')
                            compileSpan.recordException(error instanceof Error ? error : new Error(String(error)))
                            await handleCompilationError({ codePath, error })
                        }
                        else {
                            log.info({ codePath }, 'Compilation success')
                        }
                    }
                    finally {
                        compileSpan.end()
                    }
                })

                // node_modules is no longer needed after esbuild bundles everything into index.js
                await tryCatch(() => rm(path.join(codePath, 'node_modules'), { recursive: true }))
                return currentHash
            },
            skipSave: NO_SAVE_GUARD,
        })
    },
})

function isPackagesAllowed(): boolean {
    switch (workerSettings.getSettings().EXECUTION_MODE) {
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

function getPackageJson(packageJson: string): string {
    const packagedAllowed = isPackagesAllowed()
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

async function installDependencies({ path, packageJson }: InstallDependenciesParams, log: Logger): Promise<void> {
    await fs.writeFile(`${path}/package.json`, packageJson, 'utf8')
    const deps = Object.entries(JSON.parse(packageJson).dependencies ?? {})
    if (deps.length > 0) {
        await bunRunner(log).install({ path, filtersPath: [] })
    }
}

async function compileCode({ path, code }: CompileCodeParams, log: Logger): Promise<void> {
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

async function handleCompilationError({ codePath, error }: HandleCompilationErrorParams): Promise<void> {
    const errorHasStdout =
        typeof error === 'object' && error && 'stdout' in error
    const stdoutError = errorHasStdout ? error.stdout : undefined
    const genericError = `${error ?? 'error compiling'}`
    const errorMessage = `Compilation Error ${stdoutError ?? genericError}`

    const invalidArtifactContent = INVALID_ARTIFACT_TEMPLATE.replace(
        INVALID_ARTIFACT_ERROR_PLACEHOLDER,
        errorMessage,
    )

    await fs.writeFile(`${codePath}/index.js`, invalidArtifactContent, 'utf8')
}

type ProcessCodeStepParams = {
    artifact: CodeArtifact
    codesFolderPath: string
}

export type CodeArtifact = {
    name: string
    sourceCode: SourceCode
    flowVersionId: string
    flowVersionState: FlowVersionState
}

type InstallDependenciesParams = {
    path: string
    packageJson: string
}

type CompileCodeParams = {
    path: string
    code: string
}

type HandleCompilationErrorParams = {
    codePath: string
    error: unknown
}
