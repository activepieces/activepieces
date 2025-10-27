import fs, { rm } from 'node:fs/promises'
import path from 'node:path'
import { cryptoUtils, fileSystemUtils } from '@activepieces/server-shared'
import { ExecutionMode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { CodeArtifact } from '../compute/engine-runner-types'
import { workerMachine } from '../utils/machine'
import { cacheState, NO_SAVE_GUARD } from './cache-state'
import { packageManager } from './package-manager'

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

export const codeBuilder = (log: FastifyBaseLogger) => ({
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
        const flowVersionPath = this.getCodesFolder({
            codesFolderPath,
            flowVersionId,
        })
        const codePath = path.join(flowVersionPath, name)
        log.debug({
            message: 'CodeBuilder#processCodeStep',
            sourceCode,
            name,
            codePath,
        })

        const currentHash = await cryptoUtils.hashObject(sourceCode)
        const cache = cacheState(codePath, log)
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

                await installDependencies({
                    path: codePath,
                    packageJson: getPackageJson(packageJson),
                    log,
                })

                try {
                    await compileCode({
                        path: codePath,
                        code,
                        log,
                    })
                }
                catch (error: unknown) {
                    log.error(
                        error,
                        `[CodeBuilder#processCodeStep], codePath: ${codePath}`,
                    )

                    await handleCompilationError({
                        codePath,
                        error,
                    })
                }
                return currentHash
            },
            skipSave: NO_SAVE_GUARD,
        })
    },
})

function getPackageJson(packageJson: string): string {
    const isPackagesAllowed =
    workerMachine.getSettings().EXECUTION_MODE !==
    ExecutionMode.SANDBOX_CODE_ONLY
    if (isPackagesAllowed) {
        const packageJsonObject = JSON.parse(packageJson)
        return JSON.stringify({
            ...packageJsonObject,
            dependencies: {
                '@types/node': '18.17.1',
                ...(packageJsonObject?.dependencies ?? {}),
            },
        })
    }

    return '{"dependencies":{}}'
}

const installDependencies = async ({
    path,
    packageJson,
    log,
}: InstallDependenciesParams): Promise<void> => {
    const packageJsonObject = JSON.parse(packageJson)
    const dependencies = Object.keys(packageJsonObject?.dependencies ?? {})
    await fs.writeFile(`${path}/package.json`, packageJson, 'utf8')
    if (dependencies.length === 0) {
        return
    }
    await packageManager(log).add({
        path,
        dependencies: Object.entries(packageJsonObject.dependencies).map(
            ([dependency, spec]) => ({
                alias: dependency,
                spec: spec as string,
            }),
        ),
    })
}

const compileCode = async ({
    path,
    code,
    log,
}: CompileCodeParams): Promise<void> => {
    await fs.writeFile(`${path}/tsconfig.json`, TS_CONFIG_CONTENT, {
        encoding: 'utf8',
        flag: 'w',
    })
    await fs.writeFile(`${path}/index.ts`, code, { encoding: 'utf8', flag: 'w' })

    await packageManager(log).exec({
        path,
        command: 'tsc',
    })
}

const handleCompilationError = async ({
    codePath,
    error,
}: HandleCompilationErrorParams): Promise<void> => {
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
    log: FastifyBaseLogger
}

type InstallDependenciesParams = {
    path: string
    packageJson: string
    log: FastifyBaseLogger
}

type CompileCodeParams = {
    path: string
    code: string
    log: FastifyBaseLogger
}

type HandleCompilationErrorParams = {
    codePath: string
    error: unknown
}
